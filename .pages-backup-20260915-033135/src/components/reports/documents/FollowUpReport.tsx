import { dirFor, RL, label, type ReportLang, type ReportRecipient } from '../../../i18n/report';
import type { ReportData } from '../../../types/report';
import { ReportHeader } from '../ReportHeader';
import { ReportFooter } from '../ReportFooter';
import { ClinicFooter } from '../ClinicFooter';
import { FollowUpSection } from '../sections/FollowUpSection';

export function FollowUpReport({
  data,
  lang = 'ar',
  recipient,
}: {
  data: ReportData;
  lang?: ReportLang;
  recipient?: ReportRecipient;
}) {
  if (!data.followUps.length) return null;
  return (
    <article className="medical-report print-followup" dir={dirFor(lang)}>
      <ReportHeader
        data={data}
        lang={lang}
        recipient={recipient}
        docType="followup"
        documentTitle={label(RL.followupDocTitle, lang)}
      />
      <FollowUpSection followUps={data.followUps} lang={lang} />
      <ReportFooter data={data} lang={lang} />
      <ClinicFooter data={data} lang={lang} />
    </article>
  );
}
