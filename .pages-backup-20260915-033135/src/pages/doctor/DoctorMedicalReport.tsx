/* -------------------------------------------------------------------------
 * DoctorMedicalReport — Visit → Documents & Printing → Preview → Print/PDF.
 * -------------------------------------------------------------------------
 * Loads strictly by (patientId, visitId) from the route, never by "most
 * recent visit". Every read below goes through the existing service layer;
 * nothing here writes to the database. "Print / Save PDF" is the browser's
 * native print dialog — see report.css for the @media print rules.
 *
 * PRINT FIX — window.print() used to run inside a setTimeout queued from a
 * `printPending` effect. That moves the call OUTSIDE the synchronous call
 * stack of the click handler, and window.print() is gated on the page
 * having live "user activation" from that exact gesture; once deferred
 * even by a few milliseconds, several browsers (Safari reliably, Chrome
 * inconsistently) silently drop the dialog — no error, nothing happens.
 * That was the entire bug. The fix below uses flushSync to commit the
 * selected document to the DOM synchronously and then calls window.print()
 * immediately after, still inside the original click handler — the call
 * never leaves the user gesture.
 *
 * INDIVIDUAL PRINTING — only one document is ever mounted in the preview
 * at a time (see `docType`), so print isolation needs no extra CSS scoping
 * beyond what report.css already does: whichever single
 * <article class="medical-report …"> is in the DOM is what prints.
 * Switching documents never touches clinical data — this screen is
 * read-only from end to end.
 *
 * CLINIC RESOLUTION — clinics.get(visit.clinic_id) is used instead of the
 * active-only clinics.list(), so a report for a visit at a since-
 * deactivated location still shows that location's real address/contact
 * info rather than silently dropping it.
 * ---------------------------------------------------------------------- */

import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import '../../components/reports/report.css';
import { availableDocuments, documentComponentFor } from '../../components/reports/documents/registry';
import { useDoctor } from '../../hooks/useDoctor';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import * as patientsSvc from '../../services/patients';
import * as visitsSvc from '../../services/visits';
import * as examinationsSvc from '../../services/examinations';
import * as prescriptionsSvc from '../../services/prescriptions';
import * as imagingSvc from '../../services/imaging';
import * as clinicsSvc from '../../services/clinics';
import * as doctorsSvc from '../../services/doctors';
import { REPORT_FALLBACK } from '../../config/reportConfig';
import { RL, label, type ReportLang, type ReportRecipient } from '../../i18n/report';
import type {
  DrugsReportItem,
  GlassesReportItem,
  ReportData,
  ReportDocType,
} from '../../types/report';

export default function DoctorMedicalReport() {
  useDocumentTitle('التقرير الطبي');
  const { doctor: signedInDoctor } = useDoctor();
  const params = useParams<{ patientId: string; visitId: string }>();
  const [searchParams] = useSearchParams();
  const patientId = params.patientId ?? '';
  const visitId = params.visitId ?? '';

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialDoc = searchParams.get('document') as ReportDocType | null;
  const [docType, setDocType] = useState<ReportDocType>(
    initialDoc && ['complete','examination','glasses','medication','investigation_request','imaging_report','followup'].includes(initialDoc) ? initialDoc : 'complete',
  );
  const [lang, setLang] = useState<ReportLang>('ar');
  const [recipient, setRecipient] = useState<ReportRecipient>('patient');

  const load = useCallback(async () => {
    if (!patientId || !visitId) {
      setError('رابط التقرير غير صالح');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [patient, visit] = await Promise.all([
        patientsSvc.getClinical(patientId),
        visitsSvc.get(visitId),
      ]);
      if (!patient) throw new Error('تعذّر العثور على المريض');
      if (!visit) throw new Error('تعذّر العثور على الزيارة');
      if (visit.patient_id !== patientId) throw new Error('عدم تطابق: الزيارة لا تخص هذا المريض');

      const [exams, diagnosesAll, followUpsAll, prescriptionsAll, studiesAll, ordersAll, doctors] =
        await Promise.all([
          examinationsSvc.listByPatient(patientId),
          examinationsSvc.diagnoses.listByPatient(patientId),
          examinationsSvc.followUps.listByPatient(patientId),
          prescriptionsSvc.listByPatient(patientId),
          imagingSvc.listByPatient(patientId),
          imagingSvc.ordersByPatient(patientId),
          doctorsSvc.list().catch(() => []),
        ]);

      /* One exam per visit is the normal case; if more than one somehow
         exists, listByPatient is already sorted exam_date desc, so the
         first match is the most recent — never "any" exam, and never one
         from a different visit. */
      const examForVisit = exams.find((e) => e.visit_id === visitId) ?? null;
      const examination = examForVisit ? await examinationsSvc.getFull(examForVisit.id) : null;

      const diagnoses = diagnosesAll.filter((d) => d.visit_id === visitId);
      const followUps = followUpsAll.filter((f) => f.visit_id === visitId);
      const prescriptionsForVisit = prescriptionsAll.filter((p) => p.visit_id === visitId);
      const studiesForVisit = studiesAll.filter((s) => s.visit_id === visitId);
      const imagingOrders = ordersAll.filter((o) => o.visit_id === visitId);

      const glassesRx = prescriptionsForVisit.filter((p) => p.is_glasses);
      const drugRx = prescriptionsForVisit.filter((p) => !p.is_glasses);

      const glasses: GlassesReportItem[] = await Promise.all(
        glassesRx.map(async (prescription) => {
          const { OD, OS } = await prescriptionsSvc.refractionsFor(prescription.id);
          return { prescription, od: OD, os: OS };
        }),
      );

      const catalogue = drugRx.length ? await prescriptionsSvc.medications() : [];
      const byId = new Map(catalogue.map((m) => [m.id, m.name]));
      const drugs: DrugsReportItem[] = await Promise.all(
        drugRx.map(async (prescription) => {
          const rawItems = await prescriptionsSvc.itemsFor(prescription.id);
          return {
            prescription,
            items: rawItems.map((it) => ({
              ...it,
              displayName: it.free_text || byId.get(it.medication_id ?? '') || '—',
            })),
          };
        }),
      );

      const thumbs = studiesForVisit.length ? await imagingSvc.thumbUrls(studiesForVisit) : {};
      const studies = studiesForVisit.map((s) => ({ ...s, thumbUrl: thumbs[s.id] ?? null }));

      // clinics.get() bypasses the is_active filter — a deactivated
      // location must not make historical reports lose their address.
      const clinic = visit.clinic_id ? await clinicsSvc.get(visit.clinic_id).catch(() => null) : null;

      const visitDoctorId = visit.doctor_id ?? examination?.doctor_id ?? null;
      const matchedDoctor = visitDoctorId
        ? (doctors.find((d) => d.id === visitDoctorId) ?? null)
        : null;
      // Deliberately NOT doctorsSvc.displayName() here: that function
      // bundles title + name into one string for single-line contexts
      // (topbar, lists). ReportHeader renders name and title as two
      // SEPARATE lines (see medical-report__doctor-name /
      // medical-report__doctor-title) — feeding it the bundled string
      // would print the title twice, once merged into the name line and
      // once again on its own line below.
      const doctor = matchedDoctor
        ? { displayName: matchedDoctor.full_name_ar || REPORT_FALLBACK.doctorNameAr, titleAr: matchedDoctor.title_ar }
        : {
            displayName: signedInDoctor?.full_name_ar || REPORT_FALLBACK.doctorNameAr,
            titleAr: signedInDoctor?.title_ar ?? null,
          };

      setData({
        patient,
        visit,
        clinic,
        doctor,
        examination,
        diagnoses,
        followUps,
        glasses,
        drugs,
        studies,
        imagingOrders,
        generatedAt: new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل التقرير');
    } finally {
      setLoading(false);
    }
  }, [patientId, visitId, signedInDoctor]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  /* Belt-and-suspenders print isolation: report.css already hides
     .topbar/.bottomnav/.no-print under @media print, but that relies on
     print-time CSS cascade alone. Toggling a `printing` class on <body>
     around the actual browser print event (beforeprint/afterprint) is a
     second, independent mechanism — driven by real browser state rather
     than a stylesheet assumption — so application navigation (e.g. the
     "ملفي" tab) can never leak into a printed document even if a future
     stylesheet change altered print-media specificity. See report.css for
     the matching `body.printing` rules. */
  useEffect(() => {
    const addClass = () => document.body.classList.add('printing');
    const removeClass = () => document.body.classList.remove('printing');
    window.addEventListener('beforeprint', addClass);
    window.addEventListener('afterprint', removeClass);
    return () => {
      window.removeEventListener('beforeprint', addClass);
      window.removeEventListener('afterprint', removeClass);
      removeClass();
    };
  }, []);

  function preview(type: ReportDocType) {
    setDocType(type);
  }

  /* Switches to `type` and prints it, entirely synchronously: flushSync
     commits the DOM change before window.print() runs, and both stay
     inside this click handler's user-activation window. Never defer
     window.print() with a timer/promise — see the file header. The
     `printing` class is also set explicitly here (not only via the
     beforeprint listener above) so isolation never depends on event
     ordering. */
  function printDoc(type: ReportDocType) {
    flushSync(() => setDocType(type));
    document.body.classList.add('printing');
    window.print();
  }

  function chooseRecipient(next: ReportRecipient) {
    setRecipient(next);
    // Suggested default only — the doctor can still change the language
    // independently afterwards, per spec.
    setLang(next === 'patient' ? 'ar' : 'en');
  }

  const docs = data ? availableDocuments(data) : [];
  const DocComponent = documentComponentFor(docType);

  return (
    <div>
      <div className="report-preview__bar no-print">
        <Link to={`/doctor/patients/${patientId}`}>
          <Button variant="outline">إغلاق</Button>
        </Link>
        <span className="report-preview__bar-spacer" />
        <Button disabled={!data} onClick={() => printDoc(docType)}>
          طباعة / حفظ PDF
        </Button>
      </div>

      {loading ? <Spinner label="جارٍ تحميل التقرير…" /> : null}
      {!loading && error ? <EmptyState icon="⚠️" text={error} /> : null}

      {!loading && !error && data ? (
        <>
          <div className="no-print" style={{ maxWidth: '210mm', margin: '0 auto 12px' }}>
            <Card title="المستندات والطباعة — Documents & Printing">
              <div className="row" style={{ flexWrap: 'wrap', gap: 16, marginBlockEnd: 10 }}>
                <label className="field" style={{ minWidth: 200 }}>
                  <span className="field__label">{label(RL.reportLanguage, lang)}</span>
                  <select value={lang} onChange={(e) => setLang(e.target.value as ReportLang)}>
                    <option value="ar">{label(RL.arabic, 'ar')}</option>
                    <option value="en">{label(RL.english, 'ar')}</option>
                    <option value="bilingual">{label(RL.bilingualOpt, 'ar')}</option>
                  </select>
                </label>
                <label className="field" style={{ minWidth: 220 }}>
                  <span className="field__label">{label(RL.recipient, lang)}</span>
                  <select
                    value={recipient}
                    onChange={(e) => chooseRecipient(e.target.value as ReportRecipient)}
                  >
                    <option value="patient">{label(RL.patientRecipient, 'ar')}</option>
                    <option value="physician">{label(RL.physicianRecipient, 'ar')}</option>
                  </select>
                </label>
              </div>

              <div className="stack" style={{ gap: 6 }}>
                {docs.map((doc) => (
                  <div
                    key={doc.type}
                    className="row"
                    style={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>
                      {doc.icon} {doc.label}
                    </span>
                    <span className="row" style={{ gap: 6 }}>
                      <Button
                        variant={docType === doc.type ? 'primary' : 'outline'}
                        onClick={() => preview(doc.type)}
                      >
                        معاينة
                      </Button>
                      <Button variant="outline" onClick={() => printDoc(doc.type)}>
                        طباعة
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div id="print-document-root" className="report-preview__sheet-wrap">
            <DocComponent data={data} lang={lang} recipient={recipient} />
          </div>
        </>
      ) : null}
    </div>
  );
}
