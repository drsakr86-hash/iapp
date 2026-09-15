/* -------------------------------------------------------------------------
 * PaymentReceipt — administrative document, NOT a medical report.
 * -------------------------------------------------------------------------
 * Contains only what the brief asks for: doctor identity, clinic, patient
 * name, service, amount, method, date, receipt number. No diagnosis, no
 * exam findings, no imaging, no medical history, no prescriptions — none
 * of that data is even loaded by the page that renders this.
 * ---------------------------------------------------------------------- */

import { REPORT_FALLBACK } from '../../config/reportConfig';
import type { PaymentRow } from '../../services/payments';
import type { ClinicRow } from '../../services/clinics';

const METHOD_AR: Record<string, string> = {
  cash: 'نقدي',
  card: 'بطاقة',
  transfer: 'تحويل بنكي',
  insurance: 'تأمين',
  other: 'أخرى',
};

export interface ReceiptData {
  payment: PaymentRow;
  patientName: string;
  serviceName: string | null;
  clinic: ClinicRow | null;
  doctor: { displayName: string; titleAr: string | null };
}

export function PaymentReceipt({ data }: { data: ReceiptData }) {
  const { payment, patientName, serviceName, clinic, doctor } = data;
  const date = (payment.paid_at ?? payment.created_at).slice(0, 10);

  return (
    <article className="medical-report print-receipt" style={{ maxWidth: '120mm' }}>
      <header className="medical-report__header">
        <div className="medical-report__identity">
          <div className="medical-report__doctor-name">
            {doctor.displayName || REPORT_FALLBACK.doctorNameAr}
          </div>
          <div className="medical-report__doctor-title">
            {doctor.titleAr ?? REPORT_FALLBACK.doctorTitleAr}
          </div>
          <div className="medical-report__doc-title">إيصال دفع — Payment Receipt</div>
        </div>
      </header>

      <section className="medical-report__section">
        <div className="medical-report__row">
          <span className="medical-report__row-label">رقم الإيصال</span>
          <span className="medical-report__row-value">{payment.receipt_no ?? '—'}</span>
        </div>
        <div className="medical-report__row">
          <span className="medical-report__row-label">التاريخ</span>
          <span className="medical-report__row-value">{date}</span>
        </div>
        <div className="medical-report__row">
          <span className="medical-report__row-label">المريض</span>
          <span className="medical-report__row-value">{patientName}</span>
        </div>
        {serviceName ? (
          <div className="medical-report__row">
            <span className="medical-report__row-label">الخدمة</span>
            <span className="medical-report__row-value">{serviceName}</span>
          </div>
        ) : null}
        <div className="medical-report__row">
          <span className="medical-report__row-label">المبلغ</span>
          <span className="medical-report__row-value">
            {payment.amount_paid.toFixed(2)} {payment.currency}
          </span>
        </div>
        <div className="medical-report__row">
          <span className="medical-report__row-label">طريقة الدفع</span>
          <span className="medical-report__row-value">
            {payment.method ? (METHOD_AR[payment.method] ?? payment.method) : '—'}
          </span>
        </div>
      </section>

      <footer className="medical-report__footer">
        <div className="medical-report__generated-at" />
        <div style={{ textAlign: 'end' }}>
          <div className="medical-report__signature-line" />
          <div className="medical-report__signature-name">
            {doctor.displayName || REPORT_FALLBACK.doctorNameAr}
          </div>
        </div>
      </footer>

      {clinic ? (
        <div className="medical-report__clinic-footer">
          <div className="medical-report__clinic-footer-name">{clinic.name_ar}</div>
          {clinic.address ? (
            <div className="medical-report__clinic-footer-address">{clinic.address}</div>
          ) : null}
          {clinic.phone || clinic.whatsapp ? (
            <div className="medical-report__clinic-footer-contact">
              {clinic.phone ? `تليفون: ${clinic.phone}` : ''}
              {clinic.phone && clinic.whatsapp ? ' · ' : ''}
              {clinic.whatsapp ? `واتساب: ${clinic.whatsapp}` : ''}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
