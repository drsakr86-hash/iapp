/* -------------------------------------------------------------------------
 * domain.ts — frontend contracts, NOT a schema description.
 * -------------------------------------------------------------------------
 * Every type here was read off the calls the legacy services actually make
 * (v2/iapp-core.js, v2/appointment-service.js, v2/js/svc-*.js), not off the
 * outdated Git schema. They describe what the UI consumes.
 *
 * Row-level types (Patient, Visit, Examination, …) intentionally live in
 * database.types.ts once generated — they are NOT hand-written here.
 * ---------------------------------------------------------------------- */

/** Roles as stored in public.profiles.role. */
export type Role = 'admin' | 'doctor' | 'secretary' | 'patient';

export const ROLES: readonly Role[] = ['admin', 'doctor', 'secretary', 'patient'] as const;

/** Arabic role labels — from iapp-core.js ROLE_AR. */
export const ROLE_AR: Record<Role, string> = {
  admin: 'مدير النظام',
  doctor: 'طبيب',
  secretary: 'سكرتارية',
  patient: 'مريض',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/**
 * Shape returned by iapp-core.js getProfile(). Read from public.profiles by
 * auth.uid() — never from a client-supplied claim.
 */
export interface Profile {
  userId: string;
  email: string | undefined;
  role: Role;
  fullName: string | null;
  phone: string | null;
}

/**
 * The nine appointment states. Mirrors the iapp.appointment_status enum.
 * This is a read-only reflection of the backend engine — the legal
 * transitions between these states live in iapp.appointment_transitions and
 * are read at runtime. Never hard-code the transition matrix in React.
 */
export const APPOINTMENT_STATUS = {
  REQUESTED: 'REQUESTED',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  ARRIVED: 'ARRIVED',
  WAITING: 'WAITING',
  IN_CLINIC: 'IN_CLINIC',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export type AppointmentStatus =
  (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

/** Presentation metadata — from appointment-service.js LABEL. */
export interface StatusLabel {
  ar: string;
  color: string;
  icon: string;
}

/* -------------------------------------------------------------------------
 * Imaging modalities — values are the iapp.image_modality ENUM LABELS.
 * -------------------------------------------------------------------------
 * These are lowercase in PostgreSQL. An earlier version of this file listed
 * them uppercase ('FUNDUS', 'OCT', …); every insert built from those values
 * would have been rejected by the enum at runtime while compiling cleanly.
 * The list below is copied from v2/js/models.js M.MODALITY, which is what
 * the live application actually writes.
 * ---------------------------------------------------------------------- */
export const MODALITY_AR = {
  fundus: 'قاع العين — Fundus',
  oct: 'مقطعية — OCT',
  octa: 'أوعية مقطعية — OCTA',
  ffa: 'صبغة الفلوريسين — FFA',
  pentacam: 'بنتاكام — Pentacam',
  visual_field: 'مجال الإبصار — Visual Field',
  uwf_fundus: 'قاع عين واسع — UWF Fundus',
  uwf_oct: 'مقطعية واسعة — UWF OCT',
  uwf_octa: 'أوعية واسعة — UWF OCTA',
  b_scan: 'موجات صوتية — B-scan',
  other: 'أخرى',
} as const;

export type Modality = keyof typeof MODALITY_AR;

/** Retired enum labels: still readable in old rows, never offered for entry. */
export const MODALITY_LEGACY_AR: Record<string, string> = {
  optos: 'Optos (قديم)',
  topography: 'طبوغرافيا (قديم)',
  biometry: 'قياسات حيوية (قديم)',
  anterior_segment: 'المقطع الأمامي (قديم)',
  xray: 'أشعة (قديم)',
  unknown: 'غير محدد',
};

export const MODALITIES = Object.keys(MODALITY_AR) as Modality[];

export function modalityLabel(v: string | null | undefined): string {
  if (!v) return '—';
  return (MODALITY_AR as Record<string, string>)[v] ?? MODALITY_LEGACY_AR[v] ?? v;
}

/** Laterality — iapp.eye_side. */
export type Eye = 'OD' | 'OS' | 'OU';

/**
 * OD is the RIGHT eye, OS is the LEFT eye. This mapping is clinical fact and
 * is asserted in tests/medical.mjs; it must never be swapped to compensate
 * for a layout problem.
 */
export const EYE_AR: Record<Eye, string> = {
  OD: 'اليمنى',
  OS: 'اليسرى',
  OU: 'كلتا العينين',
};

/**
 * Canonical presentation order for a refraction chart: OD first, then OS.
 * Conventional ophthalmic notation, independent of page direction.
 */
export const RX_EYE_ORDER: readonly Eye[] = ['OD', 'OS'] as const;

/** iapp.imaging_orders.urgency — from models.js M.URGENCY. */
export const URGENCY_AR = { routine: 'عادي', urgent: 'عاجل', stat: 'فوري' } as const;
export type Urgency = keyof typeof URGENCY_AR;

/** iapp.imaging_orders.status — from models.js M.ORDER_STATUS. */
export const ORDER_STATUS_AR = {
  requested: 'مطلوب',
  scheduled: 'محجوز',
  completed: 'تم',
  cancelled: 'ملغى',
} as const;
export type OrderStatus = keyof typeof ORDER_STATUS_AR;

/** iapp.medical_images.status. */
export const STUDY_STATUS_AR = {
  uploaded: 'مرفوعة',
  pending_report: 'بانتظار التقرير',
  reported: 'تم التقرير',
  archived: 'مؤرشفة',
} as const;
export type StudyStatus = keyof typeof STUDY_STATUS_AR;

/** iapp.refraction_type. */
export type RefractionType = 'unaided' | 'aided' | 'cycloplegic' | 'final' | 'auto';

/** Uniform result envelope used by the service layer. */
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
