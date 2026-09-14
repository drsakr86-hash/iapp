import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import * as ledgerSvc from '../../services/accounting/ledger';
import * as M from '../../utils/models';

export default function AccountingRefunds() {
  useDocumentTitle('المرتجعات');
  const toast = useToast();
  const [revenue, setRevenue] = useState<Awaited<ReturnType<typeof ledgerSvc.listTransactions>>>([]);
  const [refunds, setRefunds] = useState<Awaited<ReturnType<typeof ledgerSvc.listTransactions>>>([]);
  const [loading, setLoading] = useState(true);

  const [originalId, setOriginalId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rev, ref] = await Promise.all([
        ledgerSvc.listTransactions({ transactionType: 'revenue' }),
        ledgerSvc.listTransactions({ transactionType: 'refund' }),
      ]);
      setRevenue(rev);
      setRefunds(ref);
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

  async function submit() {
    if (saving) return;
    const amt = Number(amount);
    if (!(amt > 0)) { toast.error('أدخل مبلغاً صحيحاً'); return; }
    if (!originalId) { toast.error('اختر العملية الأصلية'); return; }
    if (!reason.trim()) { toast.error('سبب الاسترجاع مطلوب'); return; }
    setSaving(true);
    try {
      await ledgerSvc.createRefund({ p_original_id: originalId, p_amount: amt, p_reason: reason });
      toast.success('تم تسجيل المرتجع');
      setAmount('');
      setReason('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تسجيل المرتجع — تحقق من المبلغ المتاح للاسترجاع');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <Card title="تسجيل مرتجع">
        <div className="stack" style={{ gap: 8 }}>
          <label className="field">
            <span className="field__label">العملية الأصلية (إيراد) *</span>
            <select value={originalId} onChange={(e) => setOriginalId(e.target.value)}>
              <option value="">— اختر —</option>
              {revenue.map((t) => (
                <option key={t.id} value={t.id}>
                  {M.fmtDay(t.transaction_date)} — {t.amount.toFixed(2)} {t.receipt_no ? `— ${t.receipt_no}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">مبلغ الاسترجاع *</span>
            <input type="number" dir="ltr" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">السبب *</span>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <Button disabled={saving} onClick={() => void submit()}>
            {saving ? 'جارٍ الحفظ…' : 'تسجيل الاسترجاع'}
          </Button>
        </div>
      </Card>

      {loading ? <Spinner label="جارٍ التحميل…" /> : null}
      {!loading ? (
        <Card title="آخر المرتجعات">
          {refunds.length ? (
            <table className="medical-report__table" style={{ width: '100%' }}>
              <thead><tr><th>التاريخ</th><th>المبلغ</th><th>السبب</th></tr></thead>
              <tbody>
                {refunds.map((t) => (
                  <tr key={t.id}>
                    <td>{M.fmtDay(t.transaction_date)}</td>
                    <td>{t.amount.toFixed(2)}</td>
                    <td>{t.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon="↩️" text="لا توجد مرتجعات مسجَّلة بعد" />
          )}
        </Card>
      ) : null}
    </div>
  );
}
