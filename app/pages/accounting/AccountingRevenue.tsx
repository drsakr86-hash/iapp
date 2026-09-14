import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import * as accountsSvc from '../../services/accounting/accounts';
import * as paymentMethodsSvc from '../../services/accounting/paymentMethods';
import * as ledgerSvc from '../../services/accounting/ledger';
import * as clinicsSvc from '../../services/clinics';
import * as catalogSvc from '../../services/catalog';
import * as patientsSvc from '../../services/patients';
import * as M from '../../utils/models';
import type { AccountRow } from '../../services/accounting/accounts';
import type { PaymentMethodRow } from '../../types/accounting.types';

export default function AccountingRevenue() {
  useDocumentTitle('تحصيل الإيرادات');
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const prefPatientId = searchParams.get('patientId') ?? '';
  const prefVisitId = searchParams.get('visitId') ?? '';

  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [clinics, setClinics] = useState<clinicsSvc.ClinicRow[]>([]);
  const [methods, setMethods] = useState<PaymentMethodRow[]>([]);
  const [services, setServices] = useState<catalogSvc.ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<Awaited<ReturnType<typeof ledgerSvc.listTransactions>>>([]);

  const [accountId, setAccountId] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [methodId, setMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [patientId, setPatientId] = useState(prefPatientId);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOptions, setPatientOptions] = useState<patientsSvc.PatientRow[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c, m, s, l] = await Promise.all([
        accountsSvc.list(),
        clinicsSvc.list(),
        paymentMethodsSvc.list(),
        catalogSvc.list(),
        ledgerSvc.listTransactions({ transactionType: 'revenue' }),
      ]);
      setAccounts(a);
      setClinics(c);
      setMethods(m);
      setServices(s);
      setLedger(l);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (!patientSearch || patientId) {
      // oxlint-disable-next-line react/set-state-in-effect
      setPatientOptions([]);
      return;
    }
    const t = setTimeout(() => {
      patientsSvc
        .list({ search: patientSearch, limit: 10 })
        .then(setPatientOptions)
        .catch(() => setPatientOptions([]));
    }, 250);
    return () => clearTimeout(t);
  }, [patientSearch, patientId]);

  async function submit() {
    if (saving) return;
    const amt = Number(amount);
    if (!(amt > 0)) {
      toast.error('أدخل مبلغاً صحيحاً');
      return;
    }
    if (!accountId) {
      toast.error('اختر الحساب المستلِم');
      return;
    }
    setSaving(true);
    try {
      if (patientId) {
        const res = await ledgerSvc.recordPatientPayment({
          p_patient_id: patientId,
          p_visit_id: prefVisitId || null,
          p_clinic_id: clinicId || null,
          p_service_id: serviceId || null,
          p_account_id: accountId,
          p_amount: amt,
          p_payment_method_id: methodId || null,
          p_notes: notes || null,
        });
        toast.success(`تم تسجيل التحصيل — إيصال ${res.receipt_no}`);
      } else {
        await ledgerSvc.createRevenue({
          p_account_id: accountId,
          p_clinic_id: clinicId || null,
          p_amount: amt,
          p_patient_id: null,
          p_visit_id: null,
          p_service_id: serviceId || null,
          p_payment_method_id: methodId || null,
          p_description: notes || null,
        });
        toast.success('تم تسجيل الإيراد');
      }
      setAmount('');
      setNotes('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تسجيل الإيراد');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <Card title="تحصيل إيراد">
        <div className="stack" style={{ gap: 8 }}>
          {patientId ? (
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="muted">
                المريض: <strong>{patientOptions.find((p) => p.id === patientId)?.full_name ?? patientId}</strong>
              </span>
              <Button variant="outline" onClick={() => setPatientId('')}>
                بدون مريض (إيراد عام)
              </Button>
            </div>
          ) : (
            <label className="field">
              <span className="field__label">بحث عن مريض (اختياري — اتركه فارغاً لإيراد غير مرتبط بمريض)</span>
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="الاسم أو الهاتف أو الكود"
              />
              {patientOptions.length ? (
                <select value="" onChange={(e) => { setPatientId(e.target.value); setPatientSearch(''); }}>
                  <option value="">— اختر —</option>
                  {patientOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} {p.phone ? `— ${p.phone}` : ''}
                    </option>
                  ))}
                </select>
              ) : null}
            </label>
          )}

          <label className="field">
            <span className="field__label">العيادة</span>
            <select value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
              <option value="">—</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>{c.name_ar}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">الحساب المستلِم *</span>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">— اختر —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name_ar}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">الخدمة</span>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">— بدون —</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name_ar} {s.default_price ? `(${s.default_price})` : ''}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">المبلغ *</span>
            <input type="number" dir="ltr" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>

          <label className="field">
            <span className="field__label">طريقة الدفع</span>
            <select value={methodId} onChange={(e) => setMethodId(e.target.value)}>
              <option value="">—</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>{m.name_ar}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">ملاحظات</span>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <Button disabled={saving} onClick={() => void submit()}>
            {saving ? 'جارٍ الحفظ…' : 'تسجيل التحصيل'}
          </Button>
        </div>
      </Card>

      {loading ? <Spinner label="جارٍ التحميل…" /> : null}

      {!loading ? (
        <Card title="آخر الإيرادات">
          {ledger.length ? (
            <table className="medical-report__table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>التاريخ</th><th>المبلغ</th><th>الإيصال</th><th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((t) => (
                  <tr key={t.id}>
                    <td>{M.fmtDay(t.transaction_date)}</td>
                    <td>{t.amount.toFixed(2)}</td>
                    <td>{t.receipt_no ?? '—'}</td>
                    <td>{t.description ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon="💰" text="لا توجد إيرادات مسجَّلة بعد" />
          )}
        </Card>
      ) : null}
    </div>
  );
}
