/* -------------------------------------------------------------------------
 * PatientLinkGate — wraps every /patient/* route.
 * -------------------------------------------------------------------------
 * A signed-in 'patient' profile is not automatically a specific patient —
 * profiles.role defaults to 'patient' for ANY self-signup (see
 * public.handle_new_user() in production-schema.sql). Real access to a
 * patient's own appointments/prescriptions/exams only starts once
 * iapp.claim_patient_record() has created a *verified* row in
 * public.patient_links for this account. Until then every RLS-scoped
 * query in services/patientPortal.ts legitimately returns nothing, which
 * would look like an empty, broken app rather than an unlinked account —
 * so this gate checks link status first and asks for patient code +
 * phone before rendering any child route.
 * ---------------------------------------------------------------------- */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Outlet } from 'react-router-dom';
import { Button, Card, Field, Input, Spinner } from '../ui';
import * as portal from '../../services/patientPortal';

export function PatientLinkGate() {
  const [status, setStatus] = useState<'checking' | 'linked' | 'unlinked'>('checking');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setStatus('checking');
    try {
      const r = await portal.linkStatus();
      setStatus(r.linked ? 'linked' : 'unlinked');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر التحقق من حالة الحساب');
      setStatus('unlinked');
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void check();
  }, [check]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await portal.claimPatientRecord(code, phone);
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? 'تعذّر ربط الملف');
      return;
    }
    setStatus('linked');
  }

  if (status === 'checking') return <Spinner fullPage label="جارٍ التحقق من حسابك…" />;

  if (status === 'unlinked') {
    return (
      <Card title="اربط حسابك بملفك الطبي">
        <p className="muted">
          أدخل كود الملف الطبي ورقم الهاتف المسجَّل في العيادة — نفس البيانات اللي معاك في
          بطاقة الملف الورقية.
        </p>
        <form className="stack" onSubmit={onSubmit}>
          <Field label="كود الملف">
            <Input
              value={code}
              dir="ltr"
              required
              autoComplete="off"
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
          <Field label="رقم الهاتف">
            <Input
              value={phone}
              type="tel"
              dir="ltr"
              required
              autoComplete="tel"
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          {error ? <p className="alert">{error}</p> : null}
          <Button type="submit" full disabled={busy}>
            {busy ? 'جارٍ الربط…' : 'ربط الحساب'}
          </Button>
        </form>
      </Card>
    );
  }

  return <Outlet />;
}
