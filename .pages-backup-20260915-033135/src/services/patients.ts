/* patients service — uses the iapp.patients table.
 *
 * Patient visibility is enforced by RLS.
 * The database schema uses:
 *   patient_code
 *   date_of_birth
 *
 * Do not query public.patients — the patients table belongs to the iapp schema.
 *
 * ── patient_code ──────────────────────────────────────────────────────
 * The generated database types mark patient_code as required on insert
 * (no column default was detected in the live schema, and no dedicated
 * "create patient" / "generate code" RPC exists among the iapp functions
 * — see database.types.ts). This project has no way to confirm from here
 * whether a BEFORE INSERT trigger fills it in, and creating one is out of
 * scope for a frontend change. nextPatientCode() below computes the next
 * P-0001-style code from the highest existing one and create() retries
 * once if that guess collides with a concurrent insert (patients_patient_
 * code_key). If the database *does* generate this column automatically,
 * this code is harmless: it just supplies an explicit value instead of
 * relying on a default that was never confirmed to exist.
 */

import { supabase, maybe, rows } from './supabase';
import { reportError } from '../utils/errors';
import { normPhone } from '../utils/models';
import type { TablesInsert, Enums } from '../types/database.types';
import type { Patient as ClinicalPatient } from '../types/clinical';

export interface PatientRow {
  id: string;
  patient_code: string;
  full_name: string;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  is_active: boolean;
}

const COLS =
  'id, patient_code, full_name, phone, gender, date_of_birth, is_active';

function patientsTable() {
  return supabase.schema('iapp').from('patients');
}

export async function count(): Promise<number> {
  const { count: n, error } = await patientsTable()
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .is('deleted_at', null);

  if (error) {
    throw new Error(reportError(error, 'عدد المرضى'));
  }

  return n ?? 0;
}

export async function list(
  opts: { search?: string; limit?: number } = {},
): Promise<PatientRow[]> {
  const term = String(opts.search ?? '').trim();

  let q = patientsTable()
    .select(COLS)
    .eq('is_active', true)
    .is('deleted_at', null);

  if (term) {
    const safe = term.replace(/[,()]/g, ' ').trim();

    q = q.or(
      `full_name.ilike.%${safe}%,phone.ilike.%${safe}%,patient_code.ilike.%${safe}%`,
    );
  }

  const { data, error } = await q
    .order('full_name', { ascending: true })
    .limit(opts.limit ?? 50);

  if (error) {
    throw new Error(reportError(error, 'قائمة المرضى'));
  }

  return rows<PatientRow>(data);
}

export async function get(id: string): Promise<PatientRow | null> {
  const { data, error } = await patientsTable()
    .select(COLS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(reportError(error, 'بيانات المريض'));
  }

  return maybe<PatientRow>(data);
}

/**
 * The fuller clinical profile — v_patient_clinical, not the patients table
 * directly. This is the source for the doctor's patient-record header and
 * summary (it also carries last_visit, computed server-side).
 */
export async function getClinical(id: string): Promise<ClinicalPatient | null> {
  const { data, error } = await supabase
    .schema('iapp')
    .from('v_patient_clinical')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(reportError(error, 'الملف السريري للمريض'));
  }
  if (!data) return null;
  // full_name is nullable on the view but every real patient row has one;
  // an empty result here would mean a data problem worth surfacing rather
  // than silently rendering a blank name.
  return { ...data, full_name: data.full_name ?? '' } as unknown as ClinicalPatient;
}

/**
 * Best-effort duplicate check by phone, the only reliable matching signal
 * available before a patient has a record — mirrors the existing search
 * matching (full_name / phone / patient_code) rather than inventing new
 * matching rules. Returns the first active match, or null.
 */
export async function findByPhone(phone: string): Promise<PatientRow | null> {
  const normalized = normPhone(phone);
  if (!normalized) return null;

  const { data, error } = await patientsTable()
    .select(COLS)
    .eq('is_active', true)
    .is('deleted_at', null)
    .or(`phone.eq.${normalized},phone_normalized.eq.${normalized}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    // A failed duplicate check must not silently allow a duplicate patient
    // to be created without the user knowing the check didn't run.
    throw new Error(reportError(error, 'البحث عن مريض مطابق'));
  }
  return maybe<PatientRow>(data);
}

async function nextPatientCode(): Promise<string> {
  const { data, error } = await patientsTable()
    .select('patient_code')
    .order('patient_code', { ascending: false })
    .limit(1);
  if (error) throw new Error(reportError(error, 'توليد كود المريض'));
  const last = data?.[0]?.patient_code ?? '';
  const m = /^P-(\d+)$/.exec(String(last));
  const n = m ? parseInt(m[1], 10) + 1 : 1;
  return 'P-' + String(n).padStart(4, '0');
}

export interface NewPatientInput {
  fullName: string;
  phone?: string | null;
  gender?: Enums<{ schema: 'iapp' }, 'gender'> | null;
  dateOfBirth?: string | null;
}

/**
 * Creates a real iapp.patients row. Retries once with the next code if the
 * generated patient_code collides with a concurrent insert — the database's
 * own unique constraint (patients_patient_code_key) is the actual guard;
 * this just makes the common race self-healing instead of surfacing a
 * confusing error on the first collision.
 */
export async function create(input: NewPatientInput): Promise<PatientRow> {
  const fullName = input.fullName.trim();
  if (!fullName) throw new Error('اسم المريض مطلوب');

  const payload: TablesInsert<{ schema: 'iapp' }, 'patients'> = {
    full_name: fullName,
    phone: input.phone?.trim() || null,
    gender: input.gender ?? undefined,
    date_of_birth: input.dateOfBirth || null,
    patient_code: await nextPatientCode(),
  };

  let { data, error } = await patientsTable().insert(payload).select(COLS).single();

  if (error && /patient_code/.test(error.message) && /duplicate|unique/i.test(error.message)) {
    payload.patient_code = await nextPatientCode();
    ({ data, error } = await patientsTable().insert(payload).select(COLS).single());
  }

  if (error) {
    throw new Error(reportError(error, 'إنشاء المريض'));
  }
  return data as unknown as PatientRow;
}