/* -------------------------------------------------------------------------
 * models.ts — port of v2/js/models.js
 * -------------------------------------------------------------------------
 * Single source of truth for entity shape rules and the suggestion lists the
 * doctor UI offers.
 *
 * ⚠️ Validation here improves MESSAGES. It is not a security layer. The real
 * protection is the database CHECK constraints and RLS, which keep working
 * even if this file is bypassed entirely. Every rule below mirrors a real
 * constraint — if they drift, the database wins and the user gets an English
 * error, which is the failure this file exists to prevent.
 *
 * The 125 assertions in v2/js/tests.js lock this behaviour; keep it faithful.
 * ---------------------------------------------------------------------- */

import type { Eye } from '../types/domain';

/* ── value lists — mirror the database enums ─────────────────── */

export const GENDER: Record<string, string> = {
  male: 'ذكر',
  female: 'أنثى',
  other: 'آخر',
  unknown: 'غير محدد',
};

export const EYE_AR: Record<string, string> = {
  OD: 'اليمنى',
  OS: 'اليسرى',
  OU: 'كلتا العينين',
};

export const VISIT_TYPE: Record<string, string> = {
  routine: 'فحص روتيني',
  follow_up: 'متابعة',
  retina: 'فحص شبكية',
  refraction: 'قياس نظر',
  consultation: 'استشارة',
  surgery: 'عملية',
  emergency: 'طوارئ',
  other: 'أخرى',
};

export const DX_STATUS: Record<string, string> = {
  active: 'نشط',
  resolved: 'شُفي',
  chronic: 'مزمن',
  ruled_out: 'مستبعد',
};

export const FU_STATUS: Record<string, string> = {
  pending: 'مستحق',
  notified: 'أُبلغ',
  completed: 'تم',
  missed: 'فائت',
  cancelled: 'ملغي',
};

export const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const TRIAGE = ['مكتمل', 'متابعة', 'طارئ'];

/** Three acuity readings, not one. Pinhole is what separates a refractive
 *  deficit from an organic one; without it the other two can't be read. */
export const VA_KIND: Record<string, string> = {
  ucva: 'بلا تصحيح UCVA',
  bcva: 'بأفضل تصحيح BCVA',
  ph: 'بالثقب PH',
};

/** Two numbers from two devices aren't comparable, so method is part of the
 *  measurement, not decoration. */
export const IOP_METHOD = ['Goldmann', 'NCT (هوائي)', 'Tonopen', 'iCare', 'Perkins', 'بالإصبع'];

/* ── segment fields — key is English (stored), label Arabic (shown) ── */

type FieldDef = [string, string, string[]];

export const ANT_FIELDS: FieldDef[] = [
  ['lids', 'الجفون', ['طبيعية', 'تورم', 'احمرار', 'التهاب الجفن', 'شحاذ العين', 'إسدال الجفن', 'انقلاب للخارج', 'انقلاب للداخل']],
  ['conjunctiva', 'الملتحمة', ['طبيعية', 'احتقان', 'التهاب', 'ظفرة', 'نزيف تحت الملتحمة', 'إفراز صديدي', 'حليمات']],
  ['cornea', 'القرنية', ['شفافة', 'عتامة', 'تليف', 'وذمة', 'ترقق', 'قرحة', 'صبغة فلوريسين إيجابية', 'ندبة', 'رواسب خلف القرنية']],
  ['ac', 'الحجرة الأمامية', ['عميقة وهادئة', 'ضحلة', 'خلايا', 'توهج', 'تجمع صديدي', 'تجمع دموي']],
  ['iris', 'القزحية', ['طبيعية', 'ضمور', 'التصاقات خلفية', 'تكوّن أوعية', 'عيب في نقل الضوء']],
  ['pupil', 'الحدقة', ['مستديرة متفاعلة', 'غير منتظمة', 'عيب حدقي وارد RAPD', 'ثابتة', 'متوسعة', 'مضيّقة']],
  ['lens', 'العدسة', ['صافية', 'مياه بيضاء نووية', 'تحت المحفظة الخلفية', 'قشرية', 'ناضجة', 'عدسة صناعية', 'عتامة المحفظة الخلفية']],
];

export const POST_FIELDS: FieldDef[] = [
  ['vitreous', 'الجسم الزجاجي', ['صافٍ', 'انفصال زجاجي خلفي', 'عتامات', 'نزيف', 'خلايا']],
  ['disc', 'القرص البصري', ['طبيعي، الحواف واضحة', 'شحوب', 'وذمة', 'تجويف', 'حواف غير واضحة']],
  ['cd_ratio', 'نسبة التجويف C/D', ['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9']],
  ['macula', 'البقعة الصفراء', ['المنعكس البقعي موجود', 'منعكس باهت', 'وذمة', 'تنكس', 'ثقب بقعي', 'دروزن', 'نزيف']],
  ['vessels', 'الأوعية', ['طبيعية', 'تضيّق شرياني', 'تعرّج', 'انضغاط شرياني وريدي', 'انسداد وريدي', 'تكوّن أوعية جديدة']],
  ['periphery', 'الشبكية الطرفية', ['سليمة', 'تنكس شبكي', 'ثقب', 'تمزق', 'انفصال', 'أثر ليزر سابق']],
];

export const FIELD_LABEL: Record<string, string> = {};
export const FIELD_SECTION: Record<string, string> = {};
ANT_FIELDS.forEach((f) => {
  FIELD_LABEL[f[0]] = f[1];
  FIELD_SECTION[f[0]] = 'anterior';
});
POST_FIELDS.forEach((f) => {
  FIELD_LABEL[f[0]] = f[1];
  FIELD_SECTION[f[0]] = 'posterior';
});

export function fieldList(key: string): string[] {
  const all = [...ANT_FIELDS, ...POST_FIELDS];
  for (const f of all) if (f[0] === key) return f[2];
  return [];
}

/* ── suggestion lists ────────────────────────────────────────── */

export const COMPLAINTS = ['ضعف النظر', 'التهاب العين', 'صداع', 'تغيير النظارة', 'صعوبة في القراءة', 'مياه بيضاء', 'شبورة بالعين', 'ألم في العين', 'عين حمراء', 'إفرازات من العين', 'رؤية مزدوجة', 'وميض أو بقع سوداء'];
export const VA_VALUES = ['1.00', '0.9', '0.8', '0.7', '0.6', '0.5', '0.4', '0.3', '0.2', '0.1', '6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60', 'CF', 'HM', 'PL', 'NPL'];
export const DIAGNOSES_LIST = ['قصر نظر', 'طول نظر', 'استجماتيزم', 'قصر النظر الشيخوخي', 'المياه البيضاء', 'المياه الزرقاء', 'التهاب الملتحمة', 'جفاف العين', 'اعتلال الشبكية السكري', 'تنكس البقعة الصفراء', 'الحول', 'كسل العين'];
export const PLANS = ['نظارة طبية', 'عدسات لاصقة', 'قطرات', 'متابعة دورية', 'عملية المياه البيضاء', 'ليزك', 'حقن داخل العين', 'ليزر شبكية', 'تحويل لأخصائي'];
export const SURGERY_LIST = ['المياه البيضاء بالفاكو + عدسة', 'استخراج المياه البيضاء ECCE', 'ترشيح للمياه الزرقاء', 'زرع صمام للمياه الزرقاء', 'ليزك LASIK', 'PRK', 'حقن داخل العين', 'استئصال الجسم الزجاجي', 'ليزر شبكية بانورامي', 'كبسولوتومي YAG', 'عملية حول', 'استئصال ظفرة', 'زراعة قرنية', 'تسليك القناة الدمعية', 'إزالة شحاذ العين'];

/* ── helpers ─────────────────────────────────────────────────── */

export function num(v: unknown): number | null {
  if (v === '' || v == null) return null;
  const x = parseFloat(String(v));
  return isNaN(x) ? null : x;
}

export function int(v: unknown): number | null {
  if (v === '' || v == null) return null;
  const x = parseInt(String(v), 10);
  return isNaN(x) ? null : x;
}

export function str(v: unknown): string | null {
  const t = v == null ? '' : String(v).trim();
  return t === '' ? null : t;
}

/** Local calendar date. Never toISOString — that is UTC, i.e. yesterday in
 *  Egypt before 02:00. */
export function today(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function isDate(v: unknown): v is string {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return false;
  const s = String(v);
  const d = new Date(s + 'T00:00:00');
  if (isNaN(d.getTime())) return false;
  // Rejects 2026-02-31: Date rolls it to 3 March, so the round trip catches it.
  return (
    s ===
    d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
  );
}

/** Lens power always carries its sign: +1.00 and -1.00 are opposite lenses. */
export function diopter(v: unknown): string {
  if (v == null || v === '') return '—';
  const n = parseFloat(String(v));
  if (isNaN(n)) return '—';
  return (n > 0 ? '+' : '') + n.toFixed(2);
}

/** Quarter-dioptre steps — anything else is usually a typing slip. */
export function isQuarter(v: unknown): boolean {
  if (v === '' || v == null) return true;
  const n = parseFloat(String(v));
  if (isNaN(n)) return false;
  return Math.abs(Math.round(n * 4) - n * 4) < 1e-9;
}

export function normPhone(p: unknown): string | null {
  if (!p) return null;
  const s = String(p).replace(/[^\d]/g, '');
  if (/^20\d{10}$/.test(s)) return '0' + s.slice(2);
  if (/^\d{10}$/.test(s)) return '0' + s;
  return s || null;
}

export function waPhone(p: unknown): string | null {
  const s = String(p ?? '').replace(/[^\d]/g, '');
  if (!s) return null;
  if (s.indexOf('20') === 0) return s;
  if (s.indexOf('0') === 0) return '20' + s.slice(1);
  return '20' + s;
}

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function fmtDay(iso: string | null | undefined): string {
  if (!isDate(iso)) return iso ?? '';
  return DAYS[new Date(iso + 'T00:00:00').getDay()] + ' ' + iso;
}

export function ageFrom(dob: unknown): number | null {
  if (!isDate(dob)) return null;
  const d = new Date(dob + 'T00:00:00');
  const n = new Date();
  let y = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) y--;
  return y;
}

/** IOP above 21 is a flag that must not be buried among the other numbers. */
export function iopHigh(v: unknown): boolean {
  const n = num(v);
  return n != null && n > 21;
}

export function fmtBytes(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n < 1024) return n + ' بايت';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' ك.بايت';
  return (n / 1024 / 1024).toFixed(1) + ' م.بايت';
}

/* ── database error translation ──────────────────────────────── */

const DB_ERRORS: Record<string, string> = {
  patients_date_of_birth_check: 'تاريخ الميلاد في المستقبل — راجع السنة',
  patients_patient_code_check: 'كود المريض يجب أن يكون بصيغة P-0001',
  patients_patient_code_key: 'كود المريض مستعمل لمريض آخر',
  patients_national_id_key: 'الرقم القومي مسجَّل لمريض آخر',
  patients_full_name_check: 'اسم المريض قصير جداً',
  patients_email_check: 'البريد الإلكتروني غير صحيح',
  patients_blood_type_check: 'فصيلة دم غير معروفة',
  patients_age_at_registration_check: 'العمر يجب أن يكون بين 0 و130',
  refractions_cylinder_check: 'قوة الاسطوانة خارج المدى (±15)',
  refractions_sphere_check: 'القوة الكروية خارج المدى (±30)',
  refractions_axis_check: 'المحور يجب أن يكون بين 0 و180',
  refractions_ipd_mm_check: 'المسافة بين الحدقتين خارج المدى (40–85)',
  chk_cyl_axis: 'أدخل المحور مع قوة الاسطوانة',
  chk_visit_date_sane: 'تاريخ الزيارة غير منطقي',
  slot_taken: 'هذا الوقت محجوز بالفعل',
  already_in_state: 'نُفِّذ هذا الإجراء بالفعل — حدّث الشاشة',
  invalid_transition: 'هذا الانتقال غير مسموح في دورة الموعد',
  forbidden_transition: 'دورك لا يسمح بهذا الإجراء',
  no_identity: 'يجب تسجيل الدخول أولاً',
};

export function dbError(err: unknown): string {
  const e = err as { message?: string; details?: string } | null;
  const raw = (e && (e.message || e.details)) || String(err ?? '');
  for (const k of Object.keys(DB_ERRORS)) if (raw.indexOf(k) !== -1) return DB_ERRORS[k];
  return raw;
}

/* ── validation ──────────────────────────────────────────────── */

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

function V(): ValidationResult {
  return { ok: true, errors: [] };
}

function bad(r: ValidationResult, msg: string): ValidationResult {
  r.ok = false;
  r.errors.push(msg);
  return r;
}

export function validatePatient(p: Record<string, unknown>): ValidationResult {
  const r = V();
  const name = str(p.full_name);
  if (!name || name.length < 2) bad(r, 'اسم المريض مطلوب (حرفان على الأقل)');
  if (p.patient_code && !/^P-\d{4,8}$/.test(String(p.patient_code)))
    bad(r, 'كود المريض يجب أن يكون بصيغة P-0001');
  const age = int(p.age_at_registration);
  if (age != null && (age < 0 || age > 130)) bad(r, 'العمر بين 0 و130');
  if (p.blood_type && BLOOD.indexOf(String(p.blood_type)) === -1) bad(r, 'فصيلة دم غير معروفة');
  if (p.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(p.email)))
    bad(r, 'البريد الإلكتروني غير صحيح');
  if (p.date_of_birth && !isDate(p.date_of_birth)) bad(r, 'تاريخ الميلاد غير صحيح');
  // The database rejects a future date of birth. Checking only the format here
  // let a mistyped year through the browser and bounced back as an English
  // check-constraint error nobody could act on.
  else if (p.date_of_birth && String(p.date_of_birth) > today())
    bad(r, 'تاريخ الميلاد في المستقبل — راجع السنة');
  // Age and date of birth are separate columns; a contradiction corrupts
  // later calculations.
  if (p.date_of_birth && isDate(p.date_of_birth) && age != null) {
    const y = ageFrom(p.date_of_birth);
    if (y != null && Math.abs(y - age) > 1)
      bad(r, `العمر (${age}) لا يطابق تاريخ الميلاد (${y} سنة)`);
  }
  return r;
}

export function validateVisit(v: Record<string, unknown>): ValidationResult {
  const r = V();
  if (!v.patient_id) bad(r, 'المريض مطلوب');
  if (!isDate(v.visit_date)) bad(r, 'تاريخ الزيارة غير صحيح');
  if (v.visit_type && !VISIT_TYPE[String(v.visit_type)]) bad(r, 'نوع زيارة غير معروف');
  return r;
}

export function validateRefraction(f: Record<string, unknown>): ValidationResult {
  const r = V();
  const sph = num(f.sphere);
  const cyl = num(f.cylinder);
  const ax = int(f.axis);
  if (sph != null && Math.abs(sph) > 30) bad(r, 'الكروي بين ±30');
  if (cyl != null && Math.abs(cyl) > 15) bad(r, 'الأسطواني بين ±15 (موجب أو سالب)');
  if (ax != null && (ax < 0 || ax > 180)) bad(r, 'المحور بين 0 و180');
  // Cylinder without an axis is a meaningless measurement; the database
  // rejects it too.
  if (cyl != null && cyl !== 0 && ax == null) bad(r, 'أدخل المحور مع الأسطواني');
  if (!isQuarter(f.sphere)) bad(r, 'الكروي بخطوات 0.25');
  if (!isQuarter(f.cylinder)) bad(r, 'الأسطواني بخطوات 0.25');
  const add = num(f.add_power);
  if (add != null && (add < 0 || add > 6)) bad(r, 'قوة القراءة بين 0 و+6');
  const ipd = num(f.ipd_mm);
  if (ipd != null && (ipd < 40 || ipd > 85)) bad(r, 'المسافة بين الحدقتين بين 40 و85');
  return r;
}

/** C/D is a number between 0 and 1, sometimes written "0.3-0.4" when
 *  uncertain. Accept both forms; 1.5 is a typo, not a reading. */
export function validateCD(v: unknown): boolean {
  if (v == null || String(v).trim() === '') return true;
  const parts = String(v).split(/[-/]/);
  for (const p of parts) {
    const n = parseFloat(p);
    if (isNaN(n) || n < 0 || n > 1) return false;
  }
  return true;
}

export function validateFinding(f: { field?: string; eye?: string; value?: unknown }): ValidationResult {
  const r = V();
  if (!f.field || !FIELD_LABEL[f.field]) bad(r, 'حقل فحص غير معروف: ' + (f.field ?? ''));
  if (!f.eye || !EYE_AR[f.eye]) bad(r, 'العين مطلوبة');
  if (f.field === 'cd_ratio' && !validateCD(f.value)) bad(r, 'نسبة التجويف بين 0 و1');
  return r;
}

export function validateExam(e: Record<string, unknown>): ValidationResult {
  const r = V();
  if (!e.patient_id) bad(r, 'المريض مطلوب');
  if (!isDate(e.exam_date)) bad(r, 'تاريخ الفحص غير صحيح');
  // Visual acuity is text on purpose: CF, HM and PL are valid clinical
  // values and are not numeric.
  for (const k of ['iop_right', 'iop_left']) {
    const x = num(e[k]);
    if (x != null && (x < 0 || x > 80)) bad(r, 'ضغط العين بين 0 و80 mmHg');
  }
  const findings = e.findings as Array<{ field?: string; eye?: string; value?: unknown }> | undefined;
  if (findings) {
    for (const f of findings) {
      const fc = validateFinding(f);
      if (!fc.ok) {
        bad(r, fc.errors[0]);
        break;
      }
    }
  }
  return r;
}

export function validateSurgery(s: Record<string, unknown>): ValidationResult {
  const r = V();
  if (!s.patient_id) bad(r, 'المريض مطلوب');
  if (!str(s.procedure_name)) bad(r, 'اسم العملية مطلوب');
  if (!s.eye || !EYE_AR[String(s.eye)]) bad(r, 'حدّد العين');
  // The database constraint: planned without a date is fine, performed
  // without a date is not.
  if (!s.is_planned && !isDate(s.performed_on)) bad(r, 'تاريخ إجراء العملية مطلوب');
  if (s.performed_on && isDate(s.performed_on) && !s.is_planned && String(s.performed_on) > today())
    bad(r, 'تاريخ العملية في المستقبل — اجعلها مخطَّطة');
  if (s.is_planned && s.performed_on && isDate(s.performed_on) && String(s.performed_on) < today())
    bad(r, 'عملية مخطَّطة بتاريخ ماضٍ');
  return r;
}

export function validateFollowUp(f: Record<string, unknown>): ValidationResult {
  const r = V();
  if (!f.patient_id) bad(r, 'المريض مطلوب');
  if (!isDate(f.due_date)) bad(r, 'تاريخ المتابعة غير صحيح');
  return r;
}

/** Eye laterality guard used by the finding map. */
export const EYES: Eye[] = ['OD', 'OS', 'OU'];
