/* -------------------------------------------------------------------------
 * DoctorAppointments — today's list plus the booking action.
 * -------------------------------------------------------------------------
 * A new booking is prepended to the list from the row the RPC returns, so it
 * is visible immediately without a refetch or a reload. The list is also
 * reloaded when the date changes, which is what makes it survive a refresh:
 * the row is in the database, not only in React state.
 * ---------------------------------------------------------------------- */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Tag } from '../../components/ui';
import { MedValue } from '../../components/medical/Medical';
import { NewAppointmentForm } from '../../components/appointments/NewAppointmentForm';
import { useDoctor } from '../../hooks/useDoctor';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import * as appointments from '../../services/appointments';
import type { BoardRow } from '../../services/appointments';
import { today } from '../../utils/medical';

export default function DoctorAppointments() {
  useDocumentTitle('المواعيد');
  const { doctor } = useDoctor();

  const [date, setDate] = useState(today());
  const [list, setList] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setList(await appointments.byDate(date));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل المواعيد');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    /* Server state keyed by date — re-read on change. */
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  return (
    <div className="stack">
      <Card title="المواعيد">
        <div className="row" style={{ gap: 8, alignItems: 'end' }}>
          <label className="field" style={{ flex: 1 }}>
            <span className="field__label">اليوم</span>
            <input type="date" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <Button onClick={() => setBooking((v) => !v)}>
            {booking ? 'إغلاق' : 'حجز موعد جديد'}
          </Button>
        </div>
      </Card>

      {booking ? (
        <NewAppointmentForm
          defaultDoctorId={doctor?.id ?? null}
          onCreated={(row) => {
            setBooking(false);
            /* The just-booked row is the raw appointments table shape, not
               the joined v_appointment_board shape this list now uses (it
               has no display_name/patient_code/doctor_name), so a reload
               is used instead of splicing an incompatible row in by hand. */
            if (row.scheduled_date === date) void load();
          }}
          onCancel={() => setBooking(false)}
        />
      ) : null}

      <Card title={`مواعيد اليوم (${list.length})`}>
        {loading ? <p className="muted">جارٍ التحميل…</p> : null}
        {error ? <p className="alert">{error}</p> : null}
        {!loading && !error && !list.length ? (
          <p className="muted">لا توجد مواعيد في هذا اليوم.</p>
        ) : null}

        {list.map((a) => {
          const label = appointments.statusLabel(a.status ?? 'REQUESTED');
          return (
            <div className="rx-med" key={a.id}>
              <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                <strong>
                  <MedValue>{String(a.scheduled_time ?? '').slice(0, 5)}</MedValue>
                </strong>
                <Tag label={`${label.icon} ${label.ar}`} color={label.color} />
              </div>
              <p className="rx-med__sig">
                {a.display_name ?? a.patient_id ?? '—'}
                {a.patient_code ? ` — ${a.patient_code}` : ''}
                {a.appointment_type ? ` — ${a.appointment_type}` : ''}
              </p>
              {a.patient_id ? (
                <Link
                  className="chip chip--primary"
                  to={`/doctor/patients/${a.patient_id}?appointment=${a.id}&action=visit`}
                >
                  فتح ملف المريض / بدء الكشف
                </Link>
              ) : (
                <button className="chip" disabled title="لا سجل مريض لهذا الموعد">
                  بدء الكشف — بلا ملف
                </button>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
