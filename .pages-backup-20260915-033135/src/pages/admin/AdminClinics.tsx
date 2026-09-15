/* -------------------------------------------------------------------------
 * AdminClinics — Clinic Locations management.
 * -------------------------------------------------------------------------
 * Add / edit / activate / deactivate only. There is deliberately no hard
 * delete: a clinic tied to historical visits must keep existing so every
 * past report printed from it keeps its address/contact info. See
 * services/clinics.ts for the full rationale.
 * ---------------------------------------------------------------------- */

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import * as clinicsSvc from '../../services/clinics';
import type { ClinicRow, ClinicInput } from '../../services/clinics';

const EMPTY_FORM: ClinicInput = {
  nameAr: '',
  nameEn: '',
  address: '',
  phone: '',
  whatsapp: '',
};

export default function AdminClinics() {
  useDocumentTitle('مواقع العيادات');
  const toast = useToast();

  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null); // null = closed, '' = new
  const [form, setForm] = useState<ClinicInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setClinics(await clinicsSvc.listAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل مواقع العيادات');
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

  function startEdit(c: ClinicRow) {
    setForm({
      nameAr: c.name_ar,
      nameEn: c.name_en ?? '',
      address: c.address ?? '',
      phone: c.phone ?? '',
      whatsapp: c.whatsapp ?? '',
    });
    setEditingId(c.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function save() {
    if (saving) return;
    if (!form.nameAr.trim()) {
      toast.error('اسم العيادة بالعربية مطلوب');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await clinicsSvc.update(editingId, form);
        toast.success('تم تعديل العيادة');
      } else {
        await clinicsSvc.create(form);
        toast.success('تمت إضافة العيادة');
      }
      cancelEdit();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر حفظ العيادة');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: ClinicRow) {
    if (workingId) return;
    setWorkingId(c.id);
    try {
      await clinicsSvc.setActive(c.id, !c.is_active);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تحديث حالة العيادة');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="stack">
      <Card title="مواقع العيادات — Clinic Locations">
        <p className="muted" style={{ fontSize: 12 }}>
          إيقاف عيادة لا يحذف الزيارات أو التقارير القديمة — تبقى مرتبطة بعنوان وبيانات تواصل تلك
          العيادة كما كانت وقت الزيارة.
        </p>
        {editingId === null ? (
          <Button onClick={startAdd}>+ إضافة عيادة</Button>
        ) : null}
      </Card>

      {editingId !== null ? (
        <Card title={editingId ? 'تعديل العيادة' : 'إضافة عيادة جديدة'}>
          <div className="stack" style={{ gap: 8 }}>
            <label className="field">
              <span className="field__label">الاسم بالعربية *</span>
              <input
                type="text"
                value={form.nameAr ?? ''}
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
              <span className="field__label">العنوان</span>
              <input
                type="text"
                value={form.address ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </label>
            <label className="field">
              <span className="field__label">تليفون</span>
              <input
                type="tel"
                dir="ltr"
                value={form.phone ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
            <label className="field">
              <span className="field__label">واتساب</span>
              <input
                type="tel"
                dir="ltr"
                value={form.whatsapp ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              />
            </label>
            <p className="muted" style={{ fontSize: 11 }}>
              لا يوجد حقل منفصل لرقم "موبايل" في قاعدة البيانات الحالية — الحقول المتاحة هي
              تليفون وواتساب فقط. إن احتجت رقمَين منفصلَين (أرضي + موبايل) يلزم إضافة عمود جديد؛
              تواصل معي إن رغبت في ذلك.
            </p>
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
          {clinics.map((c) => (
            <Card key={c.id}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong>{c.name_ar}</strong>
                  {c.name_en ? <span className="muted"> — {c.name_en}</span> : null}
                  {!c.is_active ? <span className="tag" style={{ marginInlineStart: 8 }}>موقوفة</span> : null}
                  {c.address ? <p className="muted" style={{ fontSize: 12 }}>{c.address}</p> : null}
                  <p className="muted" style={{ fontSize: 12 }}>
                    {[c.phone ? `تليفون: ${c.phone}` : null, c.whatsapp ? `واتساب: ${c.whatsapp}` : null]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
                <span className="row" style={{ gap: 6 }}>
                  <Button variant="outline" onClick={() => startEdit(c)}>
                    تعديل
                  </Button>
                  <Button
                    variant={c.is_active ? 'danger' : 'outline'}
                    disabled={workingId === c.id}
                    onClick={() => void toggleActive(c)}
                  >
                    {c.is_active ? 'إيقاف' : 'تفعيل'}
                  </Button>
                </span>
              </div>
            </Card>
          ))}
          {!clinics.length ? <EmptyState icon="🏥" text="لا توجد عيادات مُضافة بعد" /> : null}
        </div>
      ) : null}
    </div>
  );
}
