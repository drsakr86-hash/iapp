/* -------------------------------------------------------------------------
 * AdminServices — Service Catalog management.
 * -------------------------------------------------------------------------
 * Reuses iapp.services (found during the financial-module audit, no
 * frontend integration existed before this). Add / edit / activate /
 * deactivate only — a service tied to historical payments must keep
 * existing so those records keep a real service name, not a dangling id.
 * ---------------------------------------------------------------------- */

import { SERVICE_CATEGORIES } from '../../config/fieldOptions';
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import * as catalogSvc from '../../services/catalog';
import type { ServiceRow, ServiceInput } from '../../services/catalog';
import * as dropdownSvc from '../../services/dropdownOptions';

const EMPTY_FORM: ServiceInput = { nameAr: '', nameEn: '', category: '', defaultPrice: 0, code: '' };

export default function AdminServices() {
  useDocumentTitle('كتالوج الخدمات');
  const toast = useToast();

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null); // null = closed, '' = new
  const [form, setForm] = useState<ServiceInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [svcRows] = await Promise.all([catalogSvc.listAll(), dropdownSvc.listActive()]);
      setServices(svcRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل كتالوج الخدمات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditingId('');
  }

  function startEdit(s: ServiceRow) {
    setForm({
      nameAr: s.name_ar,
      nameEn: s.name_en ?? '',
      category: s.category ?? '',
      defaultPrice: s.default_price,
      code: s.code ?? '',
    });
    setEditingId(s.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function save() {
    if (saving) return;
    if (!form.nameAr.trim()) {
      toast.error('اسم الخدمة بالعربية مطلوب');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await catalogSvc.update(editingId, form);
        toast.success('تم تعديل الخدمة');
      } else {
        await catalogSvc.create(form);
        toast.success('تمت إضافة الخدمة');
      }
      cancelEdit();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر حفظ الخدمة');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: ServiceRow) {
    if (workingId) return;
    setWorkingId(s.id);
    try {
      await catalogSvc.setActive(s.id, !s.is_active);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تحديث حالة الخدمة');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="stack">
      <Card title="كتالوج الخدمات — Services">
        <p className="muted" style={{ fontSize: 12 }}>
          الأسعار هنا هي الأسعار الافتراضية فقط — يمكن تعديل المبلغ الفعلي عند تحصيل كل دفعة على
          حدة من شاشة المدفوعات.
        </p>
        {editingId === null ? <Button onClick={startAdd}>+ إضافة خدمة</Button> : null}
      </Card>

      {editingId !== null ? (
        <Card title={editingId ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}>
          <div className="stack" style={{ gap: 8 }}>
            <label className="field">
              <span className="field__label">الاسم بالعربية *</span>
              <input
                type="text"
                value={form.nameAr}
                onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              />
            </label>
            <label className="field">
              <span className="field__label">الاسم بالإنجليزية (اختياري)</span>
              <input
                type="text"
                dir="ltr"
                value={form.nameEn ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              />
            </label>
            <label className="field">
              <span className="field__label">الفئة</span>
              <select
                value={form.category ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value || null }))}
              >
                <option value="">— بدون فئة —</option>
                {SERVICE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">السعر الافتراضي</span>
              <input
                type="number"
                dir="ltr"
                inputMode="decimal"
                value={form.defaultPrice ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, defaultPrice: Number(e.target.value) || 0 }))}
              />
            </label>
            <div className="row" style={{ gap: 8 }}>
              <Button disabled={saving} onClick={() => void save()}>
                {saving ? 'جارٍ الحفظ…' : 'حفظ'}
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
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
          {services.map((s) => (
            <Card key={s.id}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong>{s.name_ar}</strong>
                  {s.name_en ? <span className="muted"> — {s.name_en}</span> : null}
                  {!s.is_active ? <span className="tag" style={{ marginInlineStart: 8 }}>موقوفة</span> : null}
                  <p className="muted" style={{ fontSize: 12 }}>
                    {s.category ? `${s.category} · ` : ''}
                    {s.default_price} {s.currency}
                  </p>
                </div>
                <span className="row" style={{ gap: 6 }}>
                  <Button variant="outline" onClick={() => startEdit(s)}>
                    تعديل
                  </Button>
                  <Button
                    variant={s.is_active ? 'danger' : 'outline'}
                    disabled={workingId === s.id}
                    onClick={() => void toggleActive(s)}
                  >
                    {s.is_active ? 'إيقاف' : 'تفعيل'}
                  </Button>
                </span>
              </div>
            </Card>
          ))}
          {!services.length ? <EmptyState icon="🧾" text="لا توجد خدمات مُضافة بعد" /> : null}
        </div>
      ) : null}
    </div>
  );
}

