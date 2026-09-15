import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import * as accountsSvc from '../../services/accounting/accounts';
import * as expenseCategoriesSvc from '../../services/accounting/expenseCategories';
import * as ledgerSvc from '../../services/accounting/ledger';
import * as clinicsSvc from '../../services/clinics';
import * as M from '../../utils/models';
import type { AccountRow } from '../../services/accounting/accounts';
import type { ExpenseCategoryRow } from '../../types/accounting.types';

export default function AccountingExpenses() {
  useDocumentTitle('المصروفات');
  const toast = useToast();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [clinics, setClinics] = useState<clinicsSvc.ClinicRow[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryRow[]>([]);
  const [ledger, setLedger] = useState<Awaited<ReturnType<typeof ledgerSvc.listTransactions>>>([]);
  const [loading, setLoading] = useState(true);

  const [accountId, setAccountId] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c, cat, l] = await Promise.all([
        accountsSvc.list(),
        clinicsSvc.list(),
        expenseCategoriesSvc.list(),
        ledgerSvc.listTransactions({ transactionType: 'expense' }),
      ]);
      setAccounts(a);
      setClinics(c);
      setCategories(cat);
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
    if (!(amt > 0)) {
      toast.error('أدخل مبلغاً صحيحاً');
      return;
    }
    if (!accountId) {
      toast.error('اختر الحساب');
      return;
    }
    setSaving(true);
    try {
      await ledgerSvc.createExpense({
        p_account_id: accountId,
        p_clinic_id: clinicId || null,
        p_amount: amt,
        p_expense_category_id: categoryId || null,
        p_description: description || null,
      });
      toast.success('تم تسجيل المصروف');
      setAmount('');
      setDescription('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تسجيل المصروف — تحقق من رصيد الحساب');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <Card title="تسجيل مصروف">
        <div className="stack" style={{ gap: 8 }}>
          <label className="field">
            <span className="field__label">العيادة</span>
            <select value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
              <option value="">—</option>
              {clinics.map((c) => (<option key={c.id} value={c.id}>{c.name_ar}</option>))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">الحساب *</span>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">— اختر —</option>
              {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name_ar}</option>))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">فئة المصروف</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">—</option>
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.name_ar}</option>))}
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
            {saving ? 'جارٍ الحفظ…' : 'تسجيل المصروف'}
          </Button>
        </div>
      </Card>

      {loading ? <Spinner label="جارٍ التحميل…" /> : null}
      {!loading ? (
        <Card title="آخر المصروفات">
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
            <EmptyState icon="🧾" text="لا توجد مصروفات مسجَّلة بعد" />
          )}
        </Card>
      ) : null}
    </div>
  );
}
