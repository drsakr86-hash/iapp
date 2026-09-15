/* -------------------------------------------------------------------------
 * VisitForm — new visit, and edit of an existing one.
 * -------------------------------------------------------------------------
 * Ported from the visit sheet in v2/doctor.html (line ~1419).
 *
 * The important behaviour is at the end of save(): when the visit is created
 * from an appointment, the appointment is completed with complete_appointment
 * (p_visit_id) — the only supported way to link the two.
 *
 * ⚠️ A failure to complete the appointment does NOT invalidate the visit. The
 * visit is already saved; the failure is stated plainly instead of being
 * swallowed or triggering a re-save. The realistic causes are someone else
 * completing it first, or a dropped connection, and both are fixed by
 * refreshing rather than by saving again.
 * ---------------------------------------------------------------------- */

import { useEffect, useState } from 'react';
import * as visitsSvc from '../../services/visits';
import * as appointmentsSvc from '../../services/appointments';
import type { BoardRow } from '../../services/appointments';
import * as M from '../../utils/models';
import type { Patient, Visit } from '../../types/clinical';
import { useToast } from '../../hooks/useToast';
import { Button, Field, Input, Modal } from '../ui';
import * as clinicsSvc from '../../services/clinics';
import * as dropdownSvc from '../../services/dropdownOptions';

export function VisitForm({
  patient,
  visit,
  appointment,
  doctorId,
  clinicId,
  onClose,
  onSaved,
}: {
  patient: Patient;
  visit?: Visit | null;
  appointment?: BoardRow | null;
  doctorId?: string | null;
  clinicId?: string | null;
  onClose: () => void;
  /** Receives the saved visit so the caller can chain into the examination. */
  onSaved: (saved: Visit) => void;
}) {
  const toast = useToast();
  const isNew = !visit;

  const [clinics, setClinics] = useState<clinicsSvc.ClinicRow[]>([]);
  const [complaintOptions, setComplaintOptions] = useState<string[]>(M.COMPLAINTS);
  const [f, setF] = useState({
    visit_date: visit?.visit_date ?? M.today(),
    visit_type: visit?.visit_type ?? 'routine',
    clinic_id: visit?.clinic_id ?? clinicId ?? appointment?.clinic_id ?? patient.primary_clinic_id ?? '',
    chief_complaint: visit?.chief_complaint ?? appointment?.notes ?? '',
    summary: visit?.summary ?? '',
    notes: visit?.notes ?? '',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([clinicsSvc.list(), dropdownSvc.listActive()]).then(([c, opts]) => {
      if (!active) return;
      setClinics(c);
      const complaints = opts.filter((o) => o.field_key === 'complaint').map((o) => o.label_ar);
      if (complaints.length) setComplaintOptions(complaints);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setError(null);

    const row = {
      patient_id: patient.id,
      clinic_id: f.clinic_id || null,
      doctor_id: doctorId ?? null,
      appointment_id: appointment?.id ?? null,
      visit_date: f.visit_date,
      visit_type: f.visit_type || 'routine',
      chief_complaint: f.chief_complaint,
      summary: f.summary,
      notes: f.notes,
    };

    const chk = M.validateVisit(row);
    if (!chk.ok) {
      setError(chk.errors[0]);
      return;
    }
    // Clinic is required going forward for new visits — it is not inferred
    // or defaulted; the doctor must pick it explicitly (see clinic_id
    // resolution above). Existing visits that were historically saved
    // without a clinic are left as-is unless the doctor now sets one.
    if (isNew && !row.clinic_id) {
      setError('العيادة مطلوبة لحفظ الزيارة');
      return;
    }

    setBusy(true);
    try {
      const saved = isNew ? await visitsSvc.create(row) : await visitsSvc.update(visit.id, row);

      let extra = '';
      if (appointment && saved?.id) {
        try {
          await appointmentsSvc.complete(appointment.id, saved.id);
          extra = ' وأُنهي الموعد';
        } catch (err) {
          toast.error('حُفظت الزيارة، لكن إنهاء الموعد تعذّر: ' + M.dbError(err));
        }
      }
      if (!appointment || extra) toast.success('تم حفظ الزيارة' + extra);
      onSaved(saved);
    } catch (e) {
      setError(M.dbError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={isNew ? `زيارة جديدة — ${patient.full_name}` : 'تعديل الزيارة'} onClose={onClose}>
      {appointment ? (
        <p className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
          مرتبطة بموعد {(appointment.scheduled_time ?? '').slice(0, 5)} — سيُنهى الموعد عند الحفظ.
        </p>
      ) : null}

      <div className="grid2">
        <Field label="العيادة *">
          <select className="input" value={f.clinic_id} onChange={(e) => set('clinic_id', e.target.value)}>
            <option value="">— اختر العيادة —</option>
            {clinics.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
          </select>
        </Field>
        <Field label="تاريخ الزيارة *">
          <Input
            type="date"
            dir="ltr"
            value={f.visit_date}
            onChange={(e) => set('visit_date', e.target.value)}
          />
        </Field>
        <Field label="نوع الزيارة">
          <select
            className="input"
            value={f.visit_type}
            onChange={(e) => set('visit_type', e.target.value)}
          >
            {Object.entries(M.VISIT_TYPE).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="الشكوى الرئيسية">
        <div className="suggest">
          <Input
            value={f.chief_complaint}
            onChange={(e) => set('chief_complaint', e.target.value)}
          />
          <select
            className="input suggest__pick"
            value=""
            onChange={(e) => e.target.value && set('chief_complaint', e.target.value)}
            aria-label="اقتراحات الشكوى"
          >
            <option value="">▾</option>
            {complaintOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </Field>

      <Field label="الخلاصة">
        <textarea
          className="input"
          rows={2}
          value={f.summary}
          onChange={(e) => set('summary', e.target.value)}
        />
      </Field>
      <Field label="ملاحظات">
        <textarea
          className="input"
          rows={2}
          value={f.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </Field>

      {error ? <p className="alert">{error}</p> : null}

      <div className="row" style={{ marginBlockStart: 14 }}>
        <Button onClick={() => void save()} disabled={busy}>
          {busy ? 'جارٍ الحفظ…' : isNew ? 'حفظ الزيارة' : 'حفظ التعديل'}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={busy}>
          إلغاء
        </Button>
      </div>
    </Modal>
  );
}
