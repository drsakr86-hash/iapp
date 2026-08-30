/**
 * Login.
 *
 * Loading / success / error are all explicit — a login that silently does
 * nothing is the single most common support complaint in a clinic.
 * Error text comes from the service already translated to Arabic; the raw
 * Supabase message is never rendered.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AuthLayout } from '../layouts/AuthLayout';
import { Button, Field, Input, Spinner } from '../components/ui';
import { roleHome } from '../routes/roleHome';

export default function LoginPage() {
  useDocumentTitle('تسجيل الدخول');

  const { status, profile, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in? Don't show a login form — go where they belong.
  useEffect(() => {
    if (status === 'ready' && profile) {
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? roleHome(profile.role), { replace: true });
    }
  }, [status, profile, navigate, location.state]);

  if (status === 'loading') return <Spinner label="جارٍ التحقق من الجلسة…" />;
  if (status === 'no_profile') return <Navigate to="/unauthorized" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await signIn(email, password);
    setBusy(false);
    if (!result.ok) setError(result.error ?? 'تعذّر تسجيل الدخول');
    // On success the auth listener redirects; nothing to do here.
  }

  return (
    <AuthLayout>
      <form className="stack" onSubmit={onSubmit}>
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
            autoComplete="current-password"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error ? <p className="alert">{error}</p> : null}

        <Button type="submit" full disabled={busy}>
          {busy ? 'جارٍ الدخول…' : 'دخول'}
        </Button>
      </form>
    </AuthLayout>
  );
}
