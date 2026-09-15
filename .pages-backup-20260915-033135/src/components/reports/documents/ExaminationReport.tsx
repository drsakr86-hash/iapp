import { dirFor, RL, label, type ReportLang, type ReportRecipient } from '../../../i18n/report';
import type { ReportData } from '../../../types/report';
import { ReportHeader } from '../ReportHeader';
import { ReportFooter } from '../ReportFooter';
import { ClinicFooter } from '../ClinicFooter';
import { ExaminationSection } from '../sections/ExaminationSection';

export function ExaminationReport({
  data,
  lang = 'ar',
  recipient,
}: {
  data: ReportData;
  lang?: ReportLang;
  recipient?: ReportRecipient;
}) {
  if (!data.examination) return null;
  return (
    <article className="medical-report print-examination" dir={dirFor(lang)}>
      <ReportHeader
        data={data}
        lang={lang}
        recipient={recipient}
        docType="examination"
        documentTitle={label(RL.examinationDocTitle, lang)}
      />
      <ExaminationSection
        exam={data.examination}
        chiefComplaint={data.examination.chief_complaint || data.visit.chief_complaint}
        lang={lang}
      />
      <ReportFooter data={data} lang={lang} />
      <ClinicFooter data={data} lang={lang} />
    </article>
  );
}
