/* -------------------------------------------------------------------------
 * MedicalReport — the complete printable ophthalmology report.
 * -------------------------------------------------------------------------
 * Pure presentation over data the page already assembled from the existing
 * services (examinations, diagnoses, prescriptions, imaging, follow-ups).
 * No Supabase calls happen in this file.
 *
 * A thin composition of the same section components the standalone
 * single-document reports use (see ./sections and ./documents) — nothing
 * about a section's content is duplicated between the complete report and
 * an individual printout.
 *
 * `lang` only ever translates STRUCTURAL labels (headings, table columns,
 * field names — see i18n/report.ts). Doctor-entered free text (chief
 * complaint, diagnosis text, treatment plan, notes) is always shown
 * exactly as recorded, in whichever language the doctor wrote it.
 * ---------------------------------------------------------------------- */

import * as M from '../../utils/models';
import { RL, diagnosisLabel, eyeLabel, label, dirFor, type ReportLang, type ReportRecipient } from '../../i18n/report';
import { MedValue } from '../medical/Medical';
import type { ReportData } from '../../types/report';
import { ReportHeader } from './ReportHeader';
import { ReportFooter } from './ReportFooter';
import { ClinicFooter } from './ClinicFooter';
import { Section } from './sections/shared';
import { ExaminationSection, examinationHasContent } from './sections/ExaminationSection';
import { GlassesSection } from './sections/GlassesSection';
import { DrugsSection } from './sections/DrugsSection';
import { ImagingSection } from './sections/ImagingSection';
import { FollowUpSection } from './sections/FollowUpSection';

function listSep(lang: ReportLang): string {
  return lang === 'en' ? ', ' : '، ';
}

export function MedicalReport({
  data,
  lang = 'ar',
  recipient,
}: {
  data: ReportData;
  lang?: ReportLang;
  recipient?: ReportRecipient;
}) {
  const { visit, examination, diagnoses, followUps, glasses, drugs, studies } = data;
  const hasExam = examinationHasContent(examination);

  return (
    <article className="medical-report medical-report--complete" dir={dirFor(lang)}>
      <ReportHeader data={data} lang={lang} recipient={recipient} />

      {hasExam ? (
        <ExaminationSection
          exam={examination}
          chiefComplaint={examination?.chief_complaint || visit.chief_complaint}
          lang={lang}
        />
      ) : visit.chief_complaint ? (
        <Section title={label(RL.chiefComplaint, lang)}>
          <p>{visit.chief_complaint}</p>
        </Section>
      ) : null}

      {diagnoses.length ? (
        <Section title={label(RL.diagnosis, lang)}>
          <table className="medical-report__table">
            <thead>
              <tr>
                <th>{label(RL.diagnosis, lang)}</th>
                <th>{label(RL.eye, lang)}</th>
                <th>{label(RL.status, lang)}</th>
                <th>{label(RL.date, lang)}</th>
              </tr>
            </thead>
            <tbody>
              {diagnoses.map((d) => (
                <tr key={d.id}>
                  <td>
                    {diagnosisLabel(d.diagnosis_text, lang)}
                    {d.is_primary ? ` (${label(RL.primary, lang)})` : ''}
                  </td>
                  <td>{d.eye ? eyeLabel(d.eye, lang) : '—'}</td>
                  <td>{d.status ? (M.DX_STATUS[d.status] ?? d.status) : '—'}</td>
                  <td>
                    <MedValue>{d.diagnosed_on ? M.fmtDay(d.diagnosed_on) : '—'}</MedValue>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      ) : null}

      {examination?.treatment_plan ? (
        <Section title={label(RL.treatmentPlan, lang)}>
          <p>{examination.treatment_plan}</p>
        </Section>
      ) : null}

      <GlassesSection items={glasses} lang={lang} />
      <DrugsSection items={drugs} lang={lang} />
      <ImagingSection studies={studies} lang={lang} />
      <FollowUpSection followUps={followUps} lang={lang} />

      {diagnoses.length || examination?.treatment_plan ? (
        <Section title={label(RL.impression, lang)}>
          <p>
            {diagnoses
              .filter((d) => d.is_primary)
              .map((d) => diagnosisLabel(d.diagnosis_text, lang))
              .join(listSep(lang)) ||
              diagnoses.map((d) => diagnosisLabel(d.diagnosis_text, lang)).join(listSep(lang)) ||
              examination?.treatment_plan ||
              '—'}
          </p>
        </Section>
      ) : null}

      <ReportFooter data={data} lang={lang} />
      <ClinicFooter data={data} lang={lang} />
    </article>
  );
}
