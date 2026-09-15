import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import * as reportsSvc from '../../services/accounting/reports';
import * as ledgerSvc from '../../services/accounting/ledger';
import * as accountsSvc from '../../services/accounting/accounts';
import * as clinicsSvc from '../../services/clinics';
import * as M from '../../utils/models';
import { transactionTypeAr } from '../../services/accounting/labels';
import type {
  ClinicFinancialSummaryRow,
  PaymentMethodSummaryRow,
  ServiceRevenueSummaryRow,
} from '../../types/accounting.types';

type Tab = 'ledger' | 'clinic' | 'service' | 'method';

export default function AccountingReports() {
  useDocumentTitle('التقارير المالية');
  const [tab, setTab] = useState<Tab>('ledger');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clinics, setClinics] = useState<clinicsSvc.ClinicRow[]>([]);
  const [accountNames, setAccountNames] = useState<Record<string, string>>({});
  const [clinicId, setClinicId] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [dateTo, setDateTo] = useState(M.today());

  const [ledger, setLedger] = useState<Awaited<ReturnType<typeof ledgerSvc.listTransactions>>>([]);
  const [clinicSummary, setClinicSummary] = useState<ClinicFinancialSummaryRow[]>([]);
  const [serviceSummary, setServiceSummary] = useState<ServiceRevenueSummaryRow[]>([]);
  const [methodSummary, setMethodSummary] = useState<PaymentMethodSummaryRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, l, cs, ss, ms, accts] = await Promise.all([
        clinicsSvc.list(),
        ledgerSvc.listTransactions({ clinicId: clinicId || null, dateFrom, dateTo }),
        reportsSvc.clinicSummary(),
        reportsSvc.serviceRevenueSummary(),
        reportsSvc.paymentMethodSummary(),
        accountsSvc.listAll(),
      ]);
      setClinics(c);
      setLedger(l);
      setClinicSummary(cs);
      setServiceSummary(ss);
      setMethodSummary(ms);
      setAccountNames(Object.fromEntries(accts.map((a) => [a.id, a.name_ar])));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل التقارير');
    } finally {
      setLoading(false);
    }
  }, [clinicId, dateFrom, dateTo]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  return (
    <div className="stack">
      <Card title="التقارير المالية">
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginBlockEnd: 10 }}>
          <Button variant={tab === 'ledger' ? 'primary' : 'outline'} onClick={() => setTab('ledger')}>
            دفتر الحركات
          </Button>
          <Button variant={tab === 'clinic' ? 'primary' : 'outline'} onClick={() => setTab('clinic')}>
            حسب العيادة
          </Button>
          <Button variant={tab === 'service' ? 'primary' : 'outline'} onClick={() => setTab('service')}>
            حسب الخدمة
          </Button>
          <Button variant={tab === 'method' ? 'primary' : 'outline'} onClick={() => setTab('method')}>
            حسب طريقة الدفع
          </Button>
        </div>
        {tab === 'ledger' ? (
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            <label className="field">
              <span className="field__label">العيادة</span>
              <select value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
                <option value="">كل العيادات</option>
                {clinics.map((c) => (<option key={c.id} value={c.id}>{c.name_ar}</option>))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">من</span>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
            <label className="field">
              <span className="field__label">إلى</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
          </div>
        ) : null}
      </Card>

      {loading ? <Spinner label="جارٍ التحميل…" /> : null}
      {!loading && error ? <EmptyState icon="⚠️" text={error} /> : null}

      {!loading && !error && tab === 'ledger' ? (
        <Card title="دفتر الحركات المالية">
          {ledger.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="medical-report__table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>الحساب</th><th>الوصف</th><th>الإيصال</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((t) => (
                    <tr key={t.id}>
                      <td>{M.fmtDay(t.transaction_date)}</td>
                      <td>{transactionTypeAr(t.transaction_type)}</td>
                      <td>{t.amount.toFixed(2)}</td>
                      <td>{accountNames[t.account_id] ?? 'حساب غير معروف'}</td>
                      <td>{t.description ?? t.reason ?? '—'}</td>
                      <td>{t.receipt_no ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="📒" text="لا توجد حركات في هذه الفترة" />
          )}
        </Card>
      ) : null}

      {!loading && !error && tab === 'clinic' ? (
        <Card title="ملخص حسب العيادة">
          {clinicSummary.length ? (
            <table className="medical-report__table" style={{ width: '100%' }}>
              <thead><tr><th>العيادة</th><th>الإيرادات</th><th>المصروفات</th><th>المرتجعات</th></tr></thead>
              <tbody>
                {clinicSummary.map((r) => (
                  <tr key={r.clinic_id}>
                    <td>{r.name_ar}</td>
                    <td>{(r.revenue ?? 0).toFixed(2)}</td>
                    <td>{(r.expenses ?? 0).toFixed(2)}</td>
                    <td>{(r.refunds ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon="🏥" text="لا توجد بيانات بعد" />
          )}
        </Card>
      ) : null}

      {!loading && !error && tab === 'service' ? (
        <Card title="الإيراد حسب الخدمة">
          {serviceSummary.length ? (
            <table className="medical-report__table" style={{ width: '100%' }}>
              <thead><tr><th>الخدمة</th><th>الإجمالي</th><th>عدد العمليات</th></tr></thead>
              <tbody>
                {serviceSummary.map((r) => (
                  <tr key={r.service_id}>
                    <td>{r.name_ar}</td>
                    <td>{r.total_revenue.toFixed(2)}</td>
                    <td>{r.transaction_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon="🩺" text="لا توجد بيانات بعد" />
          )}
        </Card>
      ) : null}

      {!loading && !error && tab === 'method' ? (
        <Card title="الإيراد حسب طريقة الدفع">
          {methodSummary.length ? (
            <table className="medical-report__table" style={{ width: '100%' }}>
              <thead><tr><th>طريقة الدفع</th><th>الإجمالي</th><th>عدد العمليات</th></tr></thead>
              <tbody>
                {methodSummary.map((r) => (
                  <tr key={r.payment_method_id}>
                    <td>{r.name_ar}</td>
                    <td>{r.total_revenue.toFixed(2)}</td>
                    <td>{r.transaction_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon="💳" text="لا توجد بيانات بعد" />
          )}
        </Card>
      ) : null}
    </div>
  );
}
