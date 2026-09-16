import { dirFor, RL, label, type ReportLang, type ReportRecipient } from '../../../i18n/report';
import type { ReportData } from '../../../types/report';
import { ReportHeader } from '../ReportHeader';
import { ReportFooter } from '../ReportFooter';
import { ClinicFooter } from '../ClinicFooter';
import { DrugsSection } from '../sections/DrugsSection';

export function MedicationPrescriptionReport({
  data,
  lang = 'ar',
  recipient,
}: {
  data: ReportData;
  lang?: ReportLang;
  recipient?: ReportRecipient;
}) {
  if (!data.drugs.length) return null;
  return (
    <article className="medical-report print-medication" dir={dirFor(lang)}>
      <ReportHeader
        data={data}
        lang={lang}
        recipient={recipient}
        docType="medication"
        documentTitle={label(RL.medicationDocTitle, lang)}
      />
      <DrugsSection items={data.drugs} lang={lang} />
      <ReportFooter data={data} lang={lang} />
      <ClinicFooter data={data} lang={lang} />
    </article>
  );
}
