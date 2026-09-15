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
 * Booking is `book()` below: a single call to iapp.book_appointment. The
 * overlap check, the slot exclusion constraint and the concurrency guard all
 * live in that function. React must not pre-check for conflicts and then
 * insert — that is a lost update, and it is the bug Phase 8 was opened to
 * fix. Ask for the slot; let the database refuse it.
 * ---------------------------------------------------------------------- */

import { supabase, one } from './supabase';
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
type AppointmentRpcName = (typeof APPOINTMENT_RPC)[keyof typeof APPOINTMENT_RPC];
async function rpc<T>(fn: AppointmentRpcName, args: Record<string, unknown> = {}): Promise<T> {
  /* The RPC name is checked against the real set of database functions above
     (catches typos); the per-function argument shape is already correct at
     every call site below, so it is cast here rather than re-deriving a
     union of all nine argument shapes just to satisfy the generic helper. */
  const { data, error } = await supabase.rpc(fn, args as never);
  if (error) throw new Error(reportError(error, 'الموعد'));
  return one<T>(data);
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
/**
 * Row from v_appointment_board — NOT the same shape as the appointments
 * table. Column names confirmed against the generated database types
 * (Views.v_appointment_board): the view resolves patient vs. guest into a
 * single display_name/display_phone pair and joins doctor/clinic labels,
 * so it has no guest_name/guest_phone/called_at of its own. board() and
 * byDate() were previously typed (and cast) as AppointmentRow — the raw
 * table shape — which does not match what they actually query; that
 * mismatch is why DoctorAppointments.tsx rendered a bare patient_id
 * instead of a name. Fixed here rather than guessed at each call site.
 */
export interface BoardRow {
  id: string;
  patient_id: string | null;
  display_name: string | null;
  display_phone: string | null;
  patient_code: string | null;
  doctor_id: string | null;
  doctor_name: string | null;
  doctor_short: string | null;
  clinic_id: string | null;
  clinic_name: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  status: AppointmentStatus | null;
  appointment_type: string | null;
  room: string | null;
  notes: string | null;
  visit_id: string | null;
  source: string | null;
  requested_at: string | null;
  confirmed_at: string | null;
  waiting_at: string | null;
  in_clinic_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  reschedule_count: number | null;
  rescheduled_from: string | null;
  wait_minutes: number | null;
}

export async function board(opts: {
  clinicId?: string;
  date?: string;
  status?: AppointmentStatus[];
} = {}): Promise<BoardRow[]> {
  let q = supabase.from('v_appointment_board').select('*');
  if (opts.clinicId) q = q.eq('clinic_id', opts.clinicId);
  if (opts.date) q = q.eq('scheduled_date', opts.date);
  if (opts.status?.length) q = q.in('status', opts.status);
  const { data, error } = await q;
  if (error) throw new Error(reportError(error, 'لوحة المواعيد'));
  return (data ?? []) as unknown as BoardRow[];
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


/* -------------------------------------------------------------------------
 * Reads used by the booking screen.
 * ---------------------------------------------------------------------- */

export interface Slot {
  slot_time: string;
  is_free: boolean;
}

/**
 * The bookable grid for one clinic on one day, straight from
 * iapp.available_slots. The clinic's working hours, slot length and existing
 * bookings are all applied server-side; this function adds nothing.
 */
export async function availableSlots(
  clinicId: string,
  date: string,
  doctorId?: string | null,
): Promise<Slot[]> {
  const rows = await rpc<Slot[]>(APPOINTMENT_RPC.availableSlots, {
    p_clinic_id: clinicId,
    p_date: date,
    p_doctor_id: doctorId ?? null,
  });
  return rows ?? [];
}

export interface AppointmentRow {
  id: string;
  patient_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  doctor_id: string | null;
  clinic_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  appointment_type: string | null;
  room: string | null;
  notes: string | null;
  visit_id: string | null;
  created_at: string;
  called_at?: string | null;
  arrived_at?: string | null;
}

export interface BookInput {
  clinicId: string;
  date: string;
  time: string;
  /** Must be the id of an existing iapp.patients row. The booking screen
      only ever offers a picker over registered patients — see
      NewAppointmentForm — so there is no guest/walk-in path from this app. */
  patientId: string;
  doctorId?: string | null;
  type?: string | null;
  notes?: string | null;
  room?: string | null;
  durationMinutes?: number | null;
}

/**
 * Create an appointment.
 *
 * Returns the inserted iapp.appointments row, so the caller can prepend it
 * to the list it is already showing without re-querying. That is what makes
 * a new booking appear immediately.
 *
 * Conflicts: iapp.book_appointment raises when the slot is taken. The
 * exclusion constraint on the generated `slot` tsrange is the real guard —
 * two secretaries clicking the same slot at the same moment produce one
 * booking and one Arabic error, not two bookings.
 */
export async function book(input: BookInput): Promise<AppointmentRow> {
  /* Every booking from this app must identify a registered patient. There is
     deliberately no guest/walk-in path here: the screen only offers a picker
     over iapp.patients (see NewAppointmentForm), never a free-text name. */
  const patientId = str(input.patientId);
  if (!patientId) throw new Error('من فضلك اختر مريضًا من قائمة المرضى المسجلين');
  if (!input.clinicId) throw new Error('اختر العيادة');
  if (!input.date) throw new Error('اختر التاريخ');
  if (!input.time) throw new Error('اختر الوقت');

  const row = await rpc<AppointmentRow>(APPOINTMENT_RPC.book, {
    p_clinic_id: input.clinicId,
    p_date: input.date,
    p_time: normalizeTime(input.time),
    p_patient_id: patientId,
    p_doctor_id: input.doctorId ?? null,
    p_type: str(input.type) || null,
    p_notes: str(input.notes) || null,
    p_room: str(input.room) || null,
    p_duration: input.durationMinutes ?? null,
    p_guest_name: null,
    p_guest_phone: null,
  });
  return row;
}

export const reschedule = (id: string, date: string, time: string) =>
  rpc<AppointmentRow>(APPOINTMENT_RPC.reschedule, {
    p_id: id,
    p_date: date,
    p_time: normalizeTime(time),
  });

/**
 * Appointments for one day. Reads the board view, which already applies RLS
 * and joins the patient name — the screens need the name, and a per-row
 * lookup would be one request per appointment.
 */
export async function byDate(date: string, clinicId?: string): Promise<BoardRow[]> {
  return board({ date, clinicId });
}

/** Single appointment by id, from the same board view — used to prime the
    visit form when a visit is started from a specific appointment. */
export async function get(id: string): Promise<BoardRow | null> {
  const { data, error } = await supabase
    .from('v_appointment_board')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(reportError(error, 'الموعد'));
  return (data as unknown as BoardRow) ?? null;
}

/* <input type="time"> yields HH:MM, or HH:MM:SS in some browsers.
   PostgreSQL `time` accepts both, but normalising here keeps the value
   stable when it is compared against a slot string in the UI. */
function normalizeTime(t: string): string {
  const v = String(t ?? '').trim();
  return /^\d{2}:\d{2}$/.test(v) ? v + ':00' : v;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/* -------------------------------------------------------------------------
 * Appointment actions
 * ------------------------------------------------------------------------- */

export interface AppointmentAction {
  to: string;
  label: string;
  requiresReason: boolean;
  color?: string;
  run: (arg?: string) => Promise<unknown>;
}

const VERB: Record<
  string,
  { ar: string; fn: (id: string, arg?: string) => Promise<unknown> }
> = {
  PENDING: { ar: 'مراجعة', fn: (id) => review(id) },
  CONFIRMED: { ar: 'تأكيد', fn: (id) => confirm(id) },
  ARRIVED: { ar: 'تسجيل وصول', fn: (id) => arrive(id) },
  WAITING: { ar: 'إلى الانتظار', fn: (id) => wait(id) },
  IN_CLINIC: { ar: 'نداء للكشف', fn: (id) => callPatient(id) },
  COMPLETED: { ar: 'إنهاء', fn: (id, arg) => complete(id, arg ?? undefined) },
  CANCELLED: { ar: 'إلغاء', fn: (id, arg) => cancel(id, arg ?? '') },
  NO_SHOW: { ar: 'لم يحضر', fn: (id) => noShow(id) },
};

export async function actionsFor(
  appointment: { id: string; status: AppointmentStatus | null },
  role: string,
): Promise<AppointmentAction[]> {
  const all = await loadTransitions();

  return all
    .filter((t) => {
      const row = t as {
        allowed_roles?: string[] | string;
        from_status?: string;
      };

      let roles = row.allowed_roles ?? [];

      if (typeof roles === 'string') {
        roles = roles
          .replace(/^[{"]+|[}"]+$/g, '')
          .split(/["\s]*,[ "\s]*/);
      }

      if (!Array.isArray(roles)) roles = [];

      return row.from_status === appointment.status && roles.includes(role);
    })
    .map((t) => {
      const row = t as {
        to_status?: string;
        requires_reason?: boolean;
      };

      const to = row.to_status ?? '';
      const v = VERB[to] ?? {
        ar: to,
        fn: async () => null,
      };

      return {
        to,
        label: v.ar,
        requiresReason: !!row.requires_reason,
        color: STATUS_LABEL[to as AppointmentStatus]?.color,
        run: (arg?: string) => v.fn(appointment.id, arg),
      };
    });
}

/* Minutes waiting, for the waiting-room board. */
/* Minutes waiting, for the waiting-room board. v_appointment_board already
   computes this server-side (wait_minutes), so this reads that column
   directly rather than re-deriving it from timestamps the view doesn't
   even expose under these names (it has waiting_at/in_clinic_at, not
   called_at/arrived_at). */
export function waitLabel(a: { wait_minutes: number | null }): string {
  const mins = a.wait_minutes;
  if (mins == null || mins <= 0) return '';
  return mins < 1 ? 'الآن' : `${mins} دقيقة`;
}
