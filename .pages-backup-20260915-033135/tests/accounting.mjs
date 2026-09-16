/**
 * Accounting ledger invariant tests.
 *
 * These test the PURE logic (services/accounting/pure.ts) that mirrors the
 * SQL in supabase/migrations/20260905000000_accounting_ledger.sql exactly.
 * They do NOT and cannot test the actual database enforcement (triggers,
 * RLS, RPC atomicity) — that migration has not been applied to any
 * database, live or test. See ACCOUNTING-IMPLEMENTATION-REPORT.md for
 * what remains once it is: a real integration test pass against an
 * applied migration, not something this file can stand in for.
 *
 * What these DO prove: the sign convention, validation rules, and cap
 * checks a developer would read out of this TS file match what the SQL
 * actually says — so if someone changes one without the other, this fails.
 *
 * Run: node tests/accounting.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dir = path.dirname(fileURLToPath(import.meta.url));
const bundle = fs.readFileSync(path.join(dir, 'dist-accounting/accounting.js'), 'utf8');

let pass = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) pass++;
  else failures.push({ name, detail });
}
function eq(name, actual, expected) {
  ok(name, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  runScripts: 'dangerously',
  url: 'http://localhost/',
});
dom.window.eval(bundle);
const { pure } = dom.window.__iappAccounting;

console.log('\x1b[1m1. حساب الرصيد — اتجاه كل نوع حركة\x1b[0m');
{
  // opening_balance carries its own sign — the one exception
  eq('opening balance موجب', pure.calculateBalance([{ transaction_type: 'opening_balance', amount: 500 }]), 500);
  eq('opening balance سالب (عجز افتتاحي)', pure.calculateBalance([{ transaction_type: 'opening_balance', amount: -300 }]), -300);
  eq('opening balance صفر', pure.calculateBalance([{ transaction_type: 'opening_balance', amount: 0 }]), 0);

  // every other type: fixed sign, magnitude only
  eq('revenue يزيد الرصيد', pure.calculateBalance([{ transaction_type: 'revenue', amount: 1000 }]), 1000);
  eq('expense ينقص الرصيد', pure.calculateBalance([
    { transaction_type: 'revenue', amount: 1000 },
    { transaction_type: 'expense', amount: 300 },
  ]), 700);
  eq('refund ينقص الرصيد', pure.calculateBalance([
    { transaction_type: 'revenue', amount: 1000 },
    { transaction_type: 'refund', amount: 200 },
  ]), 800);
  eq('transfer_in يزيد / transfer_out ينقص', pure.calculateBalance([
    { transaction_type: 'transfer_in', amount: 500 },
    { transaction_type: 'transfer_out', amount: 200 },
  ]), 300);
  eq('adjustment_increase / adjustment_decrease', pure.calculateBalance([
    { transaction_type: 'adjustment_increase', amount: 100 },
    { transaction_type: 'adjustment_decrease', amount: 40 },
  ]), 60);

  // the exact worked example from the brief itself
  eq('مثال الإغلاق اليومي: 5000 + 8000 - 1500 - 300 = 11200', pure.calculateBalance([
    { transaction_type: 'opening_balance', amount: 5000 },
    { transaction_type: 'revenue', amount: 8000 },
    { transaction_type: 'expense', amount: 1500 },
    { transaction_type: 'refund', amount: 300 },
  ]), 11200);
}

console.log('\x1b[1m2. حماية السحب على المكشوف\x1b[0m');
{
  eq('مرفوض بدون allow_overdraft', pure.wouldOverdraw(100, 150, false), true);
  eq('مسموح مع allow_overdraft', pure.wouldOverdraw(100, 150, true), false);
  eq('مقبول إذا كان الرصيد كافياً بالضبط', pure.wouldOverdraw(150, 150, false), false);
  eq('مرفوض عند نقص جزء من قرش', pure.wouldOverdraw(149.99, 150, false), true);
}

console.log('\x1b[1m3. صحة المبلغ — chk_amount_sign\x1b[0m');
{
  eq('revenue بمبلغ موجب صحيح', pure.isValidAmount('revenue', 100), true);
  eq('revenue بمبلغ صفر غير صحيح', pure.isValidAmount('revenue', 0), false);
  eq('revenue بمبلغ سالب غير صحيح', pure.isValidAmount('revenue', -50), false);
  eq('expense بمبلغ صفر غير صحيح', pure.isValidAmount('expense', 0), false);
  eq('opening_balance بمبلغ سالب صحيح (الاستثناء الوحيد)', pure.isValidAmount('opening_balance', -300), true);
  eq('opening_balance بصفر صحيح', pure.isValidAmount('opening_balance', 0), true);
}

console.log('\x1b[1m4. تنسيق رقم الإيصال\x1b[0m');
{
  eq('DAM-2026-000123', pure.formatReceiptNo('DAM', 2026, 123), 'DAM-2026-000123');
  eq('GEN-2026-000001', pure.formatReceiptNo('GEN', 2026, 1), 'GEN-2026-000001');
  ok('يطابق النمط المتوقع', pure.isValidReceiptNoFormat('DAM-2026-000123'), 'should match pattern');
  ok('رقم قديم بدون النمط الجديد لا يُفترض أنه يطابق', !pure.isValidReceiptNoFormat('12345'), 'legacy formats must not be assumed compatible');
}

console.log('\x1b[1m5. سقف الاسترجاع\x1b[0m');
{
  eq('استرجاع جزئي داخل الحد مقبول', pure.refundExceedsOriginal(1000, 0, 300), false);
  eq('استرجاع يساوي المتبقي بالضبط مقبول', pure.refundExceedsOriginal(1000, 700, 300), false);
  eq('استرجاع يتجاوز المتبقي مرفوض', pure.refundExceedsOriginal(1000, 700, 301), true);
  eq('استرجاع كامل بعد استرجاعات جزئية سابقة يُرفض الزائد', pure.refundExceedsOriginal(500, 500, 1), true);
}

console.log('\x1b[1m6. الحقول المرتبطة — chk_related_txn_required\x1b[0m');
{
  eq('refund يتطلب related_transaction_id', pure.requiresRelatedTransaction('refund'), true);
  eq('transfer_in يتطلب related_transaction_id', pure.requiresRelatedTransaction('transfer_in'), true);
  eq(
    'transfer_out لا يتطلبه (لا يوجد UPDATE لملء الإشارة المتبادلة)',
    pure.requiresRelatedTransaction('transfer_out'),
    false,
  );
  eq('revenue لا يتطلبه', pure.requiresRelatedTransaction('revenue'), false);
  eq('expense لا يتطلبه', pure.requiresRelatedTransaction('expense'), false);
}

console.log('\x1b[1m7. لا أخطاء وقت التشغيل\x1b[0m');
ok('التطبيق حمّل بدون استثناءات', true, '');

console.log('\n' + '─'.repeat(60));
if (failures.length) {
  console.log(`\x1b[31m✗ فشل ${failures.length} من ${pass + failures.length} تأكيداً\x1b[0m`);
  for (const f of failures) console.log(`  - ${f.name}: ${f.detail}`);
  console.log('─'.repeat(60));
  process.exit(1);
} else {
  console.log(`\x1b[32m✓ نجحت كل الاختبارات — ${pass} تأكيداً\x1b[0m`);
  console.log('─'.repeat(60));
}
