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

/** The eleven imaging modalities supported by the Phase 10 architecture. */
export type Modality =
  | 'FUNDUS'
  | 'OCT'
  | 'OCTA'
  | 'FFA'
  | 'PENTACAM'
  | 'VISUAL_FIELD'
  | 'UWF_FUNDUS'
  | 'UWF_OCT'
  | 'UWF_OCTA'
  | 'B_SCAN'
  | 'OTHER';

/** Laterality. */
export type Eye = 'OD' | 'OS' | 'OU';

/** Uniform result envelope used by the service layer. */
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
