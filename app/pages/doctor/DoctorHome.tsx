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

export default function DoctorHome() {
  useDocumentTitle('اليوم');

  const { doctor, displayName } = useDoctor();

  const [list, setList] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const date = today();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await appointments.board({
        date,
      });

      const doctorRows = doctor?.id
        ? rows.filter((row) => row.doctor_id === doctor.id)
        : rows;

      doctorRows.sort((a, b) =>
        String(a.scheduled_time ?? '').localeCompare(String(b.scheduled_time ?? '')),
      );

      setList(doctorRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل مواعيد اليوم');
    } finally {
      setLoading(false);
    }
  }, [date, doctor?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    appointment: BoardRow,
    action: appointments.AppointmentAction,
  ) {
    setWorkingId(appointment.id);

    try {
      await action.run();

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تنفيذ الإجراء');
    } finally {
      setWorkingId(null);
    }
  }

  const confirmed = list.filter((a) => a.status === 'CONFIRMED').length;
  const arrived = list.filter((a) => a.status === 'ARRIVED').length;
  const waiting = list.filter((a) => a.status === 'WAITING').length;
  const inClinic = list.filter((a) => a.status === 'IN_CLINIC').length;
  const completed = list.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="stack">

      <Card title={`أهلاً ${displayName}`}>
        <p className="muted">
          لوحة الطبيب اليومية — مواعيد اليوم وحالة المرضى.
        </p>

        <div
          className="row"
          style={{
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 12,
          }}
        >
          <Tag label={`📅 ${date}`} color="var(--accent)" />
          <Tag label={`👥 ${list.length} موعد`} color="var(--teal)" />
          <Tag label={`✓ ${completed} مكتمل`} color="var(--success)" />
        </div>
      </Card>

      <div
        className="row"
        style={{
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <Card title="المؤكدة">
          <strong style={{ fontSize: 28 }}>{confirmed}</strong>
        </Card>

        <Card title="وصلوا">
          <strong style={{ fontSize: 28 }}>{arrived}</strong>
        </Card>

        <Card title="في الانتظار">
          <strong style={{ fontSize: 28 }}>{waiting}</strong>
        </Card>

        <Card title="داخل العيادة">
          <strong style={{ fontSize: 28 }}>{inClinic}</strong>
        </Card>
      </div>

      <Card title="اليوم">
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            gap: 8,
            alignItems: 'end',
          }}
        >
          <div>
            <strong>{displayName}</strong>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              {list.length
                ? `${list.length} موعد مسجل اليوم`
                : 'لا توجد مواعيد مسجلة اليوم'}
            </p>
          </div>

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

            if (row.scheduled_date === date) {
              void load();
            }
          }}
          onCancel={() => setBooking(false)}
        />
      ) : null}

      {error ? <p className="alert">{error}</p> : null}

      <Card title={`مواعيد اليوم (${list.length})`}>
        {loading ? (
          <p className="muted">جارٍ تحميل مواعيد اليوم…</p>
        ) : null}

        {!loading && !error && !list.length ? (
          <p className="muted">
            لا توجد مواعيد للدكتور {displayName} اليوم.
          </p>
        ) : null}

        {list.map((a) => {
          const label = appointments.statusLabel(a.status ?? 'REQUESTED');

          return (
            <div className="rx-med" key={a.id}>

              <div
                className="row"
                style={{
                  justifyContent: 'space-between',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <strong>
                  <MedValue>
                    {String(a.scheduled_time).slice(0, 5)}
                  </MedValue>
                </strong>

                <Tag
                  label={`${label.icon} ${label.ar}`}
                  color={label.color}
                />
              </div>

              <p
                className="rx-med__sig"
                style={{ fontSize: 16, fontWeight: 600 }}
              >
                {a.display_name ?? a.patient_id ?? 'مريض غير محدد'}
              </p>

              {a.patient_code ? (
                <p className="muted">
                  كود المريض: {a.patient_code}
                </p>
              ) : null}

              <div
                className="row"
                style={{
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                {a.clinic_name ? (
                  <Tag
                    label={`🏥 ${a.clinic_name}`}
                    color="var(--muted)"
                  />
                ) : null}

                {a.doctor_name ? (
                  <Tag
                    label={`👨‍⚕️ ${a.doctor_name}`}
                    color="var(--accent)"
                  />
                ) : null}

                {a.wait_minutes != null && a.wait_minutes > 0 ? (
                  <Tag
                    label={`⏱ ${a.wait_minutes} دقيقة`}
                    color="var(--gold)"
                  />
                ) : null}
              </div>

              {a.appointment_type ? (
                <p className="muted">
                  نوع الموعد: {a.appointment_type}
                </p>
              ) : null}

              {a.notes ? (
                <p className="muted">
                  ملاحظات: {a.notes}
                </p>
              ) : null}

              {a.patient_id ? (
                <div className="row" style={{ marginTop: 8 }}>
                  <Link
                    className="chip chip--primary"
                    to={`/doctor/patients/${a.patient_id}?appointment=${a.id}&action=visit`}
                  >
                    فتح ملف المريض / بدء الكشف
                  </Link>
                </div>
              ) : null}

              <AppointmentActions
                appointment={a}
                working={workingId === a.id}
                onRun={(action) => void runAction(a, action)}
              />
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function AppointmentActions({
  appointment,
  working,
  onRun,
}: {
  appointment: BoardRow;
  working: boolean;
  onRun: (action: appointments.AppointmentAction) => void;
}) {
  const [actions, setActions] = useState<appointments.AppointmentAction[]>(
    [],
  );

  useEffect(() => {
    let active = true;

    appointments
      .actionsFor(appointment, 'doctor')
      .then((rows) => {
        if (active) setActions(rows);
      })
      .catch(() => {
        if (active) setActions([]);
      });

    return () => {
      active = false;
    };
  }, [appointment]);

  if (!actions.length) return null;

  return (
    <div
      className="row"
      style={{
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 12,
      }}
    >
      {actions.map((action) => (
        <Button
          key={action.to}
          disabled={working}
          onClick={() => onRun(action)}
        >
          {working ? 'جارٍ التنفيذ…' : action.label}
        </Button>
      ))}
    </div>
  );
}