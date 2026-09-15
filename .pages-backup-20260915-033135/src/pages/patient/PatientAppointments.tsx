import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Spinner, Tag } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import * as portal from '../../services/patientPortal';
import { statusLabel } from '../../services/appointments';
import { BookAppointmentModal } from '../../components/patient/BookAppointmentModal';
import * as M from '../../utils/models';

export default function PatientAppointments() {
  useDocumentTitle('مواعيدي');
  const [rows, setRows] = useState<portal.MyAppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portal.myAppointments();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل المواعيد');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  const today = M.today();
  const upcoming = rows.filter((r) => r.scheduled_date >= today);
  const past = rows.filter((r) => r.scheduled_date < today);

  return (
    <div className="stack">
      <Button onClick={() => setBooking(true)} full>
        + حجز موعد جديد
      </Button>

      {loading ? <Spinner label="جارٍ التحميل…" /> : null}
      {error ? <p className="alert">{error}</p> : null}

      {!loading && !error ? (
        <>
          <Card title={`القادمة (${upcoming.length})`}>
            {upcoming.length === 0 ? <p className="muted">لا توجد مواعيد قادمة.</p> : null}
            {upcoming.map((a) => (
              <AppointmentRow key={a.id} a={a} />
            ))}
          </Card>

          {past.length > 0 ? (
            <Card title={`السابقة (${past.length})`}>
              {past.map((a) => (
                <AppointmentRow key={a.id} a={a} dim />
              ))}
            </Card>
          ) : null}

          {rows.length === 0 ? <p className="muted">لا توجد مواعيد مسجَّلة بعد.</p> : null}
        </>
      ) : null}

      {booking ? (
        <BookAppointmentModal onClose={() => setBooking(false)} onBooked={() => void load()} />
      ) : null}
    </div>
  );
}

function AppointmentRow({ a, dim }: { a: portal.MyAppointmentRow; dim?: boolean }) {
  const label = statusLabel(a.status);
  return (
    <div className="rx-med" style={dim ? { opacity: 0.75 } : undefined}>
      <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
        <strong>
          {M.fmtDay(a.scheduled_date)} — {a.scheduled_time.slice(0, 5)}
        </strong>
        <Tag label={`${label.icon} ${label.ar}`} color={label.color} />
      </div>
      <p className="rx-med__sig">
        {a.clinics?.name_ar ?? '—'}
        {a.doctors?.full_name_ar ? ` — د. ${a.doctors.full_name_ar}` : ''}
        {a.appointment_type ? ` — ${a.appointment_type}` : ''}
      </p>
      {a.notes ? <p className="muted">📝 {a.notes}</p> : null}
    </div>
  );
}
