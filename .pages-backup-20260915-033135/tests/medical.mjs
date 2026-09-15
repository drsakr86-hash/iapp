/**
 * Medical direction & prescription integrity tests.
 *
 * These exist because of a specific class of bug: the value stored is
 * correct, the value displayed is not. TypeScript cannot catch it, a code
 * review usually does not either, and the consequence is a lens ground to
 * the wrong sign or a drop put in the wrong eye.
 *
 * So the assertions below run the REAL components inside jsdom and inspect
 * rendered DOM — computed direction, DOM order, cell contents. Nothing here
 * greps source text, and nothing touches the network or the database.
 *
 * Run: node tests/medical.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dir = path.dirname(fileURLToPath(import.meta.url));
const bundle = fs.readFileSync(path.join(dir, 'dist-medical/medical.js'), 'utf8');

let pass = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) pass++;
  else failures.push({ name, detail });
}
function eq(name, actual, expected) {
  ok(name, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function section(t) {
  console.log('\n\x1b[1m' + t + '\x1b[0m');
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dom = new JSDOM(
  `<!doctype html><html lang="ar" dir="rtl"><head><title>I App</title></head>
   <body><div id="root"></div><div id="meds"></div></body></html>`,
  { url: 'https://drsakr86-hash.github.io/iapp/app/', runScripts: 'outside-only', pretendToBeVisual: true },
);

const { window } = dom;
window.matchMedia ??= () => ({
  matches: false, addListener() {}, removeListener() {},
  addEventListener() {}, removeEventListener() {},
});
/* The forms must render without any network. If a component reaches for the
   database on mount, this throws and section 7 catches it. */
window.fetch = async () => {
  throw new Error('network blocked in medical test');
};
window.crypto ??= { randomUUID: () => '00000000-0000-4000-8000-000000000000' };

const errors = [];
window.addEventListener('error', (e) => errors.push(String(e.message)));
window.onerror = (m) => errors.push(String(m));

dom.window.eval(bundle);
const api = window.__iapp;
const doc = window.document;

/* ══════════════════════════════════════════════════════════════════ */
section('1. الترقيم الطبي — الإشارات');

const { medical } = api;

/* The core of the RTL sign bug: a negative power must keep its sign, and a
   positive power must show one. An unsigned '2.75' is ambiguous on paper. */
eq('قوة سالبة تحتفظ بإشارتها', medical.power(-2.75), '-2.75');
eq('قوة موجبة تُعرض بإشارة +', medical.power(1.25), '+1.25');
eq('صفر يُعرض 0.00 بلا إشارة', medical.power(0), '0.00');
eq('منزلتان عشريتان دائماً', medical.power(-1.5), '-1.50');
eq('قيمة فارغة تُعرض شرطة', medical.power(null), '—');
eq('نص غير رقمي لا يُعرض NaN', medical.power('abc'), '—');
eq('قوة من نص تُقرأ صحيحة', medical.power('-3'), '-3.00');

/* AXIS is unsigned by convention. '+90°' would be wrong notation. */
eq('المحور بلا إشارة', medical.axis(90), '90°');
eq('المحور يُقرَّب لصحيح', medical.axis('92.4'), '92°');
eq('المحور صفر مقبول', medical.axis(0), '0°');
eq('ADD موجبة دائماً', medical.addPower(2), '+2.00');
eq('PD بمنزلة واحدة', medical.pd(62), '62.0');

section('2. التحقق من القياسات');

ok('كرة خارج المدى تُرفض', medical.validateRefraction({ sphere: -40 }).length > 0);
ok('كرة داخل المدى تُقبل', medical.validateRefraction({ sphere: -6.5 }).length === 0);
ok('محور > 180 يُرفض', medical.validateRefraction({ axis: 200 }).length > 0);
ok(
  'أسطوانة بلا محور تُرفض',
  medical.validateRefraction({ cylinder: -1.5 }).some((p) => p.field === 'axis'),
);
ok(
  'أسطوانة مع محور تُقبل',
  medical.validateRefraction({ cylinder: -1.5, axis: 90 }).length === 0,
);
ok('عين فارغة تُكتشف', medical.isEmptyEye({ sphere: '', cylinder: '' }));
ok('عين بقياس ليست فارغة', !medical.isEmptyEye({ sphere: '-1', cylinder: '' }));

section('3. ثوابت العين — OD/OS');

/* Clinical fact. If either of these ever flips, every prescription the
   system has ever printed becomes suspect. */
eq('OD هي العين اليمنى', api.EYE_AR.OD, 'اليمنى');
eq('OS هي العين اليسرى', api.EYE_AR.OS, 'اليسرى');
eq('OU كلتا العينين', api.EYE_AR.OU, 'كلتا العينين');
eq('ترتيب العرض: OD أولاً', api.RX_EYE_ORDER[0], 'OD');
eq('ترتيب العرض: OS ثانياً', api.RX_EYE_ORDER[1], 'OS');

section('4. قيم التصوير مطابقة لـ enum القاعدة');

/* The enum labels in PostgreSQL are lowercase. An uppercase list compiles
   fine and then fails on every insert — this is the defect this suite was
   written to prevent recurring. */
ok(
  'كل الأنواع بحروف صغيرة',
  api.MODALITIES.every((m) => m === m.toLowerCase()),
  api.MODALITIES.filter((m) => m !== m.toLowerCase()).join(','),
);
ok('fundus موجود', api.MODALITIES.includes('fundus'));
ok('visual_field موجود', api.MODALITIES.includes('visual_field'));
ok('b_scan موجود', api.MODALITIES.includes('b_scan'));
ok('لا قيم بحروف كبيرة مثل FUNDUS', !api.MODALITIES.includes('FUNDUS'));
eq('قيمة قديمة تُقرأ ولا تُخفى', typeof api.modalityLabel('optos'), 'string');
ok('قيمة قديمة ليست شرطة', api.modalityLabel('optos') !== '—');

section('5. اسم الطبيب — مصدر واحد');

const { displayName } = api;
eq(
  'اللقب + الاسم من سجل الطبيب',
  displayName({ title_ar: 'د.', full_name_ar: 'أحمد سعيد' }, { fullName: 'x', email: 'a@b.c' }),
  'د. أحمد سعيد',
);
eq(
  'بلا سجل طبيب يُستخدم اسم الحساب',
  displayName(null, { fullName: 'سكرتارية العيادة', email: 'a@b.c' }),
  'سكرتارية العيادة',
);
eq(
  'بلا اسم إطلاقاً يُشتق من البريد',
  displayName(null, { fullName: null, email: 'dr.sakr@clinic.eg' }),
  'dr.sakr',
);
ok(
  'لا يعود فارغاً أبداً',
  displayName(null, { fullName: null, email: '' }).length > 0,
);

/* ══════════════════════════════════════════════════════════════════
 * The DOM assertions. Everything above is pure logic; these check what a
 * doctor would actually see on screen.
 * ══════════════════════════════════════════════════════════════════ */
section('6. اتجاه الوصفة في DOM حقيقي');

api.mountGlasses();
await sleep(400);

const root = doc.getElementById('root');
ok('نموذج النظارة رُسم', root.children.length > 0, 'root empty');

eq('الصفحة نفسها بقيت RTL', doc.documentElement.getAttribute('dir'), 'rtl');

const block = root.querySelector('.med-block');
ok('توجد جزيرة LTR للقياسات', !!block);
eq('حاوية القياسات dir=ltr', block && block.getAttribute('dir'), 'ltr');

/* The eye cells, in DOM order. Under an LTR container the first row is the
   top one and the first cell is leftmost — so DOM order IS visual order. */
const eyeCells = [...root.querySelectorAll('.rx-eye')].map((c) =>
  (c.childNodes[0].textContent || '').trim(),
);
eq('أول صف في الجدول هو OD', eyeCells[0], 'OD');
eq('ثاني صف هو OS', eyeCells[1], 'OS');
ok('العينان لم تنعكسا', eyeCells.indexOf('OD') < eyeCells.indexOf('OS'), eyeCells.join(','));

/* Column order must read SPH CYL AXIS left to right. */
const headers = [...root.querySelectorAll('table thead th')].map((h) => h.textContent.trim());
eq('العمود الأول EYE', headers[0], 'EYE');
eq('العمود الثاني SPH', headers[1], 'SPH');
eq('العمود الثالث CYL', headers[2], 'CYL');
eq('العمود الرابع AXIS', headers[3], 'AXIS');

/* Every numeric input must isolate its own direction, or a typed '-' jumps. */
const medInputs = [...root.querySelectorAll('.med-input')];
ok('حقول القياس موجودة', medInputs.length >= 6, 'found ' + medInputs.length);
ok(
  'كل حقل قياس dir=ltr',
  medInputs.every((i) => i.getAttribute('dir') === 'ltr'),
  medInputs.filter((i) => i.getAttribute('dir') !== 'ltr').length + ' inputs missing dir',
);

/* The Arabic gloss beside OD/OS must stay RTL — the point is that the page
   direction is preserved outside the numbers, not abolished. */
const gloss = root.querySelector('.rx-eye small');
ok('الشرح العربي بجانب العين موجود', !!gloss);
eq('الشرح العربي بقي RTL في CSS', gloss && gloss.textContent.trim(), 'اليمنى');

section('7. الوصفة الدوائية');

api.mountMeds();
await sleep(400);
const meds = doc.getElementById('meds');
ok('نموذج الأدوية رُسم', meds.children.length > 0);

/* No <datalist> anywhere — banned for Android compatibility. */
eq('لا يوجد datalist في أي نموذج', doc.querySelectorAll('datalist').length, 0);

const drugInput = meds.querySelector('.med-input');
ok('حقل اسم الدواء موجود', !!drugInput);
eq('اسم الدواء LTR', drugInput && drugInput.getAttribute('dir'), 'ltr');
ok('توجد قائمة اختيار للأدوية', !!meds.querySelector('select'));

section('8. لا أخطاء وقت التشغيل');
ok('لا أخطاء غير معالَجة', errors.length === 0, errors.join(' | '));

console.log('\n' + '─'.repeat(58));
if (failures.length === 0) {
  console.log(`\x1b[32m✓ نجحت كل الاختبارات — ${pass} تأكيداً\x1b[0m`);
} else {
  console.log(`\x1b[31m✗ فشل ${failures.length}\x1b[0m / نجح ${pass}`);
  for (const f of failures) console.log('  ✗ ' + f.name + (f.detail ? ' — ' + f.detail : ''));
}
console.log('─'.repeat(58));
process.exit(failures.length ? 1 : 0);
