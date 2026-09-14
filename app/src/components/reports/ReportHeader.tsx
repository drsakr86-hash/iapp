import type { ReactNode } from 'react';
import { MedValue } from '../medical/Medical';
import * as M from '../../utils/models';
import { REPORT_FALLBACK } from '../../config/reportConfig';
import { RL, label, type ReportLang, type ReportRecipient } from '../../i18n/report';
import type { ReportData, ReportDocType } from '../../types/report';

/**
 * Minimum-necessary-information policy per document type. Only the
 * Complete Medical Report shows the full demographic/administrative
 * strip; every standalone document (prescriptions, investigation/imaging
 * requests, the examination report, follow-up — anything that may be
 * handed to an optical shop, a pharmacy, a lab, or photographed) shows
 * only patient name, patient code, visit date, and visit type. No date
 * of birth, gender, phone, or report-generation timestamp on those —
 * per the privacy brief. Nothing here removes data from storage — it
 * only controls what a given PRINTED document shows.
 */
function isMinimal(docType: ReportDocType | undefined): boolean {
  return docType !== undefined && docType !== 'complete';
}

export function ReportHeader({
  data,
  lang,
  recipient,
  docType,
  documentTitle,
}: {
  data: ReportData;
  lang: ReportLang;
  recipient?: ReportRecipient;
  /** Controls which patient/visit fields are shown — see isMinimal() above.
   *  Omitted (or 'complete') = the full strip. */
  docType?: ReportDocType;
  /** Set for a standalone single-document print (e.g. "Examination Report");
   *  omitted for the complete report, which needs no extra label. */
  documentTitle?: string;
}) {
  const { patient, visit, doctor } = data;
  const age = M.ageFrom(patient.date_of_birth);
  const minimal = isMinimal(docType);

  return (
    <header className="medical-report__header">
      <div className="medical-report__identity">
        {/* Doctor name + title are the ONLY identity shown at the top of
            every printable document. Clinic/location/contact information
            never appears here — see ClinicFooter, rendered at the end of
            the document instead. */}
        <div className="medical-report__doctor-name">
          {doctor.displayName || REPORT_FALLBACK.doctorNameAr}
        </div>
        <div className="medical-report__doctor-title">
          {doctor.titleAr ?? REPORT_FALLBACK.doctorTitleAr}
        </div>
        {documentTitle ? (
          <div className="medical-report__doc-title">{documentTitle}</div>
        ) : null}
      </div>

      <div className="medical-report__patient-strip">
        <Field label={label(RL.patientName, lang)} value={patient.full_name} />
        {minimal ? (
          <>
            <Field label={label(RL.patientCode, lang)} value={patient.patient_code ?? '—'} />
            <Field label={label(RL.visitDate, lang)} value={M.fmtDay(visit.visit_date)} />
            <Field
              label={label(RL.visitType, lang)}
              value={(visit.visit_type && M.VISIT_TYPE[visit.visit_type]) || '—'}
            />
          </>
        ) : (
          <>
            <Field label={label(RL.patientCode, lang)} value={patient.patient_code ?? '—'} />
            <Field
              label={label(RL.dob, lang)}
              value={
                patient.date_of_birth
                  ? `${M.fmtDay(patient.date_of_birth)}${age != null ? ` (${age})` : ''}`
                  : '—'
              }
            />
            <Field label={label(RL.visitDate, lang)} value={M.fmtDay(visit.visit_date)} />
            <Field
              label={label(RL.visitType, lang)}
              value={(visit.visit_type && M.VISIT_TYPE[visit.visit_type]) || '—'}
            />
            <Field
              label={label(RL.gender, lang)}
              value={patient.gender ? (M.GENDER[patient.gender] ?? patient.gender) : '—'}
            />
            <Field label={label(RL.phone, lang)} value={<MedValue>{patient.phone ?? '—'}</MedValue>} />
            <Field label={label(RL.reportDate, lang)} value={M.fmtDay(data.generatedAt.slice(0, 10))} />
            {recipient ? (
              <Field
                label={label(RL.recipient, lang)}
                value={label(recipient === 'patient' ? RL.patientRecipient : RL.physicianRecipient, lang)}
              />
            ) : null}
          </>
        )}
      </div>
    </header>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <span className="medical-report__field-label">{label}</span>
      <span className="medical-report__field-value">{value}</span>
    </div>
  );
}
