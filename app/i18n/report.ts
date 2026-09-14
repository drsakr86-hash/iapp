/* -------------------------------------------------------------------------
 * i18n/report.ts — labels for the printable report, in three modes.
 * -------------------------------------------------------------------------
 * Only STRUCTURAL labels live here (section titles, table headers, field
 * names) — every one is a standard, globally-recognized ophthalmology or
 * administrative term, not a translation Claude invented for this task.
 *
 * Doctor-entered free text (chief complaint, diagnosis text, treatment
 * plan, prescription/imaging/follow-up notes) is NEVER translated by this
 * file or anywhere else in the report — it is printed exactly as the
 * doctor recorded it, in whichever language they wrote it. Auto-translating
 * clinical narrative would risk changing its meaning, which is exactly
 * what "do not translate medical data inaccurately" rules out.
 * ---------------------------------------------------------------------- */

import { diagnosisEn, findingValueEn } from './findings';

export type ReportLang = 'ar' | 'en' | 'bilingual';
export type ReportRecipient = 'patient' | 'physician';

interface Pair {
  ar: string;
  en: string;
}

/** ar-only | en-only | "ar — en" depending on the selected report language. */
export function label(pair: Pair, lang: ReportLang): string {
  if (lang === 'ar') return pair.ar;
  if (lang === 'en') return pair.en;
  return `${pair.ar} — ${pair.en}`;
}

export function dirFor(lang: ReportLang): 'rtl' | 'ltr' {
  return lang === 'en' ? 'ltr' : 'rtl';
}

export const RL = {
  reportLanguage: { ar: 'لغة التقرير', en: 'Report Language' },
  arabic: { ar: 'العربية', en: 'Arabic' },
  english: { ar: 'English', en: 'English' },
  bilingualOpt: { ar: 'عربي + English', en: 'Bilingual' },
  recipient: { ar: 'موجّه إلى', en: 'Recipient' },
  patientRecipient: { ar: 'المريض', en: 'Patient' },
  physicianRecipient: { ar: 'طبيب آخر / جهة طبية', en: 'Referring Physician' },

  patientName: { ar: 'اسم المريض', en: 'Patient Name' },
  patientCode: { ar: 'كود المريض', en: 'Patient Code' },
  dob: { ar: 'تاريخ الميلاد', en: 'Date of Birth' },
  visitDate: { ar: 'تاريخ الزيارة', en: 'Visit Date' },
  visitType: { ar: 'نوع الزيارة', en: 'Visit Type' },
  gender: { ar: 'النوع', en: 'Gender' },
  phone: { ar: 'الهاتف', en: 'Phone' },
  reportDate: { ar: 'تاريخ التقرير', en: 'Report Date' },
  reportType: { ar: 'نوع التقرير', en: 'Report Type' },

  chiefComplaint: { ar: 'الشكوى الرئيسية', en: 'Chief Complaint' },
  examination: { ar: 'الفحص الإكلينيكي', en: 'Ophthalmology Examination' },
  unaided: { ar: 'بلا تصحيح (UCVA)', en: 'Unaided (UCVA)' },
  corrected: { ar: 'بأفضل تصحيح (BCVA)', en: 'Corrected (BCVA)' },
  pinhole: { ar: 'بالثقب (PH)', en: 'Pinhole (PH)' },
  sphere: { ar: 'كروي', en: 'Sphere' },
  cylinder: { ar: 'أسطواني', en: 'Cylinder' },
  axis: { ar: 'محور', en: 'Axis' },
  add: { ar: 'إضافة', en: 'Add' },
  anteriorSegment: { ar: 'الجزء الأمامي', en: 'Anterior Segment' },
  posteriorSegment: { ar: 'الجزء الخلفي / قاع العين', en: 'Posterior Segment' },
  ipd: { ar: 'المسافة بين الحدقتين (IPD)', en: 'Interpupillary Distance (IPD)' },

  diagnosis: { ar: 'التشخيص', en: 'Diagnosis' },
  eye: { ar: 'العين', en: 'Eye' },
  status: { ar: 'الحالة', en: 'Status' },
  date: { ar: 'التاريخ', en: 'Date' },
  primary: { ar: 'أساسي', en: 'primary' },
  treatmentPlan: { ar: 'الخطة العلاجية', en: 'Treatment / Plan' },

  glassesRx: { ar: 'وصفة النظارة', en: 'Optical Prescription' },
  medicationRx: { ar: 'وصفة الأدوية', en: 'Medication Prescription' },
  drug: { ar: 'الدواء', en: 'Medication' },
  dose: { ar: 'الجرعة', en: 'Dose' },
  frequency: { ar: 'التكرار', en: 'Frequency' },
  duration: { ar: 'المدة', en: 'Duration' },
  instructions: { ar: 'تعليمات', en: 'Instructions' },

  investigationRequest: { ar: 'طلب أشعة وفحوصات', en: 'Investigation Request' },
  requestedExam: { ar: 'الفحص المطلوب', en: 'Requested Investigation' },
  clinicalIndication: { ar: 'دواعي الطلب', en: 'Clinical Indication' },
  notes: { ar: 'ملاحظات', en: 'Notes' },

  imaging: { ar: 'الأشعة والفحوصات', en: 'Imaging / Investigations' },
  imagingFindings: { ar: 'نتائج التصوير', en: 'Imaging Findings' },

  followUp: { ar: 'المتابعة', en: 'Follow-up' },
  impression: { ar: 'الانطباع الإكلينيكي', en: 'Clinical Impression' },

  examinationDocTitle: { ar: 'تقرير الفحص', en: 'Examination Report' },
  glassesDocTitle: { ar: 'وصفة النظارة', en: 'Optical Prescription' },
  medicationDocTitle: { ar: 'وصفة الأدوية', en: 'Medication Prescription' },
  investigationDocTitle: { ar: 'طلب أشعة وفحوصات', en: 'Investigation Request' },
  imagingDocTitle: { ar: 'تقرير التصوير', en: 'Imaging Report' },
  followupDocTitle: { ar: 'المتابعة', en: 'Follow-up' },

  generatedNote: {
    ar: 'تم إصدار هذا التقرير آلياً من السجل الطبي',
    en: 'This report was generated automatically from the medical record',
  },
} as const;

/** Standard English terms for the granular exam-finding fields (ANT_FIELDS/
 *  POST_FIELDS in utils/models.ts). These are the internal field keys
 *  already used throughout the codebase — lids, cornea, ac, disc, etc. —
 *  which ARE the standard clinical English terms, not a translation of the
 *  doctor's own wording. */
export const FIELD_LABEL_EN: Record<string, string> = {
  lids: 'Lids',
  conjunctiva: 'Conjunctiva',
  cornea: 'Cornea',
  ac: 'Anterior Chamber',
  iris: 'Iris',
  pupil: 'Pupil',
  lens: 'Lens',
  vitreous: 'Vitreous',
  disc: 'Optic Disc',
  cd_ratio: 'C/D Ratio',
  macula: 'Macula',
  vessels: 'Vessels',
  periphery: 'Peripheral Retina',
};

export function fieldLabel(key: string, arLabel: string, lang: ReportLang): string {
  const en = FIELD_LABEL_EN[key] ?? arLabel;
  if (lang === 'ar') return arLabel;
  if (lang === 'en') return en;
  return `${arLabel} — ${en}`;
}

const EYE_LABEL_AR: Record<string, string> = { OD: 'اليمنى', OS: 'اليسرى', OU: 'كلتا العينين' };
const EYE_LABEL_EN: Record<string, string> = { OD: 'Right', OS: 'Left', OU: 'Both Eyes' };

/** OD/OS/OU themselves are international abbreviations and never change;
 *  only the trailing descriptive word (اليمنى / Right) is translated. */
export function eyeLabel(eye: string, lang: ReportLang): string {
  const ar = EYE_LABEL_AR[eye] ?? eye;
  const en = EYE_LABEL_EN[eye] ?? eye;
  if (lang === 'ar') return ar;
  if (lang === 'en') return en;
  return `${ar} — ${en}`;
}

/**
 * A finding VALUE (not the field label) in the selected report language.
 * Only translates values that exactly match the app's own fixed
 * suggestion vocabulary (see i18n/findings.ts) — anything else (free text
 * the doctor typed) is returned unchanged, in every language, rather than
 * guessed at.
 */
export function findingValue(arValue: string, lang: ReportLang): string {
  if (lang === 'ar') return arValue;
  const en = findingValueEn(arValue);
  if (!en) return arValue; // no validated equivalent — never guess
  return lang === 'en' ? en : `${arValue} — ${en}`;
}

/** Same rule as findingValue, for diagnosis_text — exact match only. */
export function diagnosisLabel(text: string, lang: ReportLang): string {
  if (lang === 'ar') return text;
  const en = diagnosisEn(text);
  if (!en) return text;
  return lang === 'en' ? en : `${text} — ${en}`;
}

/** Interpupillary distance, millimetres, one decimal — matches utils/medical.ts pd(). */
export function fmtIpd(mm: number | null | undefined): string | null {
  if (mm == null) return null;
  return `${mm.toFixed(1)} mm`;
}
