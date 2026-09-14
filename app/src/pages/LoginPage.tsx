/**
 * Login / Signup.
 *
 * Loading / success / error are all explicit — a login that silently does
 * nothing is the single most common support complaint in a clinic.
 * Error text comes from the service already translated to Arabic; the raw
 * Supabase message is never rendered.
 *
 * Signup exists ONLY for the patient portal. It creates an auth account
 * with role='patient' (the least-privileged role, assigned automatically
 * by public.handle_new_user() — see services/auth.ts) and nothing more:
 * it does NOT create or link a clinical patient record. That happens
 * separately, after login, in PatientLinkGate via
 * iapp.claim_patient_record(). Doctor/secretary/admin accounts are never
 * created through this form — those are provisioned directly.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AuthLayout } from '../layouts/AuthLayout';
import { Button, Field, Input, Spinner } from '../components/ui';
import { roleHome } from '../routes/roleHome';
import * as authSvc from '../services/auth';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  useDocumentTitle('تسجيل الدخول');

  const { status, profile, signIn, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  // Already signed in? Don't show a login form — go where they belong.
  useEffect(() => {
    if (status === 'ready' && profile) {
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? roleHome(profile.role), { replace: true });
    }
  }, [status, profile, navigate, location.state]);

  if (status === 'loading') return <Spinner fullPage label="جارٍ التحقق من الجلسة…" />;
  if (status === 'no_profile') return <Navigate to="/unauthorized" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setCheckEmail(false);

    if (mode === 'login') {
      const result = await signIn(email, password);
      setBusy(false);
      if (!result.ok) setError(result.error ?? 'تعذّر تسجيل الدخول');
      // On success the auth listener redirects; nothing to do here.
      return;
    }

    const result = await authSvc.signUp(email, password, fullName);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'تعذّر إنشاء الحساب');
      return;
    }
    if (result.profile) {
      // A session already exists (no email confirmation required) —
      // refresh the shared auth context so the redirect effect above
      // fires with the new profile, same as a normal login.
      await refresh();
      return;
    }
    // Account created but no session yet — Supabase project requires
    // email confirmation. Nothing more to do here until the person
    // confirms and comes back to log in normally.
    setCheckEmail(true);
    setMode('login');
  }

  return (
    <AuthLayout>
      {checkEmail ? (
        <p className="alert" style={{ marginBottom: 12 }}>
          تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتفعيله، ثم سجّل الدخول.
        </p>
      ) : null}

      <form className="stack" onSubmit={onSubmit}>
        {mode === 'signup' ? (
          <Field label="الاسم الكامل">
            <Input
              value={fullName}
              autoComplete="name"
              required
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
        ) : null}

        <Field label="البريد الإلكتروني">
          <Input
            type="email"
            value={email}
            autoComplete="username"
            inputMode="email"
            dir="ltr"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="كلمة المرور">
          <Input
            type="password"
            value={password}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={mode === 'signup' ? 6 : undefined}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error ? <p className="alert">{error}</p> : null}

        <Button type="submit" full disabled={busy}>
          {busy
            ? mode === 'login'
              ? 'جارٍ الدخول…'
              : 'جارٍ إنشاء الحساب…'
            : mode === 'login'
              ? 'دخول'
              : 'إنشاء حساب'}
        </Button>
      </form>

      <p className="muted" style={{ marginTop: 12, textAlign: 'center' }}>
        {mode === 'login' ? (
          <>
            مريض جديد؟{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
            >
              أنشئ حساب بوابة المريض
            </button>
          </>
        ) : (
          <>
            عندك حساب بالفعل؟{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
            >
              سجّل الدخول
            </button>
          </>
        )}
      </p>
    </AuthLayout>
  );
}
