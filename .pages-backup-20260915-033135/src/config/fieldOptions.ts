/**
 * Centralized categorical field options.
 * Numeric/continuous measurements remain inputs with step/min/max rather than
 * forcing the doctor through a very long dropdown.
 */

export const EYE_OPTIONS = [
  { value: 'OD', label: 'OD — العين اليمنى' },
  { value: 'OS', label: 'OS — العين اليسرى' },
  { value: 'OU', label: 'OU — كلتا العينين' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' },
  { value: 'other', label: 'آخر' },
  { value: 'unknown', label: 'غير محدد' },
] as const;

export const VISIT_TYPE_OPTIONS = [
  { value: 'routine', label: 'فحص روتيني' },
  { value: 'follow_up', label: 'متابعة' },
  { value: 'retina', label: 'فحص شبكية' },
  { value: 'refraction', label: 'قياس نظر' },
  { value: 'consultation', label: 'استشارة' },
  { value: 'surgery', label: 'عملية' },
  { value: 'emergency', label: 'طوارئ' },
  { value: 'other', label: 'أخرى' },
] as const;

export const IOP_METHOD_OPTIONS = [
  { value: 'Goldmann', label: 'Goldmann' },
  { value: 'NCT (هوائي)', label: 'NCT (هوائي)' },
  { value: 'Tonopen', label: 'Tono-Pen' },
  { value: 'iCare', label: 'iCare' },
  { value: 'Perkins', label: 'Perkins' },
  { value: 'بالإصبع', label: 'بالإصبع' },
] as const;

/** Legacy model source exposes 10..30 as the quick IOP choices. */
export const IOP_VALUES = Array.from({ length: 21 }, (_, i) => String(i + 10));

export const MEDICATION_FREQUENCIES = [
  'OD (مرة يومياً)',
  'BD (مرتان)',
  'TDS (٣ مرات)',
  'QDS (٤ مرات)',
  'PRN (عند اللزوم)',
] as const;

export const MEDICATION_DURATIONS = [
  '3 أيام',
  '5 أيام',
  'أسبوع',
  '10 أيام',
  'أسبوعان',
  '3 أسابيع',
  'شهر',
  'شهران',
  '3 أشهر',
  'حتى المراجعة',
  'مستمر',
] as const;

export const SERVICE_CATEGORIES = [
  'كشف',
  'استشارة',
  'فحوصات',
  'أشعة',
  'إجراءات',
  'عمليات',
  'أدوية',
  'أخرى',
] as const;
