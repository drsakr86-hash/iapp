/* -------------------------------------------------------------------------
 * AppointmentCard — one appointment plus the actions currently legal for it.
 * -------------------------------------------------------------------------
 * The action buttons are NOT hard-coded. They come from
 * appointments.actionsFor(), which reads iapp.appointment_transitions at
 * runtime and filters by the caller's role. If the clinic changes its
 * workflow in the database, this component follows with no edit.
 *
 * Every action is an RPC. Nothing here writes appointment state directly.
 * ---------------------------------------------------------------------- */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as appointments from '../../services/appointments';
import type { AppointmentAction, BoardRow } from '../../services/appointments';
import { useToast } from '../../hooks/useToast';
import { Tag } from '../ui';

export function AppointmentCard({
  appointment,
  role,
  onChanged,
  showWait,
}: {
  appointment: BoardRow;
  role: string;
  onChanged: () => void;
  showWait?: boolean;
}) {
  const toast = useToast();
  const [actions, setActions] = useState<AppointmentAction[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    appointments
      .actionsFor(appointment, role)
      .then((a) => active && setActions(a))
      .catch(() => active && setActions([]));
    return () => {
      active = false;
    };
  }, [appointment, role]);

  const label = appointments.statusLabel(appointment.status ?? 'REQUESTED');
  const name = appointment.display_name || 'بدون اسم';

  async function run(action: AppointmentAction) {
    let arg: string | undefined;
    if (action.requiresReason) {
      const reason = window.prompt(`سبب «${action.label}»؟`);
      if (!reason || reason.trim().length < 3) {
        toast.error('السبب مطلوب (3 أحرف على الأقل)');
        return;
      }
      arg = reason.trim();
    }
    setBusy(action.to);
    try {
      await action.run(arg);
      toast.success(`تم: ${action.label}`);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="appt">
      <div className="appt__head">
        <span className="appt__time">{(appointment.scheduled_time ?? '').slice(0, 5)}</span>
        <div className="appt__who">
          {appointment.patient_id ? (
            <Link to={`/doctor/patients/${appointment.patient_id}`} className="appt__name">
              {name}
            </Link>
          ) : (
            <span className="appt__name">{name}</span>
          )}
          <div className="appt__meta muted">
            {appointment.patient_code ? appointment.patient_code + ' · ' : ''}
            {appointment.display_phone ?? ''}
            {appointment.room ? ' · غرفة ' + appointment.room : ''}
          </div>
        </div>
        <Tag label={`${label.icon} ${label.ar}`} color={label.color} />
      </div>

      {showWait && appointments.waitLabel(appointment) ? (
        <div className="appt__wait muted">منذ {appointments.waitLabel(appointment)}</div>
      ) : null}

      {appointment.notes ? <div className="appt__notes muted">{appointment.notes}</div> : null}

      <div className="appt__actions">
        {/* The clinical entry point: opens the patient file with the visit
            form primed from this appointment. Completing that visit calls
            complete_appointment(p_visit_id), which is the only supported way
            to link a visit to its appointment. Disabled — with the reason
            visible — for a walk-in with no patient record. */}
        {appointment.patient_id ? (
          <Link
            className="chip chip--primary"
            to={`/doctor/patients/${appointment.patient_id}?appointment=${appointment.id}&action=visit`}
          >
            بدء الكشف
          </Link>
        ) : (
          <button className="chip" disabled title="لا سجل مريض لهذا الموعد">
            بدء الكشف — بلا ملف
          </button>
        )}
      </div>

      {actions.length ? (
        <div className="appt__actions">
          {actions.map((a) => (
            <button
              key={a.to}
              className="chip"
              style={{ borderColor: a.color, color: a.color }}
              disabled={busy !== null}
              onClick={() => void run(a)}
            >
              {busy === a.to ? '…' : a.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
