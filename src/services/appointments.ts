/* -------------------------------------------------------------------------
 * appointments service — boundary over the EXISTING backend engine.
 * -------------------------------------------------------------------------
 * The appointment engine lives in PostgreSQL: nine states, the legal
 * transitions in iapp.appointment_transitions, concurrency protection inside
 * the RPCs. This file is a typed wrapper. It contains NO state machine, NO
 * transition rules, and NO concurrency logic, and it must never grow any.
 *
 * Every write goes through an RPC — never a direct UPDATE on appointments.
 * Ported from v2/appointment-service.js (BUILD v8).
 *
 * STEP 2 SCOPE: the wrapper, the status constants, and the label helpers.
 * Reads/writes are wired to screens in Steps 5-7; Realtime in Step 8.
 * ---------------------------------------------------------------------- */

import { supabase } from './supabase';
import { APPOINTMENT_STATUS, type AppointmentStatus, type StatusLabel } from '../types/domain';
import { reportError } from '../utils/errors';

export { APPOINTMENT_STATUS };
export type { AppointmentStatus };

/** Presentation metadata — from appointment-service.js LABEL. */
export const STATUS_LABEL: Record<AppointmentStatus, StatusLabel> = {
  REQUESTED: { ar: 'طلب جديد', color: 'var(--gold)', icon: '🆕' },
  PENDING: { ar: 'قيد المراجعة', color: 'var(--gold)', icon: '⏳' },
  CONFIRMED: { ar: 'مؤكد', color: 'var(--accent)', icon: '✓' },
  ARRIVED: { ar: 'وصل', color: 'var(--teal)', icon: '📍' },
  WAITING: { ar: 'في الانتظار', color: 'var(--teal)', icon: '🪑' },
  IN_CLINIC: { ar: 'داخل العيادة', color: 'var(--accent)', icon: '🩺' },
  COMPLETED: { ar: 'مكتمل', color: 'var(--success)', icon: '✅' },
  CANCELLED: { ar: 'ملغى', color: 'var(--danger)', icon: '✕' },
  NO_SHOW: { ar: 'لم يحضر', color: 'var(--muted)', icon: '—' },
};

export function statusLabel(status: AppointmentStatus): StatusLabel {
  return STATUS_LABEL[status] ?? { ar: status, color: 'var(--muted)', icon: '?' };
}

/** Status groupings — from appointment-service.js. */
export const LIVE_STATUSES: AppointmentStatus[] = ['ARRIVED', 'WAITING', 'IN_CLINIC'];
export const QUEUED_STATUSES: AppointmentStatus[] = ['ARRIVED', 'WAITING'];
export const OPEN_INBOX_STATUSES: AppointmentStatus[] = ['REQUESTED', 'PENDING'];

export const isLive = (s: AppointmentStatus) => LIVE_STATUSES.includes(s);
export const isQueued = (s: AppointmentStatus) => QUEUED_STATUSES.includes(s);
export const isInClinic = (s: AppointmentStatus) => s === 'IN_CLINIC';
export const isDone = (s: AppointmentStatus) => s === 'COMPLETED';
export const isOpen = (s: AppointmentStatus) =>
  s !== 'COMPLETED' && s !== 'CANCELLED' && s !== 'NO_SHOW';

/**
 * Every state change is an RPC call. The names below are the live functions
 * verified in the backend audit — do not add, rename or bypass them.
 */
export const APPOINTMENT_RPC = {
  availableSlots: 'available_slots',
  book: 'book_appointment',
  review: 'review_appointment',
  confirm: 'confirm_appointment',
  arrive: 'mark_arrived',
  wait: 'mark_waiting',
  call: 'call_patient',
  complete: 'complete_appointment',
  cancel: 'cancel_appointment',
  noShow: 'mark_no_show',
  reschedule: 'reschedule_appointment',
} as const;

/** Thin RPC helper with Arabic error translation. */
async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(reportError(error, 'الموعد'));
  return data as T;
}

/**
 * The legal transitions are a TABLE, read at runtime — never a constant in
 * this file. Kept here so screens ask the backend what is allowed rather
 * than guessing.
 */
export async function loadTransitions(): Promise<unknown[]> {
  const { data, error } = await supabase.from('appointment_transitions').select('*');
  if (error) throw new Error(reportError(error, 'قواعد انتقال الحالة'));
  return data ?? [];
}

/** Read the board view. Filters are applied server-side under RLS. */
export async function board(opts: {
  clinicId?: string;
  date?: string;
  status?: AppointmentStatus[];
} = {}): Promise<unknown[]> {
  let q = supabase.from('v_appointment_board').select('*');
  if (opts.clinicId) q = q.eq('clinic_id', opts.clinicId);
  if (opts.date) q = q.eq('appointment_date', opts.date);
  if (opts.status?.length) q = q.in('status', opts.status);
  const { data, error } = await q;
  if (error) throw new Error(reportError(error, 'لوحة المواعيد'));
  return data ?? [];
}

/* Writes — one function per RPC, no logic of their own. */
export const review = (id: string) => rpc(APPOINTMENT_RPC.review, { p_id: id });
export const confirm = (id: string) => rpc(APPOINTMENT_RPC.confirm, { p_id: id });
export const arrive = (id: string) => rpc(APPOINTMENT_RPC.arrive, { p_id: id });
export const wait = (id: string) => rpc(APPOINTMENT_RPC.wait, { p_id: id });
export const callPatient = (id: string) => rpc(APPOINTMENT_RPC.call, { p_id: id });
export const noShow = (id: string) => rpc(APPOINTMENT_RPC.noShow, { p_id: id });
export const complete = (id: string, visitId?: string) =>
  rpc(APPOINTMENT_RPC.complete, { p_id: id, p_visit_id: visitId ?? null });
export const cancel = (id: string, reason: string) =>
  rpc(APPOINTMENT_RPC.cancel, { p_id: id, p_reason: reason });
