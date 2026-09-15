import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Spinner } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import * as portal from '../../services/patientPortal';
import { statusLabel } from '../../services/appointments';
import * as M from '../../utils/models';

export default function PatientHome() {
  useDocumentTitle('بوابة المريض');
  const { profile } = useAuth();

  const [next, setNext] = useState<portal.MyAppointmentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await portal.myAppointments();
        const today = M.today();
        const upcoming = rows
          .filter((r) => r.scheduled_date >= today && r.status !== 'CANCELLED' && r.status !== 'NO_SHOW')
          .sort((a, b) =>
            a.scheduled_date === b.scheduled_date
              ? a.scheduled_time.localeCompare(b.scheduled_time)
              : a.scheduled_date.localeCompare(b.scheduled_date),
          );
        if (alive) setNext(upcoming[0] ?? null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'تعذّر تحميل البيانات');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="stack">
      <Card title={`أهلاً ${profile?.fullName ?? ''}`}>
        <p className="muted">من هنا تقدر تشوف مواعيدك وروشتاتك ونتائج فحوصاتك.</p>
      </Card>

      <Card title="أقرب موعد">
        {loading ? <Spinner label="جارٍ التحميل…" /> : null}
        {error ? <p className="alert">{error}</p> : null}
        {!loading && !error && !next ? <p className="muted">لا يوجد موعد قادم مسجَّل.</p> : null}
        {!loading && !error && next ? (
          <div className="stack">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{M.fmtDay(next.scheduled_date)}</strong>
              <span>{next.scheduled_time.slice(0, 5)}</span>
            </div>
            <p className="muted">
              {next.clinics?.name_ar ?? '—'}
              {next.doctors?.full_name_ar ? ` — د. ${next.doctors.full_name_ar}` : ''}
            </p>
            <p>{statusLabel(next.status).ar}</p>
          </div>
        ) : null}
        <Link className="chip chip--primary" to="/patient/appointments">
          كل مواعيدي
        </Link>
      </Card>
    </div>
  );
}
