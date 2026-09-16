import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, Modal, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import * as accountsSvc from '../../services/accounting/accounts';
import * as clinicsSvc from '../../services/clinics';
import * as ledgerSvc from '../../services/accounting/ledger';
import * as reportsSvc from '../../services/accounting/reports';
import * as M from '../../utils/models';
import type { AccountRow, AccountInput } from '../../services/accounting/accounts';
import type { AccountBalanceRow, AccountKind } from '../../types/accounting.types';

const EMPTY: AccountInput = { code: '', nameAr: '', nameEn: '', kind: 'cash', clinicId: null };

type ObDirection = 'increase' | 'decrease';

export default function AccountingAccounts() {
  useDocumentTitle('الحسابات والخزائن');
  const toast = useToast();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [balances, setBalances] = useState<Record<string, AccountBalanceRow>>({});
  const [clinics, setClinics] = useState<clinicsSvc.ClinicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AccountInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  // Opening balance modal state.
  const [obOpen, setObOpen] = useState(false);
  const [obAccountId, setObAccountId] = useState('');
  const [obAmount, setObAmount] = useState('');
  const [obDirection, setObDirection] = useState<ObDirection>('increase');
  const [obDate, setObDate] = useState(M.today());
  const [obSaving, setObSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, c, b] = await Promise.all([
        accountsSvc.listAll(),
        clinicsSvc.list(),
        reportsSvc.accountBalances(),
      ]);
      setAccounts(a);
      setClinics(c);
      setBalances(Object.fromEntries(b.map((row) => [row.account_id, row])));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل الحسابات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  function startAdd() {
    setForm(EMPTY);
    setEditingId('');
  }
  function startEdit(a: AccountRow) {
    setForm({
      code: a.code,
      nameAr: a.name_ar,
      nameEn: a.name_en ?? '',
      kind: a.kind,
      clinicId: a.clinic_id,
      allowOverdraft: a.allow_overdraft,
      notes: a.notes ?? '',
    });
    setEditingId(a.id);
  }
  function cancel() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      if (editingId) {
        await accountsSvc.update(editingId, form);
        toast.success('تم تعديل الحساب');
      } else {
        await accountsSvc.create(form);
        toast.success('تمت إضافة الحساب');
      }
      cancel();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر حفظ الحساب');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(a: AccountRow) {
    if (workingId) return;
    setWorkingId(a.id);
    try {
      await accountsSvc.setActive(a.id, !a.is_active);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تحديث الحالة');
    } finally {
      setWorkingId(null);
    }
  }

  function openOpeningBalance(accountId?: string) {
    setObAccountId(accountId ?? '');
    setObAmount('');
    setObDirection('increase');
    setObDate(M.today());
    setObOpen(true);
  }

  async function submitOpeningBalance() {
    if (obSaving) return;
    if (!obAccountId) {
      toast.error('اختر الحساب');
      return;
    }
    const magnitude = Number(obAmount);
    if (!(magnitude > 0)) {
      toast.error('أدخل مبلغاً أكبر من صفر');
      return;
    }
    if (!obDate) {
      toast.error('أدخل تاريخاً صحيحاً');
      return;
    }
    setObSaving(true);
    try {
      // The backend has no separate "direction" column — create_opening_balance
      // takes one signed p_amount (opening_balance is the sole transaction
      // type allowed a negative amount; every other type is a positive
      // magnitude with direction implied by transaction_type). "زيادة/عجز"
      // here is purely a UI convenience that resolves to that sign before
      // calling the existing RPC wrapper unchanged.
      const signedAmount = obDirection === 'increase' ? magnitude : -magnitude;
      await ledgerSvc.createOpeningBalance({
        p_account_id: obAccountId,
        p_amount: signedAmount,
        p_transaction_date: obDate,
      });
      toast.success('تم تسجيل الرصيد الافتتاحي');
      setObOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تسجيل الرصيد الافتتاحي');
    } finally {
      setObSaving(false);
    }
  }

  return (
    <div className="stack">
      <Card title="الحسابات / الخزائن">
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {editingId === null ? <Button onClick={startAdd}>+ إضافة حساب</Button> : null}
          <Button variant="outline" onClick={() => openOpeningBalance()}>
            الرصيد الافتتاحي
          </Button>
        </div>
      </Card>

      {editingId !== null ? (
        <Card title={editingId ? 'تعديل الحساب' : 'إضافة حساب جديد'}>
          <div className="stack" style={{ gap: 8 }}>
            <label className="field">
              <span className="field__label">الكود *</span>
              <input
                type="text"
                dir="ltr"
                value={form.code}
                disabled={!!editingId}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              />
            </label>
            <label className="field">
              <span className="field__label">الاسم بالعربية *</span>
              <input
                type="text"
                value={form.nameAr}
                onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              />
            </label>
            <label className="field">
              <span className="field__label">النوع</span>
              <select
                value={form.kind}
                onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as AccountKind }))}
              >
                <option value="cash">نقدي (خزينة)</option>
                <option value="bank">بنكي</option>
                <option value="other">أخرى</option>
              </select>
            </label>
            <label className="field">
              <span className="field__label">العيادة (اتركه فارغاً لحساب مشترك)</span>
              <select
                value={form.clinicId ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, clinicId: e.target.value || null }))}
              >
                <option value="">— حساب مشترك —</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ar}
                  </option>
                ))}
              </select>
            </label>
            <label className="field row" style={{ alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={form.allowOverdraft ?? false}
                onChange={(e) => setForm((f) => ({ ...f, allowOverdraft: e.target.checked }))}
              />
              <span>السماح بالسحب على المكشوف لهذا الحساب</span>
            </label>
            <div className="row" style={{ gap: 8 }}>
              <Button disabled={saving} onClick={() => void save()}>
                {saving ? 'جارٍ الحفظ…' : 'حفظ'}
              </Button>
              <Button variant="outline" onClick={cancel}>
                إلغاء
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {loading ? <Spinner label="جارٍ التحميل…" /> : null}
      {!loading && error ? <EmptyState icon="⚠️" text={error} /> : null}

      {!loading && !error ? (
        <div className="stack" style={{ gap: 8 }}>
          {accounts.map((a) => (
            <Card key={a.id}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong>{a.name_ar}</strong>
                  {!a.is_active ? <span className="tag" style={{ marginInlineStart: 8 }}>موقوف</span> : null}
                  <p className="muted" style={{ fontSize: 12 }}>
                    {a.kind} · {a.currency}
                    {a.allow_overdraft ? ' · يسمح بالسحب على المكشوف' : ''}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>
                    الرصيد الحالي: {(balances[a.id]?.current_balance ?? 0).toFixed(2)} {a.currency}
                  </p>
                </div>
                <span className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  <Button variant="outline" onClick={() => openOpeningBalance(a.id)}>
                    إضافة رصيد افتتاحي
                  </Button>
                  <Button variant="outline" onClick={() => startEdit(a)}>
                    تعديل
                  </Button>
                  <Button
                    variant={a.is_active ? 'danger' : 'outline'}
                    disabled={workingId === a.id}
                    onClick={() => void toggle(a)}
                  >
                    {a.is_active ? 'إيقاف' : 'تفعيل'}
                  </Button>
                </span>
              </div>
            </Card>
          ))}
          {!accounts.length ? <EmptyState icon="🏦" text="لا توجد حسابات مُضافة بعد" /> : null}
        </div>
      ) : null}

      {obOpen ? (
        <Modal title="الرصيد الافتتاحي" onClose={() => (!obSaving ? setObOpen(false) : undefined)}>
          <div className="stack" style={{ gap: 10 }}>
            <label className="field">
              <span className="field__label">الحساب *</span>
              <select value={obAccountId} onChange={(e) => setObAccountId(e.target.value)}>
                <option value="">— اختر —</option>
                {accounts
                  .filter((a) => a.is_active)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name_ar}
                    </option>
                  ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">اتجاه الرصيد *</span>
              <select value={obDirection} onChange={(e) => setObDirection(e.target.value as ObDirection)}>
                <option value="increase">زيادة (رصيد افتتاحي موجب)</option>
                <option value="decrease">عجز افتتاحي (رصيد سالب)</option>
              </select>
            </label>

            <label className="field">
              <span className="field__label">المبلغ *</span>
              <input
                type="number"
                dir="ltr"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={obAmount}
                onChange={(e) => setObAmount(e.target.value)}
              />
              <span className="muted" style={{ fontSize: 11 }}>
                أدخل المبلغ كرقم موجب — اتجاه الرصيد أعلاه يحدد الإشارة.
              </span>
            </label>

            <label className="field">
              <span className="field__label">تاريخ الرصيد *</span>
              <input type="date" value={obDate} onChange={(e) => setObDate(e.target.value)} />
            </label>

            <p className="muted" style={{ fontSize: 11 }}>
              يمكن تسجيل رصيد افتتاحي واحد فقط لكل حساب، ولا يمكن تسجيله بعد وجود حركات مالية
              أخرى على الحساب.
            </p>

            <div className="row" style={{ gap: 8 }}>
              <Button disabled={obSaving} onClick={() => void submitOpeningBalance()}>
                {obSaving ? 'جارٍ الحفظ…' : 'حفظ الرصيد الافتتاحي'}
              </Button>
              <Button variant="outline" disabled={obSaving} onClick={() => setObOpen(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
