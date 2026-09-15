import { dirFor, RL, label, type ReportLang, type ReportRecipient } from '../../../i18n/report';
import type { ReportData } from '../../../types/report';
import { ReportHeader } from '../ReportHeader';
import { ReportFooter } from '../ReportFooter';
import { ClinicFooter } from '../ClinicFooter';
import { InvestigationRequestSection } from '../sections/InvestigationRequestSection';

export function InvestigationRequestReport({
  data,
  lang = 'ar',
  recipient,
}: {
  data: ReportData;
  lang?: ReportLang;
  recipient?: ReportRecipient;
}) {
  if (!data.imagingOrders.length) return null;
  return (
    <article className="medical-report print-investigation" dir={dirFor(lang)}>
      <ReportHeader
        data={data}
        lang={lang}
        recipient={recipient}
        docType="investigation_request"
        documentTitle={label(RL.investigationDocTitle, lang)}
      />
      <InvestigationRequestSection orders={data.imagingOrders} lang={lang} />
      <ReportFooter data={data} lang={lang} />
      <ClinicFooter data={data} lang={lang} />
    </article>
  );
}
