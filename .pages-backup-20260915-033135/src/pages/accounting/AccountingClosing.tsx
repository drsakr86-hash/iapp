import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { table } from '../../services/accounting/_rpc';
import * as ledgerSvc from '../../services/accounting/ledger';
import * as clinicsSvc from '../../services/clinics';
import * as M from '../../utils/models';
import type { DailyClosingRow } from '../../types/accounting.types';

export default function AccountingClosing() {
  useDocumentTitle('الإغلاق اليومي');
  const toast = useToast();
  const [clinics, setClinics] = useState<clinicsSvc.ClinicRow[]>([]);
  const [closings, setClosings] = useState<DailyClosingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [clinicId, setClinicId] = useState('');
  const [closingDate, setClosingDate] = useState(M.today());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, cl] = await Promise.all([
        clinicsSvc.list(),
        table('daily_closings').select('*').order('closing_date', { ascending: false }).limit(30),
      ]);
      setClinics(c);
      setClosings((cl.data as DailyClosingRow[] | null) ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تحميل بيانات الإغلاق');
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
    setSaving(true);
    try {
      await ledgerSvc.createDailyClosing({
        p_clinic_id: clinicId || null,
        p_closing_date: closingDate,
        p_notes: notes || null,
      });
      toast.success('تم إغلاق اليوم');
      setNotes('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر الإغلاق — قد يكون هذا اليوم مُغلقاً بالفعل');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <Card title="إغلاق اليوم">
        <p className="muted" style={{ fontSize: 12 }}>
          بعد إغلاق تاريخ مُعيّن لعيادة، لا يمكن تسجيل أي عملية مالية جديدة بتاريخ يساوي أو يسبق
          هذا التاريخ لنفس العيادة. الإغلاق دائم ولا يمكن التراجع عنه — تأكد من مراجعة جميع
          العمليات قبل الإغلاق.
        </p>
        <div className="stack" style={{ gap: 8 }}>
          <label className="field">
            <span className="field__label">العيادة (اتركه فارغاً لإغلاق عام/مشترك)</span>
            <select value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
              <option value="">— إغلاق عام —</option>
              {clinics.map((c) => (<option key={c.id} value={c.id}>{c.name_ar}</option>))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">تاريخ الإغلاق *</span>
            <input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">ملاحظات</span>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <Button disabled={saving} onClick={() => void submit()}>
            {saving ? 'جارٍ الإغلاق…' : 'تأكيد الإغلاق'}
          </Button>
        </div>
      </Card>

      {loading ? <Spinner label="جارٍ التحميل…" /> : null}
      {!loading ? (
        <Card title="سجل الإغلاقات">
          {closings.length ? (
            <table className="medical-report__table" style={{ width: '100%' }}>
              <thead><tr><th>التاريخ</th><th>العيادة</th><th>ملاحظات</th></tr></thead>
              <tbody>
                {closings.map((c) => (
                  <tr key={c.id}>
                    <td>{M.fmtDay(c.closing_date)}</td>
                    <td>{clinics.find((x) => x.id === c.clinic_id)?.name_ar ?? 'عام'}</td>
                    <td>{c.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon="🔒" text="لا توجد إغلاقات سابقة" />
          )}
        </Card>
      ) : null}
    </div>
  );
}
