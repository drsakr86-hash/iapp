import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import * as paymentMethodsSvc from '../../services/accounting/paymentMethods';
import * as expenseCategoriesSvc from '../../services/accounting/expenseCategories';
import type { PaymentMethodRow, ExpenseCategoryRow } from '../../types/accounting.types';

export default function AccountingSettings() {
  useDocumentTitle('إعدادات الحسابات');
  const toast = useToast();
  const [methods, setMethods] = useState<PaymentMethodRow[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [newMethodCode, setNewMethodCode] = useState('');
  const [newMethodName, setNewMethodName] = useState('');
  const [newCategoryCode, setNewCategoryCode] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([
        paymentMethodsSvc.listAll(),
        expenseCategoriesSvc.listAll(),
      ]);
      setMethods(m);
      setCategories(c);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر التحميل');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  async function addMethod() {
    try {
      await paymentMethodsSvc.create({ code: newMethodCode, nameAr: newMethodName });
      setNewMethodCode('');
      setNewMethodName('');
      toast.success('تمت الإضافة');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر الحفظ');
    }
  }

  async function addCategory() {
    try {
      await expenseCategoriesSvc.create({ code: newCategoryCode, nameAr: newCategoryName });
      setNewCategoryCode('');
      setNewCategoryName('');
      toast.success('تمت الإضافة');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر الحفظ');
    }
  }

  if (loading) return <Spinner label="جارٍ التحميل…" />;

  return (
    <div className="stack">
      <Card title="طرق الدفع">
        <div className="stack" style={{ gap: 6 }}>
          {methods.map((m) => (
            <div key={m.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>{m.name_ar} {!m.is_active ? '(موقوفة)' : ''}</span>
              <Button
                variant={m.is_active ? 'danger' : 'outline'}
                onClick={() => void paymentMethodsSvc.setActive(m.id, !m.is_active).then(load)}
              >
                {m.is_active ? 'إيقاف' : 'تفعيل'}
              </Button>
            </div>
          ))}
          {!methods.length ? <EmptyState icon="💳" text="لا توجد طرق دفع" /> : null}
        </div>
        <div className="row" style={{ gap: 8, marginBlockStart: 10, flexWrap: 'wrap' }}>
          <input placeholder="الكود" dir="ltr" value={newMethodCode} onChange={(e) => setNewMethodCode(e.target.value)} />
          <input placeholder="الاسم بالعربية" value={newMethodName} onChange={(e) => setNewMethodName(e.target.value)} />
          <Button onClick={() => void addMethod()}>+ إضافة</Button>
        </div>
      </Card>

      <Card title="فئات المصروفات">
        <div className="stack" style={{ gap: 6 }}>
          {categories.map((c) => (
            <div key={c.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>{c.name_ar} {!c.is_active ? '(موقوفة)' : ''}</span>
              <Button
                variant={c.is_active ? 'danger' : 'outline'}
                onClick={() => void expenseCategoriesSvc.setActive(c.id, !c.is_active).then(load)}
              >
                {c.is_active ? 'إيقاف' : 'تفعيل'}
              </Button>
            </div>
          ))}
          {!categories.length ? <EmptyState icon="🧾" text="لا توجد فئات مصروفات" /> : null}
        </div>
        <div className="row" style={{ gap: 8, marginBlockStart: 10, flexWrap: 'wrap' }}>
          <input placeholder="الكود" dir="ltr" value={newCategoryCode} onChange={(e) => setNewCategoryCode(e.target.value)} />
          <input placeholder="الاسم بالعربية" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
          <Button onClick={() => void addCategory()}>+ إضافة</Button>
        </div>
      </Card>
    </div>
  );
}
