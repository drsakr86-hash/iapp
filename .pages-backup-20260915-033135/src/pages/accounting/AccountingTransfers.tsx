import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import * as accountsSvc from '../../services/accounting/accounts';
import * as ledgerSvc from '../../services/accounting/ledger';
import * as M from '../../utils/models';
import type { AccountRow } from '../../services/accounting/accounts';

export default function AccountingTransfers() {
  useDocumentTitle('التحويلات بين الحسابات');
  const toast = useToast();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [ledger, setLedger] = useState<Awaited<ReturnType<typeof ledgerSvc.listTransactions>>>([]);
  const [loading, setLoading] = useState(true);

  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, l] = await Promise.all([
        accountsSvc.list(),
        ledgerSvc.listTransactions({ transactionType: 'transfer_out' }),
      ]);
      setAccounts(a);
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

  async function submit() {
    if (saving) return;
    const amt = Number(amount);
    if (!(amt > 0)) { toast.error('أدخل مبلغاً صحيحاً'); return; }
    if (!fromId || !toId) { toast.error('اختر الحساب المرسِل والمستلِم'); return; }
    if (fromId === toId) { toast.error('لا يمكن التحويل لنفس الحساب'); return; }
    setSaving(true);
    try {
      await ledgerSvc.createTransfer({
        p_from_account: fromId,
        p_to_account: toId,
        p_amount: amt,
        p_description: description || null,
      });
      toast.success('تم التحويل بنجاح');
      setAmount('');
      setDescription('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر إتمام التحويل — تحقق من الرصيد والعملة');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <Card title="تحويل بين الحسابات">
        <div className="stack" style={{ gap: 8 }}>
          <label className="field">
            <span className="field__label">من حساب *</span>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)}>
              <option value="">— اختر —</option>
              {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name_ar}</option>))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">إلى حساب *</span>
            <select value={toId} onChange={(e) => setToId(e.target.value)}>
              <option value="">— اختر —</option>
              {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name_ar}</option>))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">المبلغ *</span>
            <input type="number" dir="ltr" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">الوصف</span>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <Button disabled={saving} onClick={() => void submit()}>
            {saving ? 'جارٍ التحويل…' : 'تنفيذ التحويل'}
          </Button>
        </div>
      </Card>

      {loading ? <Spinner label="جارٍ التحميل…" /> : null}
      {!loading ? (
        <Card title="آخر التحويلات">
          {ledger.length ? (
            <table className="medical-report__table" style={{ width: '100%' }}>
              <thead><tr><th>التاريخ</th><th>المبلغ</th><th>الوصف</th></tr></thead>
              <tbody>
                {ledger.map((t) => (
                  <tr key={t.id}>
                    <td>{M.fmtDay(t.transaction_date)}</td>
                    <td>{t.amount.toFixed(2)}</td>
                    <td>{t.description ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon="🔁" text="لا توجد تحويلات مسجَّلة بعد" />
          )}
        </Card>
      ) : null}
    </div>
  );
}
