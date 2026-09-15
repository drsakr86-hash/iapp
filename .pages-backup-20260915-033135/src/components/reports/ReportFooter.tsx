import { REPORT_FALLBACK } from '../../config/reportConfig';
import { RL, label, type ReportLang } from '../../i18n/report';
import type { ReportData } from '../../types/report';

export function ReportFooter({ data, lang }: { data: ReportData; lang: ReportLang }) {
  return (
    <footer className="medical-report__footer">
      <div className="medical-report__generated-at">
        {label(RL.generatedNote, lang)} — {data.generatedAt.slice(0, 10)}
      </div>
      <div style={{ textAlign: 'end' }}>
        <div className="medical-report__signature-line" />
        <div className="medical-report__signature-name">
          {data.doctor.displayName || REPORT_FALLBACK.doctorNameAr}
        </div>
        <div className="medical-report__signature-title">
          {data.doctor.titleAr ?? REPORT_FALLBACK.doctorTitleAr}
        </div>
      </div>
    </footer>
  );
}
