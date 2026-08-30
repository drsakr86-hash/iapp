/**
 * Step 2 smoke tests — runs the real built application inside jsdom.
 *
 * These verify the foundation without touching the live database: with no
 * stored session Supabase resolves to "no session" from localStorage alone
 * and makes no network call. Anything that would require real credentials
 * (an actual sign-in, a real RLS-scoped read) is out of scope here and is
 * listed as unverified in the step report.
 *
 * Run: node tests/smoke.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dir = path.dirname(fileURLToPath(import.meta.url));
const bundle = fs.readFileSync(path.join(dir, 'dist/smoke.js'), 'utf8');

let pass = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) pass++;
  else failures.push({ name, detail });
}
function section(t) {
  console.log('\n\x1b[1m' + t + '\x1b[0m');
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dom = new JSDOM(
  `<!doctype html><html lang="ar" dir="rtl"><head><title>I App</title></head>
   <body><div id="root"></div></body></html>`,
  {
    url: 'https://drsakr86-hash.github.io/iapp/app/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  },
);

const { window } = dom;
// Supabase's storage probe and React both expect these to exist.
window.matchMedia ??= () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
window.fetch = async () => {
  throw new Error('network blocked in smoke test');
};

const errors = [];
window.addEventListener('error', (e) => errors.push(String(e.message)));
window.onerror = (m) => errors.push(String(m));

dom.window.eval(bundle);

section('1. الإقلاع');
ok('الحزمة تُنفَّذ بلا استثناء', typeof window.mountApp === 'function');

window.mountApp();
await sleep(400);

const doc = window.document;
const root = doc.getElementById('root');
const text = () => (root.textContent || '').trim();

ok('التطبيق رسم محتوى', root.children.length > 0, 'root is empty');
ok('لا شاشة بيضاء', text().length > 0);

section('2. RTL والهوية البصرية');
ok('dir=rtl على <html>', doc.documentElement.getAttribute('dir') === 'rtl');
ok('lang=ar', doc.documentElement.getAttribute('lang') === 'ar');

section('3. استعادة الجلسة');
// No stored session -> AuthProvider must settle on 'anon', not hang on
// 'loading' and not crash. That is the session-restoration path.
ok(
  'انتهت حالة التحميل',
  !text().includes('جارٍ التحقق من الجلسة'),
  'still stuck in loading state: ' + text().slice(0, 80),
);

section('4. المسارات المحمية');
ok(
  'زائر بلا جلسة يُحوَّل لتسجيل الدخول',
  window.location.pathname.endsWith('/login'),
  'pathname = ' + window.location.pathname,
);
ok('نموذج الدخول ظاهر', !!doc.querySelector('input[type="email"]'));
ok('حقل كلمة المرور ظاهر', !!doc.querySelector('input[type="password"]'));
ok('زر الدخول ظاهر', text().includes('دخول'));

section('5. حراسة الأدوار');
for (const route of ['/doctor', '/secretary', '/patient', '/admin']) {
  window.history.pushState({}, '', '/iapp/app' + route);
  window.dispatchEvent(new window.PopStateEvent('popstate'));
  await sleep(150);
  ok(
    `${route} غير متاح بلا جلسة`,
    window.location.pathname.endsWith('/login'),
    'landed on ' + window.location.pathname,
  );
}

section('6. مسار غير موجود');
window.history.pushState({}, '', '/iapp/app/nonsense-route');
window.dispatchEvent(new window.PopStateEvent('popstate'));
await sleep(150);
ok('يعرض صفحة غير موجودة', text().includes('الصفحة غير موجودة'), text().slice(0, 80));

section('7. لا أخطاء وقت التشغيل');
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
