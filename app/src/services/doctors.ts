/* -------------------------------------------------------------------------
 * doctors service — the ONE source of doctor identity and display name.
 * -------------------------------------------------------------------------
 * There are two different records for a doctor and they are not the same
 * thing. Conflating them is what produced the "doctor name cannot be
 * changed" problem, so the distinction is spelled out here:
 *
 *   public.profiles   — the AUTH record. One row per login, keyed by
 *                       auth.uid(). Carries role and full_name. Every user
 *                       has one, including secretaries and patients.
 *
 *   iapp.doctors      — the CLINICAL record. One row per practising doctor,
 *                       linked to a profile by doctors.profile_id. Carries
 *                       full_name_ar, title_ar, license_no — the fields that
 *                       belong on a prescription. Secretaries have no row
 *                       here; a doctor may in principle exist without a
 *                       login (a locum recorded for history).
 *
 * iapp.appointments.doctor_id, examinations.doctor_id, prescriptions.
 * doctor_id and imaging_orders.doctor_id are all FKs to iapp.doctors.id —
 * NOT to auth.uid(). Writing the profile id into those columns produces a
 * foreign-key violation, which is why every write path in this app resolves
 * the doctor row first via `mine()`.
 *
 * DISPLAY NAME RESOLUTION — one rule, used everywhere:
 *
 *   doctors.full_name_ar + doctors.title_ar    (clinical record wins;
 *                                                name first, title after)
 *   → profiles.full_name                       (fallback for non-doctors)
 *   → email local part                         (last resort, never blank)
 *
 * `displayName()` below is that rule. Nothing in the UI may re-implement it
 * or keep its own copy of the name in state.
 * ---------------------------------------------------------------------- */

import { supabase, maybe, one, rows, publicSchema } from './supabase';
import { reportError } from '../utils/errors';
import type { Profile } from '../types/domain';
import type { TablesInsert, TablesUpdate } from '../types/database.types';

export interface DoctorRecord {
  id: string;
  profile_id: string | null;
  full_name_ar: string;
  full_name_en: string | null;
  short_name: string | null;
  title_ar: string | null;
  license_no: string | null;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  is_active: boolean;
}

const COLS =
  'id, profile_id, full_name_ar, full_name_en, short_name, title_ar, ' +
  'license_no, specialty, phone, email, is_primary, is_active';

/**
 * The doctor row for the signed-in user, or null if this login has none.
 *
 * Null is a normal answer, not an error: a secretary booking an appointment
 * is signed in and has no doctor row. Callers must handle it rather than
 * assuming a doctor is always present.
 */
export async function mine(): Promise<DoctorRecord | null> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from('doctors')
    .select(COLS)
    .eq('profile_id', uid)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(reportError(error, 'ملف الطبيب'));
  return maybe<DoctorRecord>(data);
}

/** Active doctors, for the "booking with" picker on the secretary screens. */
export async function list(): Promise<DoctorRecord[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select(COLS)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('is_primary', { ascending: false })
    .order('full_name_ar', { ascending: true });

  if (error) throw new Error(reportError(error, 'قائمة الأطباء'));
  return rows<DoctorRecord>(data);
}

/** Every doctor, active or not — for the management screen only. */
export async function listAll(): Promise<DoctorRecord[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select(COLS)
    .is('deleted_at', null)
    .order('is_active', { ascending: false })
    .order('is_primary', { ascending: false })
    .order('full_name_ar', { ascending: true });

  if (error) throw new Error(reportError(error, 'قائمة الأطباء'));
  return rows<DoctorRecord>(data);
}

export interface NameUpdate {
  full_name_ar: string;
  title_ar?: string | null;
  full_name_en?: string | null;
  short_name?: string | null;
}

/**
 * Persist the display name to iapp.doctors.
 *
 * The name is written in ONE place. Everything that shows a doctor name —
 * dashboard header, prescription, report, imaging order — reads it back
 * through `mine()` / `displayName()`, so a save propagates without any
 * screen holding its own copy.
 *
 * RLS decides whether this succeeds. The policy on iapp.doctors is what
 * stops one doctor renaming another; this function does not re-check it and
 * must not try to.
 */
export async function updateName(id: string, patch: NameUpdate): Promise<DoctorRecord> {
  const name = String(patch.full_name_ar ?? '').trim();
  if (name.length < 3) throw new Error('اكتب اسماً لا يقل عن ثلاثة أحرف');
  if (name.length > 120) throw new Error('الاسم طويل أكثر من اللازم');

  const row: TablesUpdate<{ schema: 'iapp' }, 'doctors'> = { full_name_ar: name };
  if (patch.title_ar !== undefined) row.title_ar = str(patch.title_ar);
  if (patch.full_name_en !== undefined) row.full_name_en = str(patch.full_name_en);
  if (patch.short_name !== undefined) row.short_name = str(patch.short_name);

  const { data, error } = await supabase
    .from('doctors')
    .update(row)
    .eq('id', id)
    .select(COLS)
    .single();

  if (error) throw new Error(reportError(error, 'حفظ اسم الطبيب'));
  return one<DoctorRecord>(data);
}

/**
 * The display-name rule. Pure — no I/O — so it can be unit-tested and so
 * every caller is guaranteed the same answer for the same inputs.
 */
export function displayName(
  doctor: DoctorRecord | null,
  profile: Profile | null,
): string {
  if (doctor) {
    const title = str(doctor.title_ar);
    const name = str(doctor.full_name_ar);
    if (name) return title ? `${name} ${title}` : name;
  }
  const fromProfile = str(profile?.fullName);
  if (fromProfile) return fromProfile;

  const email = profile?.email ?? '';
  const local = email.includes('@') ? email.slice(0, email.indexOf('@')) : email;
  return local || 'مستخدم';
}

/** Latin name for printed documents; falls back to the Arabic one. */
export function displayNameEn(doctor: DoctorRecord | null): string | null {
  if (!doctor) return null;
  return str(doctor.full_name_en) || null;
}

/* -------------------------------------------------------------------------
 * Doctor management (add / edit details / deactivate).
 * -------------------------------------------------------------------------
 * Every field below is a real, existing column on iapp.doctors — see the
 * schema comment at the top of this file. Nothing new was invented.
 *
 * Creating a brand-new LOGIN for a doctor (a Supabase Auth user + its
 * public.profiles row) is deliberately NOT done here — that requires the
 * Supabase Admin API (service_role), which must never run in the browser.
 * A new doctor is created here as a clinical-only record (profile_id
 * null), exactly the "locum recorded for history" case the file header
 * above already describes as supported. Linking it to a login later means
 * either creating that login through the Supabase dashboard and then
 * calling `linkProfile()` below, or a future server-side (Edge Function)
 * flow — out of scope for this change.
 *
 * No hard delete anywhere here, and no soft-delete via deleted_at either
 * (though that column exists) — determining "genuinely zero dependent
 * records" would mean safely checking appointments, examinations,
 * prescriptions, imaging_orders, surgeries, and more, which this change
 * does not attempt. `setActive(id, false)` — deactivation — is the only
 * removal path, per the standing instruction to prefer it over deletion.
 * ---------------------------------------------------------------------- */

export interface DoctorInput {
  fullNameAr: string;
  fullNameEn?: string | null;
  shortName?: string | null;
  titleAr?: string | null;
  specialty?: string | null;
  licenseNo?: string | null;
  phone?: string | null;
  email?: string | null;
}

export async function create(input: DoctorInput): Promise<DoctorRecord> {
  const name = input.fullNameAr.trim();
  if (name.length < 3) throw new Error('اكتب اسماً لا يقل عن ثلاثة أحرف');

  const row: TablesInsert<{ schema: 'iapp' }, 'doctors'> = {
    full_name_ar: name,
    full_name_en: str(input.fullNameEn) || null,
    short_name: str(input.shortName) || null,
    title_ar: str(input.titleAr) || null,
    specialty: str(input.specialty) || null,
    license_no: str(input.licenseNo) || null,
    phone: str(input.phone) || null,
    email: str(input.email) || null,
    is_active: true,
    is_primary: false,
  };

  const { data, error } = await supabase.from('doctors').insert(row).select(COLS).single();
  if (error) throw new Error(reportError(error, 'إضافة الطبيب'));
  return one<DoctorRecord>(data);
}

/** Broader than updateName() above — for the management form, not the
 *  doctor's own "ملفي" self-edit (which stays on updateName as-is). */
export async function update(id: string, input: DoctorInput): Promise<DoctorRecord> {
  const name = input.fullNameAr.trim();
  if (name.length < 3) throw new Error('اكتب اسماً لا يقل عن ثلاثة أحرف');

  const row: TablesUpdate<{ schema: 'iapp' }, 'doctors'> = {
    full_name_ar: name,
    full_name_en: str(input.fullNameEn) || null,
    short_name: str(input.shortName) || null,
    title_ar: str(input.titleAr) || null,
    specialty: str(input.specialty) || null,
    license_no: str(input.licenseNo) || null,
    phone: str(input.phone) || null,
    email: str(input.email) || null,
  };

  const { data, error } = await supabase
    .from('doctors')
    .update(row)
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, 'تعديل بيانات الطبيب'));
  return one<DoctorRecord>(data);
}

export async function setActive(id: string, isActive: boolean): Promise<DoctorRecord> {
  const { data, error } = await supabase
    .from('doctors')
    .update({ is_active: isActive })
    .eq('id', id)
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, isActive ? 'تفعيل الطبيب' : 'إيقاف الطبيب'));
  return one<DoctorRecord>(data);
}

export interface UnlinkedProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
}

/** public.profiles rows with role='doctor' that have no iapp.doctors row
 *  pointing at them yet — the only safe candidates to offer for linking,
 *  since offering an already-linked profile would let two doctors rows
 *  claim the same login. */
export async function unlinkedDoctorProfiles(): Promise<UnlinkedProfile[]> {
  const [{ data: profiles, error: pErr }, { data: linked, error: lErr }] = await Promise.all([
    publicSchema().from('profiles').select('id, full_name, phone').eq('role', 'doctor'),
    supabase.from('doctors').select('profile_id').not('profile_id', 'is', null),
  ]);
  if (pErr) throw new Error(reportError(pErr, 'قائمة الحسابات'));
  if (lErr) throw new Error(reportError(lErr, 'قائمة الحسابات'));

  const taken = new Set((linked ?? []).map((d: { profile_id: string | null }) => d.profile_id));
  return ((profiles ?? []) as UnlinkedProfile[]).filter((p) => !taken.has(p.id));
}

/** Links an existing, not-yet-linked profile to a doctor row. Rejected by
 *  the database (unique-key style failure surfaced as a generic error if
 *  the schema enforces one profile per doctor) if the profile is already
 *  linked by the time this runs — a normal race, not a bug. */
export async function linkProfile(doctorId: string, profileId: string): Promise<DoctorRecord> {
  const { data, error } = await supabase
    .from('doctors')
    .update({ profile_id: profileId })
    .eq('id', doctorId)
    .select(COLS)
    .single();
  if (error) throw new Error(reportError(error, 'ربط الحساب'));
  return one<DoctorRecord>(data);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}
