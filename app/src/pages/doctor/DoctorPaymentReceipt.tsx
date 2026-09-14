/* -------------------------------------------------------------------------
 * DoctorPaymentReceipt — loads one payment by id and renders/prints its
 * receipt. Read-only: nothing here writes anything.
 * ---------------------------------------------------------------------- */

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, EmptyState, Spinner } from '../../components/ui';
import '../../components/reports/report.css';
import { PaymentReceipt, type ReceiptData } from '../../components/receipts/PaymentReceipt';
import { useDoctor } from '../../hooks/useDoctor';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import * as paymentsSvc from '../../services/payments';
import * as patientsSvc from '../../services/patients';
import * as catalogSvc from '../../services/catalog';
import * as clinicsSvc from '../../services/clinics';
import { REPORT_FALLBACK } from '../../config/reportConfig';

export default function DoctorPaymentReceipt() {
  useDocumentTitle('إيصال الدفع');
  const { doctor: signedInDoctor, displayName: signedInDisplayName } = useDoctor();
  const params = useParams<{ paymentId: string }>();
  const paymentId = params.paymentId ?? '';

  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!paymentId) {
      setError('رابط الإيصال غير صالح');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payment = await paymentsSvc.get(paymentId);
      if (!payment) throw new Error('تعذّر العثور على الدفعة');

      const [patient, service, clinic] = await Promise.all([
        patientsSvc.get(payment.patient_id),
        payment.service_id ? catalogSvc.get(payment.service_id) : Promise.resolve(null),
        payment.clinic_id ? clinicsSvc.get(payment.clinic_id) : Promise.resolve(null),
      ]);

      setData({
        payment,
        patientName: patient?.full_name ?? '—',
        serviceName: service?.name_ar ?? null,
        clinic,
        doctor: {
          displayName: signedInDisplayName || REPORT_FALLBACK.doctorNameAr,
          titleAr: signedInDoctor?.title_ar ?? null,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل الإيصال');
    } finally {
      setLoading(false);
    }
  }, [paymentId, signedInDoctor, signedInDisplayName]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

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

  function printNow() {
    document.body.classList.add('printing');
    window.print();
  }

  return (
    <div>
      <div className="report-preview__bar no-print">
        <Link to="/doctor/payments">
          <Button variant="outline">إغلاق</Button>
        </Link>
        <span className="report-preview__bar-spacer" />
        <Button disabled={!data} onClick={printNow}>
          طباعة / حفظ PDF
        </Button>
      </div>

      {loading ? <Spinner label="جارٍ التحميل…" /> : null}
      {!loading && error ? <EmptyState icon="⚠️" text={error} /> : null}

      {!loading && !error && data ? (
        <div id="print-document-root" className="report-preview__sheet-wrap">
          <PaymentReceipt data={data} />
        </div>
      ) : null}
    </div>
  );
}
