import { dirFor, RL, label, type ReportLang, type ReportRecipient } from '../../../i18n/report';
import type { ReportData } from '../../../types/report';
import { ReportHeader } from '../ReportHeader';
import { ReportFooter } from '../ReportFooter';
import { ClinicFooter } from '../ClinicFooter';
import { ImagingSection } from '../sections/ImagingSection';

export function ImagingReport({
  data,
  lang = 'ar',
  recipient,
}: {
  data: ReportData;
  lang?: ReportLang;
  recipient?: ReportRecipient;
}) {
  if (!data.studies.length) return null;
  return (
    <article className="medical-report print-imaging" dir={dirFor(lang)}>
      <ReportHeader
        data={data}
        lang={lang}
        recipient={recipient}
        docType="imaging_report"
        documentTitle={label(RL.imagingDocTitle, lang)}
      />
      <ImagingSection studies={data.studies} lang={lang} titleOverride={RL.imagingFindings} />
      <ReportFooter data={data} lang={lang} />
      <ClinicFooter data={data} lang={lang} />
    </article>
  );
}
