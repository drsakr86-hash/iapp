/* -------------------------------------------------------------------------
 * auth service — ported from v2/iapp-core.js
 * -------------------------------------------------------------------------
 * The role is read from public.profiles on the SERVER, keyed by auth.uid().
 * A client-supplied role claim is never trusted, and revoking a role takes
 * effect on the next profile read.
 *
 * Frontend guards are UX only. RLS is the security boundary — a user who
 * defeats every route guard in this app still sees nothing they are not
 * entitled to.
 * ---------------------------------------------------------------------- */

import type { Session } from '@supabase/supabase-js';
import { supabase, publicSchema } from './supabase';
import { isRole, type Profile } from '../types/domain';

export type ProfileFailure =
  | 'no_session'
  | 'read_failed'
  | 'no_profile'
  | 'inactive'
  | 'bad_role';

export interface ProfileResult {
  profile: Profile | null;
  failure?: ProfileFailure;
  message?: string;
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/**
 * Four distinct failure causes used to collapse into one vague message in an
 * earlier version of the legacy app. They are kept separate here for the
 * same reason: "تعذّر تسجيل الدخول" tells nobody which of these it was.
 */
export async function loadProfile(): Promise<ProfileResult> {
  const session = await getSession();
  if (!session) return { profile: null, failure: 'no_session' };

  const { data, error } = await publicSchema()
    .from('profiles')
    .select('id, role, full_name, phone, is_active')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    return {
      profile: null,
      failure: 'read_failed',
      message: 'تعذّر قراءة ملف الحساب: ' + error.message,
    };
  }
  if (!data) {
    return {
      profile: null,
      failure: 'no_profile',
      message: 'لا يوجد ملف تعريف لهذا الحساب في جدول profiles',
    };
  }

  const row = data as {
    id: string;
    role: unknown;
    full_name: string | null;
    phone: string | null;
    is_active: boolean | null;
  };

  if (!row.is_active) {
    return { profile: null, failure: 'inactive', message: 'الحساب معطَّل (is_active = false)' };
  }
  if (!isRole(row.role)) {
    return {
      profile: null,
      failure: 'bad_role',
      message: 'دور غير معروف لهذا الحساب: ' + String(row.role),
    };
  }

  return {
    profile: {
      userId: row.id,
      email: session.user.email,
      role: row.role,
      fullName: row.full_name,
      phone: row.phone,
    },
  };
}

export interface SignInResult {
  ok: boolean;
  profile?: Profile;
  error?: string;
}

/**
 * A successful password check with an unusable profile is NOT a successful
 * login. The legacy app signs out in that case rather than leaving a session
 * with no role attached; the same is done here.
 */
export async function signIn(email: string, password: string): Promise<SignInResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: String(email ?? '').trim(),
    password: password ?? '',
  });

  if (error) {
  console.error('Supabase sign-in error:', {
    message: error.message,
    status: error.status,
    name: error.name,
  });
  return { ok: false, error: `${error.name ?? 'AuthError'}: ${error.message}` };
}

  const result = await loadProfile();
  if (!result.profile) {
    await signOut();
    return { ok: false, error: result.message ?? 'تعذّر تسجيل الدخول' };
  }
  return { ok: true, profile: result.profile };
}

const SIGNUP_ERRORS: Record<string, string> = {
  'User already registered': 'هذا البريد الإلكتروني مسجَّل بالفعل — سجّل الدخول بدلًا من ذلك',
  'Password should be at least': 'كلمة المرور قصيرة جدًا — 6 أحرف على الأقل',
  'Unable to validate email address': 'صيغة البريد الإلكتروني غير صحيحة',
  'Signups not allowed': 'التسجيل الذاتي غير مفعّل حاليًا — تواصل مع العيادة',
};

function translateSignupError(message: string): string {
  for (const k of Object.keys(SIGNUP_ERRORS)) if (message.includes(k)) return SIGNUP_ERRORS[k];
  return message;
}

/**
 * Self-signup for the patient portal only. This does NOT create a
 * clinical patient record and does NOT grant any data access by itself —
 * it only creates an auth.users row, which public.handle_new_user()
 * turns into a public.profiles row with role='patient' by default (the
 * least-privileged role). Actual access to a specific patient's data
 * requires a separate, explicit step: claimPatientRecord() in
 * services/patientPortal.ts, verified against patient_code + phone.
 *
 * DEPENDS ON a database trigger that may not be attached yet — see
 * supabase/migrations/20260910000000_attach_new_user_trigger.sql. If it
 * is missing, signUp() below will appear to succeed (auth.users row is
 * created) but the very next loadProfile() will fail with 'no_profile'.
 */
export async function signUp(
  email: string,
  password: string,
  fullName?: string,
): Promise<SignInResult> {
  const { error } = await supabase.auth.signUp({
    email: String(email ?? '').trim(),
    password: password ?? '',
    options: fullName?.trim() ? { data: { full_name: fullName.trim() } } : undefined,
  });

  if (error) {
    return { ok: false, error: translateSignupError(error.message) };
  }

  // signUp() does not always return an active session (e.g. if the
  // Supabase project requires email confirmation) — in that case there
  // is no profile to load yet, and that is not a failure of this
  // function. The caller (SignupPage) distinguishes "created, check your
  // email" from "created and signed in" by checking auth state itself.
  const session = await getSession();
  if (!session) return { ok: true };

  const result = await loadProfile();
  return result.profile ? { ok: true, profile: result.profile } : { ok: true };
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    /* signing out locally is still correct even if the network call fails */
  }
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}
