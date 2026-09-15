/* -------------------------------------------------------------------------
 * DoctorPatientRecord — one patient: profile, visit, exam, diagnosis,
 * treatment, prescription, follow-up, imaging — the full clinical file.
 * -------------------------------------------------------------------------
 * This screen is the place where the doctor_id used for every write comes
 * from `useDoctor()`, once. Nothing below constructs a doctor name or id of
 * its own.
 *
 * VISIT STATE — iapp.visits has no status column (confirmed against the
 * generated database types): a visit is open while is_locked is false and
 * closed once is_locked is true, set by visits.complete(). "Start Visit"
 * therefore first looks for today's already-open visit (visits.openToday)
 * before creating one, so a second click — or opening the same appointment
 * link twice — resumes the same row instead of creating a duplicate.
 *
 * NAVIGATION — reached either at /doctor/patients (in-page picker) or at
 * /doctor/patients/:patientId, optionally with ?appointment=<id>&action=visit
 * from AppointmentCard / the appointment lists. That query pair primes the
 * visit form with the appointment it was opened from, so completing the
 * visit can complete the appointment through the one supported path
 * (appointments.complete → complete_appointment RPC).
 * ---------------------------------------------------------------------- */

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, Tag } from '../../components/ui';
import { MedText, MedValue } from '../../components/medical/Medical';
import { GlassesRxForm } from '../../components/rx/GlassesRxForm';
import { MedicationRxForm } from '../../components/rx/MedicationRxForm';
import { ImagingOrderForm } from '../../components/imaging/ImagingOrderForm';
import { ImagingUploadForm } from '../../components/imaging/ImagingUploadForm';
import { VisitForm } from '../../components/doctor/VisitForm';
import { ExaminationForm } from '../../components/doctor/ExaminationForm';
import { ExamCard } from '../../components/doctor/ExamCard';
import { ComparisonView } from '../../components/doctor/ComparisonView';
import { useDoctor } from '../../hooks/useDoctor';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import * as patientsSvc from '../../services/patients';
import * as imaging from '../../services/imaging';
import * as visitsSvc from '../../services/visits';
import * as examinationsSvc from '../../services/examinations';
import * as prescriptionsSvc from '../../services/prescriptions';
import * as appointmentsSvc from '../../services/appointments';
import type { BoardRow } from '../../services/appointments';
import * as M from '../../utils/models';
import type { Diagnosis, Examination, FollowUp, Patient, Visit } from '../../types/clinical';
import {
  EYE_AR,
  ORDER_STATUS_AR,
  URGENCY_AR,
  modalityLabel,
  type Eye,
} from '../../types/domain';

interface TimelineItem {
  date: string;
  kind: string;
  label: string;
  detail?: string | null;
}

export default function DoctorPatientRecord() {
  useDocumentTitle('ملف المريض');
  const { doctor, displayName } = useDoctor();
  const toast = useToast();
  const params = useParams<{ patientId?: string }>();
  const [searchParams] = useSearchParams();
  const urlAppointmentId = searchParams.get('appointment');
  const urlAction = searchParams.get('action');

  const [patients, setPatients] = useState<patientsSvc.PatientRow[]>([]);
  const [patientId, setPatientId] = useState(params.patientId ?? '');
  const [search, setSearch] = useState('');

  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeVisit, setActiveVisit] = useState<Visit | null>(null);
  const [linkedAppointment, setLinkedAppointment] = useState<BoardRow | null>(null);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [exams, setExams] = useState<Examination[]>([]);
  const [showExamForm, setShowExamForm] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [dxText, setDxText] = useState('');
  const [dxEye, setDxEye] = useState('');
  const [dxPrimary, setDxPrimary] = useState(false);
  const [dxSaving, setDxSaving] = useState(false);
  const [dxWorking, setDxWorking] = useState<string | null>(null);

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [fuDate, setFuDate] = useState('');
  const [fuReason, setFuReason] = useState('');
  const [fuSaving, setFuSaving] = useState(false);

  const [prescriptions, setPrescriptions] = useState<prescriptionsSvc.PrescriptionRow[]>([]);

  const [studies, setStudies] = useState<imaging.Study[]>([]);
  const [orders, setOrders] = useState<imaging.ImagingOrder[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  /* Patient search — only while nothing is selected. */
  useEffect(() => {
    if (patientId) return;
    let active = true;
    const t = setTimeout(() => {
      patientsSvc
        .list({ search, limit: 30 })
        .then((p) => active && setPatients(p))
        .catch((e: Error) => active && setError(e.message));
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [search, patientId]);

  /* The route param is the source of truth when present — deep links from
     the appointment lists must land on the right patient even if the page
     had a different one selected before. */
  useEffect(() => {
    if (params.patientId && params.patientId !== patientId) {
      // oxlint-disable-next-line react/set-state-in-effect
      setPatientId(params.patientId);
    }
  }, [params.patientId, patientId]);

  const loadPatient = useCallback(async () => {
    if (!patientId) {
      setPatient(null);
      return;
    }
    setError(null);
    try {
      setPatient(await patientsSvc.getClinical(patientId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل بيانات المريض');
    }
  }, [patientId]);

  const loadClinicalRecord = useCallback(async () => {
    if (!patientId) {
      setVisits([]);
      setExams([]);
      setDiagnoses([]);
      setFollowUps([]);
      setPrescriptions([]);
      setStudies([]);
      setOrders([]);
      return;
    }
    setError(null);
    try {
      const [v, e, d, f, rx, s, o] = await Promise.all([
        visitsSvc.listByPatient(patientId),
        examinationsSvc.listByPatient(patientId),
        examinationsSvc.diagnoses.listByPatient(patientId),
        examinationsSvc.followUps.listByPatient(patientId),
        prescriptionsSvc.listByPatient(patientId),
        imaging.listByPatient(patientId),
        imaging.ordersByPatient(patientId),
      ]);
      setVisits(v);
      setExams(e);
      setDiagnoses(d);
      setFollowUps(f);
      setPrescriptions(rx);
      setStudies(s);
      setOrders(o);
      setThumbs(await imaging.thumbUrls(s));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل ملف المريض');
    }
  }, [patientId]);

  useEffect(() => {
    /* Server state keyed by patient — re-read on change. */
    // oxlint-disable-next-line react/set-state-in-effect
    void loadPatient();
    // oxlint-disable-next-line react/set-state-in-effect
    void loadClinicalRecord();
  }, [loadPatient, loadClinicalRecord]);

  /* Today's already-open visit, if any. This ONLY discovers a visit when
     none is currently known for this patient — it must not re-run on every
     reload of the visit list, because that raced with the direct
     setActiveVisit(v) below: saving a visit set activeVisit correctly, then
     loadClinicalRecord()'s refresh changed `visits`, re-triggering this
     query a second time, and if that second read landed even slightly out
     of sync it silently overwrote the just-set visit back to null — the
     Examination section would then disappear right after Start Visit with
     no error shown. Scoped to patientId only, this fires once when landing
     on (or switching to) a patient, never after. completeVisit() below is
     the only other place that clears activeVisit, explicitly. */
  useEffect(() => {
    if (!patientId) {
      // oxlint-disable-next-line react/set-state-in-effect
      setActiveVisit(null);
      return;
    }
    let active = true;
    visitsSvc
      .openToday(patientId)
      .then((v) => active && setActiveVisit(v))
      .catch(() => active && setActiveVisit(null));
    return () => {
      active = false;
    };
  }, [patientId]);

  /* The appointment this screen was opened from, to prime the visit form
     and to let VisitForm complete it on save. */
  useEffect(() => {
    if (!urlAppointmentId) {
      // oxlint-disable-next-line react/set-state-in-effect
      setLinkedAppointment(null);
      return;
    }
    let active = true;
    appointmentsSvc
      .get(urlAppointmentId)
      .then((a) => active && setLinkedAppointment(a))
      .catch(() => active && setLinkedAppointment(null));
    return () => {
      active = false;
    };
  }, [urlAppointmentId]);

  /* ?action=visit opens the visit form automatically — but only once there
     is no visit already open, so it never re-opens on top of one just
     started. */
  useEffect(() => {
    if (urlAction === 'visit' && patientId && !activeVisit) {
      // oxlint-disable-next-line react/set-state-in-effect
      setShowVisitForm(true);
    }
  }, [urlAction, patientId, activeVisit]);

  function pickPatient(id: string) {
    setPatientId(id);
    setSearch('');
    setPatients([]);
  }

  function changePatient() {
    setPatientId('');
    setPatient(null);
    setActiveVisit(null);
    setShowVisitForm(false);
    setShowExamForm(false);
  }

  async function addDiagnosis() {
    if (dxSaving || !patient) return;
    const text = dxText.trim();
    if (!text) {
      toast.error('نص التشخيص مطلوب');
      return;
    }
    setDxSaving(true);
    try {
      await examinationsSvc.diagnoses.create({
        patient_id: patient.id,
        visit_id: activeVisit?.id ?? null,
        doctor_id: doctor?.id ?? null,
        diagnosis_text: text,
        eye: dxEye || null,
        is_primary: dxPrimary,
      });
      toast.success('تمت إضافة التشخيص');
      setDxText('');
      setDxEye('');
      setDxPrimary(false);
      setDiagnoses(await examinationsSvc.diagnoses.listByPatient(patient.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر حفظ التشخيص');
    } finally {
      setDxSaving(false);
    }
  }

  async function resolveDiagnosis(id: string) {
    if (!patient || dxWorking) return;
    setDxWorking(id);
    try {
      await examinationsSvc.diagnoses.setStatus(id, 'resolved');
      setDiagnoses(await examinationsSvc.diagnoses.listByPatient(patient.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تحديث حالة التشخيص');
    } finally {
      setDxWorking(null);
    }
  }

  async function removeDiagnosis(id: string) {
    if (!patient || dxWorking) return;
    if (!window.confirm('حذف هذا التشخيص؟')) return;
    setDxWorking(id);
    try {
      await examinationsSvc.diagnoses.remove(id);
      setDiagnoses(await examinationsSvc.diagnoses.listByPatient(patient.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر حذف التشخيص');
    } finally {
      setDxWorking(null);
    }
  }

  async function addFollowUp() {
    if (fuSaving || !patient) return;
    if (!M.isDate(fuDate)) {
      toast.error('اختر تاريخ متابعة صحيح');
      return;
    }
    setFuSaving(true);
    try {
      await examinationsSvc.followUps.create({
        patientId: patient.id,
        visitId: activeVisit?.id ?? null,
        doctorId: doctor?.id ?? null,
        dueDate: fuDate,
        reason: fuReason,
      });
      toast.success('تمت إضافة المتابعة');
      setFuDate('');
      setFuReason('');
      setFollowUps(await examinationsSvc.followUps.listByPatient(patient.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر حفظ المتابعة');
    } finally {
      setFuSaving(false);
    }
  }

  async function completeVisit() {
    if (!activeVisit || completing || !patient) return;
    if (!window.confirm('إنهاء هذه الزيارة؟ لن يمكن التعديل عليها بعد ذلك.')) return;
    setCompleting(true);
    try {
      await visitsSvc.complete(activeVisit.id);
      toast.success('تم إنهاء الزيارة');
      setActiveVisit(null);
      setVisits(await visitsSvc.listByPatient(patient.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر إنهاء الزيارة');
    } finally {
      setCompleting(false);
    }
  }

  const age = patient ? M.ageFrom(patient.date_of_birth) : null;
  const lastDiagnosis = diagnoses[0] ?? null;
  const lastPrescription = prescriptions[0] ?? null;
  const lastFollowUp = followUps[0] ?? null;

  const timeline: TimelineItem[] = [
    ...visits.map((v) => ({
      date: v.visit_date,
      kind: 'زيارة',
      label: (v.visit_type && M.VISIT_TYPE[v.visit_type]) || 'زيارة',
      detail: v.chief_complaint,
    })),
    ...exams.map((e) => ({ date: e.exam_date, kind: 'فحص', label: 'فحص عيون', detail: e.chief_complaint })),
    ...diagnoses.map((d) => ({
      date: d.diagnosed_on ?? '',
      kind: 'تشخيص',
      label: d.diagnosis_text,
      detail: d.eye ? EYE_AR[d.eye] : 'عام',
    })),
    ...prescriptions.map((p) => ({
      date: p.prescribed_on,
      kind: p.is_glasses ? 'وصفة نظارة' : 'وصفة دواء',
      label: p.is_glasses ? 'نظارة طبية' : 'أدوية',
      detail: p.notes,
    })),
    ...followUps.map((f) => ({
      date: f.due_date,
      kind: 'متابعة',
      label: f.reason ?? 'متابعة',
      detail: M.FU_STATUS[f.status ?? ''] ?? f.status,
    })),
  ]
    .filter((t) => t.date)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="stack">
      <Card title="اختيار المريض">
        <p className="muted" style={{ fontSize: 12 }}>
          الطبيب المعالج: <strong>{displayName}</strong>
        </p>
        {patientId && patient ? (
          <div className="row" style={{ alignItems: 'center', gap: 8 }}>
            <strong>{patient.full_name}</strong>
            <span className="muted" style={{ fontSize: 12 }}>
              {patient.patient_code ?? ''}
              {patient.phone ? ` — ${patient.phone}` : ''}
            </span>
            <Button variant="outline" onClick={changePatient}>
              تغيير المريض
            </Button>
          </div>
        ) : (
          <>
            <label className="field">
              <span className="field__label">بحث</span>
              <input
                type="text"
                value={search}
                placeholder="الاسم أو رقم الهاتف أو الكود"
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">المريض</span>
              <select value={patientId} onChange={(e) => pickPatient(e.target.value)}>
                <option value="">— اختر المريض —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                    {p.phone ? ` — ${p.phone}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {error ? <p className="alert">{error}</p> : null}
      </Card>

      {patientId && patient ? (
        <>
          {/* ── Patient Header ─────────────────────────────────────── */}
          <Card title="بيانات المريض">
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <Tag label={`الكود: ${patient.patient_code ?? '—'}`} />
              <Tag label={`الهاتف: ${patient.phone ?? '—'}`} />
              <Tag label={`النوع: ${patient.gender ? (M.GENDER[patient.gender] ?? patient.gender) : '—'}`} />
              <Tag label={`الميلاد: ${patient.date_of_birth ? M.fmtDay(patient.date_of_birth) : '—'}`} />
              {age != null ? <Tag label={`العمر: ${age}`} /> : null}
            </div>
          </Card>

          {/* ── Medical Summary ────────────────────────────────────── */}
          <Card title="ملخص طبي">
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <Tag label={`عدد الزيارات: ${visits.length}`} />
              <Tag
                label={`آخر زيارة: ${visits[0] ? M.fmtDay(visits[0].visit_date) : '—'}`}
              />
              <Tag label={`آخر تشخيص: ${lastDiagnosis ? lastDiagnosis.diagnosis_text : '—'}`} />
              <Tag
                label={`آخر وصفة: ${lastPrescription ? M.fmtDay(lastPrescription.prescribed_on) : '—'}`}
              />
              <Tag
                label={`آخر متابعة: ${lastFollowUp ? M.fmtDay(lastFollowUp.due_date) : '—'}`}
              />
            </div>
          </Card>

          {/* ── Today's Visit ──────────────────────────────────────── */}
          <Card title="الزيارة">
            {activeVisit ? (
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  زيارة مفتوحة — <MedValue>{M.fmtDay(activeVisit.visit_date)}</MedValue>
                  {activeVisit.visit_type ? ` — ${M.VISIT_TYPE[activeVisit.visit_type] ?? ''}` : ''}
                </span>
                <Button variant="outline" onClick={() => setShowVisitForm(true)}>
                  تعديل بيانات الزيارة
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowVisitForm(true)}>بدء الكشف</Button>
            )}
          </Card>

          {/* ── Visit History → Medical Report ─────────────────────── */}
          <Card title="سجل الزيارات">
            {visits.length ? (
              <div className="stack" style={{ gap: 6 }}>
                {visits.map((v) => (
                  <div
                    key={v.id}
                    className="row"
                    style={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>
                      <MedValue>{M.fmtDay(v.visit_date)}</MedValue>
                      {v.visit_type ? ` — ${M.VISIT_TYPE[v.visit_type] ?? ''}` : ''}
                      {!v.is_locked ? ' (مفتوحة)' : ''}
                    </span>
                    <span className="row" style={{ gap: 6 }}>
                      <Link to={`/doctor/payments?patientId=${patient.id}&visitId=${v.id}`}>
                        <Button variant="outline">تحصيل دفعة</Button>
                      </Link>
                      <Link to={`/doctor/patients/${patient.id}/report/${v.id}`}>
                        <Button variant="outline">التقرير الطبي</Button>
                      </Link>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">لا توجد زيارات مسجَّلة بعد</p>
            )}
          </Card>

          {showVisitForm ? (
            <VisitForm
              patient={patient}
              visit={activeVisit}
              appointment={linkedAppointment}
              doctorId={doctor?.id ?? null}
              clinicId={activeVisit?.clinic_id ?? patient.primary_clinic_id ?? null}
              onClose={() => setShowVisitForm(false)}
              onSaved={(v) => {
                setActiveVisit(v);
                setShowVisitForm(false);
                /* Starting a visit must land the doctor inside a usable
                   examination immediately — not a saved dialog with no
                   visible next step. This opens the SAME existing
                   ExaminationForm below, not a new one. */
                setShowExamForm(true);
                void loadClinicalRecord();
              }}
            />
          ) : null}

          {activeVisit ? (
            <>
              {/* ── Examination ─────────────────────────────────── */}
              <Card title="الفحص">
                <Button onClick={() => setShowExamForm(true)}>فحص جديد</Button>
              </Card>

              {showExamForm ? (
                <ExaminationForm
                  patient={patient}
                  visitId={activeVisit?.id ?? null}
                  doctorId={doctor?.id ?? null}
                  clinicId={activeVisit?.clinic_id ?? patient.primary_clinic_id ?? null}
                  onClose={() => setShowExamForm(false)}
                  onSaved={() => {
                    setShowExamForm(false);
                    void loadClinicalRecord();
                  }}
                />
              ) : null}

              {/* ── Diagnosis ───────────────────────────────────── */}
              <Card title={`التشخيص (${diagnoses.length})`}>
                {diagnoses.map((d) => (
                  <div className="rx-med" key={d.id}>
                    <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                      <strong>{d.diagnosis_text}</strong>
                      <Tag label={M.DX_STATUS[d.status ?? ''] ?? d.status ?? '—'} />
                    </div>
                    <p className="rx-med__sig">
                      {d.eye ? EYE_AR[d.eye] : 'عام'}
                      {d.is_primary ? ' — أساسي' : ''}
                      {d.diagnosed_on ? ' — ' + M.fmtDay(d.diagnosed_on) : ''}
                    </p>
                    {d.status !== 'resolved' ? (
                      <div className="row" style={{ gap: 8 }}>
                        <Button
                          variant="outline"
                          disabled={dxWorking === d.id}
                          onClick={() => void resolveDiagnosis(d.id)}
                        >
                          وضع كـ«شُفي»
                        </Button>
                        <Button
                          variant="outline"
                          disabled={dxWorking === d.id}
                          onClick={() => void removeDiagnosis(d.id)}
                        >
                          حذف
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}

                <div className="field">
                  <span className="field__label">إضافة تشخيص</span>
                  <input
                    type="text"
                    value={dxText}
                    placeholder="نص التشخيص"
                    onChange={(e) => setDxText(e.target.value)}
                  />
                </div>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <select value={dxEye} onChange={(e) => setDxEye(e.target.value)}>
                    <option value="">عام / كل الجسم</option>
                    {(['OD', 'OS', 'OU'] as Eye[]).map((eye) => (
                      <option key={eye} value={eye}>
                        {EYE_AR[eye]}
                      </option>
                    ))}
                  </select>
                  <label className="row" style={{ gap: 4, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={dxPrimary}
                      onChange={(e) => setDxPrimary(e.target.checked)}
                    />
                    <span>أساسي</span>
                  </label>
                  <Button disabled={dxSaving} onClick={() => void addDiagnosis()}>
                    {dxSaving ? 'جارٍ الحفظ…' : 'إضافة'}
                  </Button>
                </div>
              </Card>

              {/* ── Treatment / Prescription ────────────────────── */}
              <GlassesRxForm
                patientId={patient.id}
                visitId={activeVisit?.id ?? null}
                doctorId={doctor?.id ?? null}
                clinicId={activeVisit?.clinic_id ?? patient.primary_clinic_id ?? null}
                onSaved={() => void loadClinicalRecord()}
              />
              <MedicationRxForm
                patientId={patient.id}
                visitId={activeVisit?.id ?? null}
                doctorId={doctor?.id ?? null}
                clinicId={activeVisit?.clinic_id ?? patient.primary_clinic_id ?? null}
                onSaved={() => void loadClinicalRecord()}
              />

              {/* ── Follow-up ────────────────────────────────────── */}
              <Card title="المتابعة">
                <div className="grid-2">
                  <label className="field">
                    <span className="field__label">تاريخ المتابعة</span>
                    <input
                      type="date"
                      dir="ltr"
                      value={fuDate}
                      min={M.today()}
                      onChange={(e) => setFuDate(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">تعليمات المتابعة</span>
                    <input
                      type="text"
                      value={fuReason}
                      placeholder="سبب المتابعة"
                      onChange={(e) => setFuReason(e.target.value)}
                    />
                  </label>
                </div>
                <Button disabled={fuSaving} onClick={() => void addFollowUp()}>
                  {fuSaving ? 'جارٍ الحفظ…' : 'إضافة متابعة'}
                </Button>
              </Card>

              {/* ── Visit Summary ────────────────────────────────── */}
              <Card title="ملخص الزيارة">
                <p><MedText>المريض:</MedText> {patient.full_name}</p>
                <p><MedText>الطبيب:</MedText> {displayName}</p>
                <p><MedText>التاريخ:</MedText> <MedValue>{M.fmtDay(activeVisit.visit_date)}</MedValue></p>
                {activeVisit.chief_complaint ? (
                  <p><MedText>الشكوى الرئيسية:</MedText> {activeVisit.chief_complaint}</p>
                ) : null}
                <p><MedText>عدد الفحوصات المسجلة اليوم:</MedText> {exams.filter((e) => e.visit_id === activeVisit.id).length}</p>
                <p>
                  <MedText>التشخيصات:</MedText>{' '}
                  {diagnoses.filter((d) => d.visit_id === activeVisit.id).map((d) => d.diagnosis_text).join('، ') || '—'}
                </p>
                <p>
                  <MedText>الوصفات:</MedText>{' '}
                  {prescriptions.filter((p) => p.visit_id === activeVisit.id).length || '—'}
                </p>
                <p>
                  <MedText>المتابعة:</MedText>{' '}
                  {followUps.filter((f) => f.visit_id === activeVisit.id).map((f) => M.fmtDay(f.due_date)).join('، ') || '—'}
                </p>
                <Button disabled={completing} onClick={() => void completeVisit()}>
                  {completing ? 'جارٍ الإنهاء…' : 'إنهاء الزيارة'}
                </Button>
              </Card>
            </>
          ) : null}

          {/* ── Exam history ───────────────────────────────────────── */}
          <Card title={`سجل الفحوصات (${exams.length})`}>
            {!exams.length ? <EmptyState text="لا توجد فحوصات مسجلة." /> : null}
            {exams.map((e) => (
              <ExamCard key={e.id} exam={e} />
            ))}
            {exams.length >= 2 ? (
              <Button variant="outline" onClick={() => setShowComparison((v) => !v)}>
                {showComparison ? 'إخفاء مقارنة الفحوصات' : 'مقارنة الفحوصات'}
              </Button>
            ) : null}
          </Card>

          {showComparison && exams.length >= 2 ? (
            <Card title="مقارنة الفحوصات">
              <ComparisonView patientId={patient.id} />
            </Card>
          ) : null}

          {/* ── Timeline ───────────────────────────────────────────── */}
          <Card title="السجل الزمني">
            {!timeline.length ? <EmptyState text="لا يوجد سجل بعد." /> : null}
            {timeline.map((t, i) => (
              <div className="rx-med" key={i}>
                <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                  <Tag label={t.kind} />
                  <MedValue>{M.fmtDay(t.date)}</MedValue>
                </div>
                <p className="rx-med__sig">
                  {t.label}
                  {t.detail ? ` — ${t.detail}` : ''}
                </p>
              </div>
            ))}
          </Card>

          {/* ── Imaging (unchanged from the previous version) ───────── */}
          <ImagingOrderForm
            patientId={patient.id}
            visitId={activeVisit?.id ?? null}
            doctorId={doctor?.id ?? null}
            clinicId={activeVisit?.clinic_id ?? patient.primary_clinic_id ?? null}
            onCreated={() => void loadClinicalRecord()}
          />

          <ImagingUploadForm patientId={patient.id} onUploaded={() => void loadClinicalRecord()} />

          <Card title={`طلبات الأشعة (${orders.length})`}>
            {!orders.length ? <p className="muted">لا توجد طلبات.</p> : null}
            {orders.map((o) => (
              <div className="rx-med" key={o.id}>
                <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                  <strong><MedValue>{o.ordered_on}</MedValue></strong>
                  <Tag label={ORDER_STATUS_AR[o.status] ?? o.status} />
                </div>
                <p className="rx-med__sig">
                  {URGENCY_AR[o.urgency] ?? o.urgency}
                  {o.clinical_indication ? ` — ${o.clinical_indication}` : ''}
                </p>
                {(o.items ?? []).map((it) => (
                  <p className="rx-med__sig" key={it.id}>
                    <MedValue>{it.seq}.</MedValue> {modalityLabel(it.modality)} —{' '}
                    <MedValue>{it.eye}</MedValue> ({EYE_AR[it.eye as Eye]})
                  </p>
                ))}
                {o.visit_id ? (
                  <Link to={`/doctor/patients/${patient.id}/report/${o.visit_id}?document=investigation_request`}>
                    <Button variant="outline" style={{ marginBlockStart: 8 }}>طباعة طلب الأشعة</Button>
                  </Link>
                ) : null}
              </div>
            ))}
          </Card>

          <Card title={`الصور والفحوصات (${studies.length})`}>
            {!studies.length ? <p className="muted">لا توجد صور محفوظة.</p> : null}
            {studies.map((s) => (
              <div className="rx-med" key={s.id}>
                <div className="row" style={{ gap: 10 }}>
                  {thumbs[s.id] ? (
                    <img
                      src={thumbs[s.id]}
                      alt={modalityLabel(s.modality)}
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }}
                    />
                  ) : null}
                  <div>
                    <div className="rx-med__name">{modalityLabel(s.modality)}</div>
                    <p className="rx-med__sig">
                      <MedValue>{s.study_date ?? '—'}</MedValue>
                      {s.eye ? <> — <MedValue>{s.eye}</MedValue></> : null}
                    </p>
                    {s.file_name ? (
                      <p className="rx-med__sig"><MedText>{s.file_name}</MedText></p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </>
      ) : null}
    </div>
  );
}
