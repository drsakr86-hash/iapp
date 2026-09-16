/* -------------------------------------------------------------------------
 * patientPortal — read-only self-service for the logged-in patient.
 * -------------------------------------------------------------------------
 * Every query below has NO explicit patient_id filter, on purpose. RLS
 * policies already scope every one of these tables to
 * iapp.current_patient_uuid()/iapp.my_patient_id() for the 'patient' role
 * (see supabase/production-schema.sql — apt_patient_read, visits_
 * patient_read, prescriptions_patient_read, examinations_patient_read,
 * refractions_patient_read, etc.). Adding a client-side .eq('patient_id',
 * ...) here would be redundant at best; at worst it invites someone to
 * "fix" a bug by passing a different id and bypassing nothing, since RLS
 * still enforces the real boundary. Trust the database here, as
 * elsewhere in this app (see services/auth.ts).
 *
 * claimPatientRecord() and linkStatus() are the one exception: they call
 * SECURITY DEFINER RPCs (iapp.claim_patient_record, iapp.my_link_status)
 * because establishing the link itself can't be scoped by a link that
 * doesn't exist yet.
 * ---------------------------------------------------------------------- */

import { supabase } from './supabase';
import { reportError } from '../utils/errors';
import type { AppointmentStatus } from '../types/domain';

/* ── link status ─────────────────────────────────────────────────── */

export interface LinkStatus {
  linked: boolean;
  patientId?: string;
  name?: string;
  code?: string;
}

export async function linkStatus(): Promise<LinkStatus> {
  const { data, error } = await supabase.rpc('my_link_status');
  if (error) throw new Error(reportError(error, 'حالة الربط'));
  const d = (data ?? {}) as Record<string, unknown>;
  return {
    linked: d.linked === true,
    patientId: typeof d.patient_id === 'string' ? d.patient_id : undefined,
    name: typeof d.name === 'string' ? d.name : undefined,
    code: typeof d.code === 'string' ? d.code : undefined,
  };
}

export interface ClaimResult {
  ok: boolean;
  already?: boolean;
  name?: string;
  code?: string;
  error?: string;
}

/**
 * The one error message covers both "wrong code" and "wrong phone" on
 * purpose (iapp.claim_patient_record does the same server-side) — it
 * must not become more specific here, or the ambiguity that prevents
 * guessing a real patient's code by trial and error is lost.
 */
export async function claimPatientRecord(code: string, phone: string): Promise<ClaimResult> {
  const { data, error } = await supabase.rpc('claim_patient_record', {
    p_code: code.trim(),
    p_phone: phone.trim(),
  });
  if (error) {
    const msg = error.message || '';
    if (msg.includes('no_match')) return { ok: false, error: 'كود الملف أو رقم الهاتف غير صحيح' };
    if (msg.includes('already_linked')) {
      return { ok: false, error: 'هذا الملف مرتبط بحساب آخر بالفعل — تواصل مع العيادة' };
    }
    if (msg.includes('rate_limited')) return { ok: false, error: 'محاولات كثيرة — حاول بعد ساعة' };
    if (msg.includes('unauthenticated')) return { ok: false, error: 'سجّل الدخول أولاً' };
    return { ok: false, error: reportError(error, 'ربط الملف') };
  }
  const d = (data ?? {}) as Record<string, unknown>;
  return {
    ok: true,
    already: d.already === true,
    name: typeof d.name === 'string' ? d.name : undefined,
    code: typeof d.code === 'string' ? d.code : undefined,
  };
}

/* ── appointments ────────────────────────────────────────────────── */

const APPOINTMENT_COLS =
  'id, scheduled_date, scheduled_time, appointment_type, status, notes, ' +
  'clinics(name_ar, name_en, address, phone), doctors(full_name_ar, title_ar)';

export interface MyAppointmentRow {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  appointment_type: string | null;
  status: AppointmentStatus;
  notes: string | null;
  clinics: { name_ar: string; name_en: string | null; address: string | null; phone: string | null } | null;
  doctors: { full_name_ar: string; title_ar: string | null } | null;
}

export async function myAppointments(): Promise<MyAppointmentRow[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_COLS)
    .order('scheduled_date', { ascending: false })
    .order('scheduled_time', { ascending: false });
  if (error) throw new Error(reportError(error, 'المواعيد'));
  return (data ?? []) as unknown as MyAppointmentRow[];
}

/**
 * Books a new appointment for the CALLER'S OWN linked patient record.
 *
 * This deliberately does NOT reuse services/appointments.ts's book() —
 * that function requires an explicit patientId (by design: staff picks a
 * patient from iapp.patients, and its own comment says there is no
 * guest/walk-in path). A patient booking for themselves has no patient
 * to pick and no RLS access to browse iapp.patients at all.
 * iapp.book_appointment already knows what to do here: for role='patient'
 * it ignores whatever p_patient_id it's given and resolves
 * iapp.my_patient_id() itself, forces status='REQUESTED' (a staff member
 * must confirm it — this is a request, not a booking), and clears any
 * p_room. See supabase/production-schema.sql for the exact function body.
 */
export async function bookMyAppointment(input: {
  clinicId: string;
  date: string;
  time: string;
  type?: string | null;
  notes?: string | null;
}): Promise<void> {
  if (!input.clinicId) throw new Error('اختر العيادة');
  if (!input.date) throw new Error('اختر التاريخ');
  if (!input.time) throw new Error('اختر الوقت');

  const time = /^\d{2}:\d{2}$/.test(input.time) ? `${input.time}:00` : input.time;

  const { error } = await supabase.rpc('book_appointment', {
    p_clinic_id: input.clinicId,
    p_date: input.date,
    p_time: time,
    p_type: input.type?.trim() || undefined,
    p_notes: input.notes?.trim() || undefined,
  });
  if (error) {
    const msg = error.message || '';
    if (msg.includes('slot_taken')) return Promise.reject(new Error('هذا الموعد محجوز بالفعل — اختر وقتًا آخر'));
    if (msg.includes('past_date')) return Promise.reject(new Error('لا يمكن حجز موعد في تاريخ فات'));
    if (msg.includes('no_patient_link')) {
      return Promise.reject(new Error('حسابك غير مرتبط بملف طبي بعد'));
    }
    return Promise.reject(new Error(reportError(error, 'حجز الموعد')));
  }
}

/* ── prescriptions (glasses + medication) ───────────────────────────── */

const PRESCRIPTION_COLS =
  'id, prescribed_on, is_glasses, eye, notes, legacy_medicines_text, ' +
  'prescription_items(id, free_text, dose, frequency, duration, instructions, medication_id)';

export interface MyPrescriptionRow {
  id: string;
  prescribed_on: string;
  is_glasses: boolean;
  eye: string | null;
  notes: string | null;
  legacy_medicines_text: string | null;
  prescription_items: Array<{
    id: string;
    free_text: string | null;
    dose: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
    medication_id: string | null;
  }>;
  refractions: Array<{
    eye: string;
    sphere: number | null;
    cylinder: number | null;
    axis: number | null;
    add_power: number | null;
    ipd_mm: number | null;
    va_result: string | null;
  }>;
}

export async function myPrescriptions(): Promise<MyPrescriptionRow[]> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select(PRESCRIPTION_COLS)
    .order('prescribed_on', { ascending: false });
  if (error) throw new Error(reportError(error, 'الروشتات'));
  const rows = (data ?? []) as unknown as Array<Omit<MyPrescriptionRow, 'refractions'>>;
  if (!rows.length) return [];

  // refractions.prescription_id has no foreign-key constraint (checked
  // against supabase/production-schema.sql), so PostgREST cannot embed it
  // automatically the way prescription_items is embedded above — that
  // would silently 400 or be dropped. Fetch this patient's refractions
  // once (RLS-scoped, no client-side patient filter needed — same as
  // everywhere else in this file) and match them in JS instead, the same
  // pattern services/examinations.ts uses for iop_measurements.
  const ids = rows.map((r) => r.id);
  const { data: refData, error: refError } = await supabase
    .from('refractions')
    .select('eye, sphere, cylinder, axis, add_power, ipd_mm, va_result, prescription_id')
    .in('prescription_id', ids);
  if (refError) throw new Error(reportError(refError, 'كشف النظارة'));
  const byPrescription = new Map<string, MyPrescriptionRow['refractions']>();
  for (const r of (refData ?? []) as Array<MyPrescriptionRow['refractions'][number] & { prescription_id: string | null }>) {
    if (!r.prescription_id) continue;
    const list = byPrescription.get(r.prescription_id) ?? [];
    list.push(r);
    byPrescription.set(r.prescription_id, list);
  }

  return rows.map((r) => ({ ...r, refractions: byPrescription.get(r.id) ?? [] }));
}

/* ── examinations ────────────────────────────────────────────────── */

const EXAMINATION_COLS =
  'id, exam_date, chief_complaint, va_right, va_left, ' +
  'diagnoses(diagnosis_text, is_primary), ' +
  'follow_ups(due_date, reason), ' +
  'iop_measurements(eye, value_mmhg, measured_at)';

export interface MyExaminationRow {
  id: string;
  exam_date: string;
  chief_complaint: string | null;
  va_right: string | null;
  va_left: string | null;
  diagnoses: Array<{ diagnosis_text: string; is_primary: boolean | null }>;
  follow_ups: Array<{ due_date: string; reason: string | null }>;
  iop_measurements: Array<{ eye: string; value_mmhg: number; measured_at: string }>;
}

export async function myExaminations(): Promise<MyExaminationRow[]> {
  const { data, error } = await supabase
    .from('examinations')
    .select(EXAMINATION_COLS)
    .order('exam_date', { ascending: false });
  if (error) throw new Error(reportError(error, 'الفحوصات'));
  return (data ?? []) as unknown as MyExaminationRow[];
}
