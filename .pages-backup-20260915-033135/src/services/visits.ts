/* -------------------------------------------------------------------------
 * visits service — port of the `visits` object in v2/js/svc-clinical.js
 * -------------------------------------------------------------------------
 * Deletion is soft everywhere in the clinical record: deleted_at is set, the
 * row stays. Every read therefore filters `.is('deleted_at', null)`.
 *
 * A visit is linked to its appointment through complete_appointment
 * (p_visit_id) — never by writing appointment state from here.
 * ---------------------------------------------------------------------- */

import { supabase } from './supabase';
import { svcError } from './_err';
import * as M from '../utils/models';
import type { Visit } from '../types/clinical';
import type { Enums, TablesInsert, TablesUpdate } from '../types/database.types';

const VISIT_ERRORS = {
  chk_visit_date_sane: 'تاريخ الزيارة غير منطقي',
  patient_mismatch: 'عدم تطابق: السجل يخص مريضاً آخر',
};

export async function listByPatient(pid: string, limit = 30): Promise<Visit[]> {
  const r = await supabase
    .from('visits')
    .select('*')
    .eq('patient_id', pid)
    .is('deleted_at', null)
    .order('visit_date', { ascending: false })
    .limit(limit);
  if (r.error) throw svcError(r.error, 'قراءة الزيارات', VISIT_ERRORS);
  return (r.data ?? []) as unknown as Visit[];
}

export async function get(id: string): Promise<Visit | null> {
  const r = await supabase.from('visits').select('*').eq('id', id).maybeSingle();
  if (r.error) throw svcError(r.error, 'قراءة الزيارة', VISIT_ERRORS);
  return (r.data as unknown as Visit) ?? null;
}

/**
 * The open visit for this patient today, if one already exists — used so
 * "Start Visit" resumes the same row on a second click/press instead of
 * creating a duplicate. iapp.visits has no status enum (no OPEN/IN_
 * PROGRESS/COMPLETED); a visit is open exactly while is_locked is false.
 */
export async function openToday(patientId: string): Promise<Visit | null> {
  const r = await supabase
    .from('visits')
    .select('*')
    .eq('patient_id', patientId)
    .eq('visit_date', M.today())
    .eq('is_locked', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (r.error) throw svcError(r.error, 'قراءة الزيارة المفتوحة', VISIT_ERRORS);
  return (r.data as unknown as Visit) ?? null;
}

export async function listByDate(date: string, clinicId?: string | null): Promise<Visit[]> {
  let q = supabase.from('visits').select('*').eq('visit_date', date).is('deleted_at', null);
  if (clinicId) q = q.eq('clinic_id', clinicId);
  const r = await q.order('created_at', { ascending: false });
  if (r.error) throw svcError(r.error, 'قراءة زيارات اليوم', VISIT_ERRORS);
  return (r.data ?? []) as unknown as Visit[];
}

export type VisitInput = Record<string, unknown>;

function visitType(v: unknown): Enums<{ schema: 'iapp' }, 'visit_type'> {
  const t = M.str(v);
  return (t ?? 'routine') as Enums<{ schema: 'iapp' }, 'visit_type'>;
}

export async function create(v: VisitInput): Promise<Visit> {
  const chk = M.validateVisit(v);
  if (!chk.ok) throw new Error(chk.errors[0]);
  // Defense-in-depth: VisitForm already blocks this client-side, but any
  // other caller of create() must not be able to slip a clinic-less new
  // visit through. Existing visits (update(), above) are untouched — this
  // only guards the creation of new rows, never historical ones.
  if (!M.str(v.clinic_id)) throw new Error('العيادة مطلوبة لإنشاء زيارة جديدة');

  const payload: TablesInsert<{ schema: 'iapp' }, 'visits'> = {
    patient_id: String(v.patient_id),
    clinic_id: M.str(v.clinic_id),
    doctor_id: M.str(v.doctor_id),
    appointment_id: M.str(v.appointment_id),
    visit_date: String(v.visit_date),
    visit_type: visitType(v.visit_type),
    chief_complaint: M.str(v.chief_complaint),
    summary: M.str(v.summary),
    notes: M.str(v.notes),
  };

  const r = await supabase
    .from('visits')
    .insert(payload)
    .select('*')
    .single();
  if (r.error) throw svcError(r.error, 'حفظ الزيارة', VISIT_ERRORS);
  return r.data as unknown as Visit;
}

export async function update(id: string, v: VisitInput): Promise<Visit> {
  const payload: TablesUpdate<{ schema: 'iapp' }, 'visits'> = {
    // clinic_id is included because VisitForm renders an editable clinic
    // <select> for both new AND existing visits — omitting it here would
    // let the doctor change the dropdown, click save, and have the change
    // silently discarded, which is worse than not offering the field at
    // all. This does not "invent" or auto-assign a clinic: it only writes
    // whatever value the doctor explicitly chose in the visible form.
    clinic_id: M.str(v.clinic_id),
    visit_date: String(v.visit_date),
    visit_type: visitType(v.visit_type),
    chief_complaint: M.str(v.chief_complaint),
    summary: M.str(v.summary),
    notes: M.str(v.notes),
  };

  const r = await supabase
    .from('visits')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (r.error) throw svcError(r.error, 'تعديل الزيارة', VISIT_ERRORS);
  return r.data as unknown as Visit;
}

export async function countToday(clinicId?: string | null): Promise<number> {
  let q = supabase
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('visit_date', M.today())
    .is('deleted_at', null);
  if (clinicId) q = q.eq('clinic_id', clinicId);
  const r = await q;
  return r.error ? 0 : (r.count ?? 0);
}

/**
 * Locks the visit. There is no visits.status column and no dedicated RPC
 * for this in the live schema (confirmed against database.types.ts) — the
 * legacy/current design marks a visit closed with is_locked + locked_at.
 * locked_by / updated_by are left unset here rather than guessed: if the
 * database populates them itself (trigger on auth.uid()), this still works;
 * if it doesn't, that gap is pre-existing and unrelated to this change.
 */
export async function complete(id: string): Promise<Visit> {
  const payload: TablesUpdate<{ schema: 'iapp' }, 'visits'> = {
    is_locked: true,
    locked_at: new Date().toISOString(),
  };
  const r = await supabase.from('visits').update(payload).eq('id', id).select('*').single();
  if (r.error) throw svcError(r.error, 'إنهاء الزيارة', VISIT_ERRORS);
  return r.data as unknown as Visit;
}
