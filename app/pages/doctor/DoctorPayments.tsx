/* -------------------------------------------------------------------------
 * DoctorPayments — revenue dashboard, ledger, and Record Payment.
 * -------------------------------------------------------------------------
 * Everything here reads/writes iapp.payments as it actually exists today
 * (see services/payments.ts for what that does and doesn't support).
 * Recording a payment is always an explicit staff action from this screen
 * or from the "Record Payment" link on the patient record — nothing in
 * the appointment/visit/exam/imaging/follow-up flow calls this
 * automatically.
 *
 * "All Clinics" vs one clinic never mixes: the clinic filter is a single
 * dropdown, and every total shown is computed only from the rows the
 * current filter actually returned.
 * ---------------------------------------------------------------------- */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import * as patientsSvc from '../../services/patients';
import * as clinicsSvc from '../../services/clinics';
import * as catalogSvc from '../../services/catalog';
import * as paymentsSvc from '../../services/payments';
import type { PaymentRow, PaymentMethod } from '../../services/payments';
import * as M from '../../utils/models';

const METHOD_AR: Record<PaymentMethod, string> = {
  cash: 'نقدي',
  card: 'بطاقة',
  transfer: 'تحويل بنكي',
  insurance: 'تأمين',
  other: 'أخرى',
};

const STATUS_AR: Record<string, string> = {
  unpaid: 'غير مدفوع',
  partial: 'جزئي',
  paid: 'مدفوع',
  refunded: 'مسترجع',
  waived: 'ملغى',
};

function todayIso() {
  return M.today();
}

function monthStartIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function DoctorPayments() {
  useDocumentTitle('المدفوعات');
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const prefPatientId = searchParams.get('patientId') ?? '';
  const prefVisitId = searchParams.get('visitId') ?? '';

  const [clinics, setClinics] = useState<clinicsSvc.ClinicRow[]>([]);
  const [services, setServices] = useState<catalogSvc.ServiceRow[]>([]);
  const [clinicId, setClinicId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState(monthStartIso());
  const [dateTo, setDateTo] = useState(todayIso());

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(Boolean(prefPatientId));
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOptions, setPatientOptions] = useState<patientsSvc.PatientRow[]>([]);
  const [formPatientId, setFormPatientId] = useState(prefPatientId);
  const [formServiceId, setFormServiceId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('cash');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadFilters = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([clinicsSvc.list(), catalogSvc.list()]);
      setClinics(c);
      setServices(s);
    } catch {
      /* filters are non-essential; the ledger still works without them */
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPayments(
        await paymentsSvc.listByFilter({
          clinicId: clinicId || null,
          dateFrom: dateFrom ? `${dateFrom}T00:00:00` : undefined,
          dateTo: dateTo ? `${dateTo}T23:59:59` : undefined,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل المدفوعات');
    } finally {
      setLoading(false);
    }
  }, [clinicId, dateFrom, dateTo]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void loadPayments();
  }, [loadPayments]);

  /* Resolve patient names for the ledger. The payments table only carries
     patient_id; batching distinct ids through the existing patients.get()
     is simpler and safer than adding a join the service layer doesn't
     already support. */
  useEffect(() => {
    const ids = [...new Set(payments.map((p) => p.patient_id))].filter((id) => !patientNames[id]);
    if (!ids.length) return;
    let active = true;
    Promise.all(ids.map((id) => patientsSvc.get(id).catch(() => null))).then((results) => {
      if (!active) return;
      setPatientNames((prev) => {
        const next = { ...prev };
        results.forEach((p, i) => {
          if (p) next[ids[i]] = p.full_name;
        });
        return next;
      });
    });
    return () => {
      active = false;
    };
  }, [payments, patientNames]);

  useEffect(() => {
    if (!patientSearch || formPatientId) {
      // oxlint-disable-next-line react/set-state-in-effect
      setPatientOptions([]);
      return;
    }
    let active = true;
    const t = setTimeout(() => {
      patientsSvc
        .list({ search: patientSearch, limit: 10 })
        .then((p) => active && setPatientOptions(p))
        .catch(() => active && setPatientOptions([]));
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [patientSearch, formPatientId]);

  const totals = useMemo(() => {
    const collected = payments
      .filter((p) => p.status === 'paid' || p.status === 'partial')
      .reduce((sum, p) => sum + p.amount_paid, 0);
    const outstanding = payments
      .filter((p) => p.status === 'unpaid' || p.status === 'partial')
      .reduce((sum, p) => sum + (p.amount - p.amount_paid), 0);
    const refunded = payments.filter((p) => p.status === 'refunded').length;
    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      if (p.status !== 'paid' && p.status !== 'partial') continue;
      const key = p.method ? (METHOD_AR[p.method] ?? p.method) : '—';
      byMethod[key] = (byMethod[key] ?? 0) + p.amount_paid;
    }
    return { collected, outstanding, refunded, byMethod, count: payments.length };
  }, [payments]);

  async function submitPayment() {
    if (saving) return;
    if (!formPatientId) {
      toast.error('اختر المريض');
      return;
    }
    const amount = Number(formAmount);
    if (!(amount > 0)) {
      toast.error('أدخل مبلغاً صحيحاً');
      return;
    }
    setSaving(true);
    try {
      await paymentsSvc.record({
        patientId: formPatientId,
        visitId: prefVisitId || null,
        clinicId: clinicId || null,
        serviceId: formServiceId || null,
        amount,
        method: formMethod,
        notes: formNotes || null,
      });
      toast.success('تم تسجيل الدفعة');
      setFormAmount('');
      setFormNotes('');
      setShowForm(false);
      await loadPayments();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تسجيل الدفعة');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <Card title="المدفوعات — Payments">
        <div className="row" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <label className="field">
            <span className="field__label">العيادة</span>
            <select value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
              <option value="">كل العيادات</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar}
                </option>
              ))}
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
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'إغلاق نموذج التحصيل' : '+ تحصيل دفعة'}
          </Button>
        </div>
      </Card>

      <Card title="ملخص الفترة المحددة">
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <span className="tag">عدد العمليات: {totals.count}</span>
          <span className="tag">المُحصَّل: {totals.collected.toFixed(2)}</span>
          <span className="tag">المستحق: {totals.outstanding.toFixed(2)}</span>
          <span className="tag">عمليات استرجاع: {totals.refunded}</span>
        </div>
        {Object.keys(totals.byMethod).length ? (
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginBlockStart: 8 }}>
            {Object.entries(totals.byMethod).map(([k, v]) => (
              <span className="tag" key={k}>
                {k}: {v.toFixed(2)}
              </span>
            ))}
          </div>
        ) : null}
        <p className="muted" style={{ fontSize: 11, marginBlockStart: 8 }}>
          هذا الملخص محسوب من جدول المدفوعات الحالي فقط — لا يشمل مصروفات أو تحويلات أو أرصدة
          خزائن؛ هذه المفاهيم غير موجودة بعد في قاعدة البيانات (راجع تقرير التسليم).
        </p>
      </Card>

      {showForm ? (
        <Card title="تحصيل دفعة جديدة">
          <div className="stack" style={{ gap: 8 }}>
            {formPatientId ? (
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">
                  المريض المختار:{' '}
                  <strong>
                    {patientOptions.find((p) => p.id === formPatientId)?.full_name ?? formPatientId}
                  </strong>
                </span>
                <Button variant="outline" onClick={() => setFormPatientId('')}>
                  تغيير
                </Button>
              </div>
            ) : (
              <label className="field">
                <span className="field__label">بحث عن مريض</span>
                <input
                  type="text"
                  value={patientSearch}
                  placeholder="الاسم أو الهاتف أو الكود"
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
                {patientOptions.length ? (
                  <select
                    value=""
                    onChange={(e) => {
                      setFormPatientId(e.target.value);
                      setPatientSearch('');
                    }}
                  >
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
              <span className="field__label">الخدمة (اختياري)</span>
              <select value={formServiceId} onChange={(e) => setFormServiceId(e.target.value)}>
                <option value="">— بدون —</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_ar} {s.default_price ? `(${s.default_price})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">المبلغ *</span>
              <input
                type="number"
                dir="ltr"
                inputMode="decimal"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">طريقة الدفع</span>
              <select value={formMethod} onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}>
                {Object.entries(METHOD_AR).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">ملاحظات</span>
              <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
            </label>

            <Button disabled={saving} onClick={() => void submitPayment()}>
              {saving ? 'جارٍ الحفظ…' : 'تسجيل الدفعة'}
            </Button>
          </div>
        </Card>
      ) : null}

      {loading ? <Spinner label="جارٍ التحميل…" /> : null}
      {!loading && error ? <EmptyState icon="⚠️" text={error} /> : null}

      {!loading && !error ? (
        <Card title="سجل المدفوعات">
          {payments.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="medical-report__table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>المريض</th>
                    <th>الخدمة</th>
                    <th>المبلغ</th>
                    <th>المدفوع</th>
                    <th>الطريقة</th>
                    <th>الحالة</th>
                    <th>الإيصال</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.paid_at ? M.fmtDay(p.paid_at.slice(0, 10)) : '—'}</td>
                      <td>{patientNames[p.patient_id] ?? p.patient_id}</td>
                      <td>{services.find((s) => s.id === p.service_id)?.name_ar ?? '—'}</td>
                      <td>{p.amount.toFixed(2)}</td>
                      <td>{p.amount_paid.toFixed(2)}</td>
                      <td>{p.method ? (METHOD_AR[p.method] ?? p.method) : '—'}</td>
                      <td>{STATUS_AR[p.status] ?? p.status}</td>
                      <td>{p.receipt_no ?? '—'}</td>
                      <td>
                        <Link to={`/doctor/payments/${p.id}/receipt`}>
                          <Button variant="outline">الإيصال</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="💳" text="لا توجد مدفوعات في هذه الفترة" />
          )}
        </Card>
      ) : null}
    </div>
  );
}
