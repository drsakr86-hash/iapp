/* -------------------------------------------------------------------------
 * DoctorManagement — add / edit / deactivate doctor records.
 * -------------------------------------------------------------------------
 * Embedded inside DoctorProfile.tsx ("ملفي") rather than a new route —
 * the page is already behind ProtectedRoute allow={['doctor','admin']},
 * so no separate authorization check is added here; the route itself is
 * the enforcement point, matching how every other doctor/admin screen in
 * this app works. There is currently no finer per-doctor permission model
 * (e.g. "only the primary doctor may manage others") anywhere in this
 * codebase to draw a narrower boundary from — inventing one here would be
 * exactly the kind of new authorization concept the brief warned against.
 *
 * No login/auth account is ever created from this screen — see the
 * comment block in services/doctors.ts for why. A new doctor is a
 * clinical-only record until optionally linked to an existing,
 * not-yet-linked profile.
 * ---------------------------------------------------------------------- */

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import * as doctorsSvc from '../../services/doctors';
import type { DoctorRecord, DoctorInput, UnlinkedProfile } from '../../services/doctors';

const EMPTY: DoctorInput = {
  fullNameAr: '',
  fullNameEn: '',
  shortName: '',
  titleAr: '',
  specialty: '',
  licenseNo: '',
  phone: '',
  email: '',
};

export function DoctorManagement() {
  const toast = useToast();
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [unlinked, setUnlinked] = useState<UnlinkedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null); // null=closed, ''=new
  const [form, setForm] = useState<DoctorInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkProfileId, setLinkProfileId] = useState('');
  const [linking, setLinking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, u] = await Promise.all([
        doctorsSvc.listAll(),
        doctorsSvc.unlinkedDoctorProfiles(),
      ]);
      setDoctors(d);
      setUnlinked(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل قائمة الأطباء');
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
  function startEdit(d: DoctorRecord) {
    setForm({
      fullNameAr: d.full_name_ar,
      fullNameEn: d.full_name_en ?? '',
      shortName: d.short_name ?? '',
      titleAr: d.title_ar ?? '',
      specialty: d.specialty ?? '',
      licenseNo: d.license_no ?? '',
      phone: d.phone ?? '',
      email: d.email ?? '',
    });
    setEditingId(d.id);
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
        await doctorsSvc.update(editingId, form);
        toast.success('تم تعديل بيانات الطبيب');
      } else {
        await doctorsSvc.create(form);
        toast.success('تمت إضافة الطبيب');
      }
      cancel();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر حفظ بيانات الطبيب');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(d: DoctorRecord) {
    if (workingId) return;
    if (d.is_active && !window.confirm(`هل تريد إيقاف ${d.full_name_ar}؟ يمكن التفعيل مرة أخرى لاحقاً.`)) {
      return;
    }
    setWorkingId(d.id);
    try {
      await doctorsSvc.setActive(d.id, !d.is_active);
      toast.success(d.is_active ? 'تم إيقاف الطبيب' : 'تم تفعيل الطبيب');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تحديث الحالة');
    } finally {
      setWorkingId(null);
    }
  }

  function startLink(doctorId: string) {
    setLinkingId(doctorId);
    setLinkProfileId('');
  }

  async function submitLink() {
    if (!linkingId || !linkProfileId || linking) return;
    setLinking(true);
    try {
      await doctorsSvc.linkProfile(linkingId, linkProfileId);
      toast.success('تم ربط الحساب بالطبيب');
      setLinkingId(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر ربط الحساب');
    } finally {
      setLinking(false);
    }
  }

  return (
    <Card title="إدارة الأطباء">
      <p className="muted" style={{ fontSize: 12 }}>
        إيقاف طبيب لا يحذف أي سجل طبي أو مالي مرتبط به — يبقى كل شيء كما هو، فقط لا يظهر
        الطبيب كخيار نشط بعد ذلك. لا يوجد حذف نهائي من هذه الشاشة.
      </p>

      {editingId === null ? <Button onClick={startAdd}>+ إضافة طبيب</Button> : null}

      {editingId !== null ? (
        <div className="stack" style={{ gap: 8, marginBlockStart: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14 }}>
            {editingId ? 'تعديل طبيب' : 'إضافة طبيب جديد'}
          </h3>
          <label className="field">
            <span className="field__label">الاسم بالعربية *</span>
            <input
              type="text"
              value={form.fullNameAr}
              onChange={(e) => setForm((f) => ({ ...f, fullNameAr: e.target.value }))}
            />
          </label>
          <label className="field">
            <span className="field__label">اللقب</span>
            <input
              type="text"
              placeholder="د."
              value={form.titleAr ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
            />
          </label>
          <label className="field">
            <span className="field__label">الاسم بالإنجليزية (للطباعة)</span>
            <input
              type="text"
              dir="ltr"
              value={form.fullNameEn ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, fullNameEn: e.target.value }))}
            />
          </label>
          <label className="field">
            <span className="field__label">الاسم المختصر</span>
            <input
              type="text"
              value={form.shortName ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
            />
          </label>
          <label className="field">
            <span className="field__label">التخصص</span>
            <input
              type="text"
              value={form.specialty ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
            />
          </label>
          <label className="field">
            <span className="field__label">رقم الترخيص</span>
            <input
              type="text"
              dir="ltr"
              value={form.licenseNo ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, licenseNo: e.target.value }))}
            />
          </label>
          <label className="field">
            <span className="field__label">الهاتف</span>
            <input
              type="tel"
              dir="ltr"
              value={form.phone ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </label>
          <label className="field">
            <span className="field__label">البريد الإلكتروني</span>
            <input
              type="email"
              dir="ltr"
              value={form.email ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
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
      ) : null}

      {loading ? <Spinner label="جارٍ التحميل…" /> : null}
      {!loading && error ? <EmptyState icon="⚠️" text={error} /> : null}

      {!loading && !error ? (
        <div className="stack" style={{ gap: 8, marginBlockStart: 10 }}>
          {doctors.map((d) => (
            <div key={d.id} className="card" style={{ padding: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong>
                    {d.full_name_ar}
                    {d.title_ar ? ` — ${d.title_ar}` : ''}
                  </strong>
                  {d.is_primary ? <span className="tag" style={{ marginInlineStart: 8 }}>أساسي</span> : null}
                  {!d.is_active ? <span className="tag" style={{ marginInlineStart: 8 }}>موقوف</span> : null}
                  <p className="muted" style={{ fontSize: 12 }}>
                    {d.specialty ?? '—'}
                    {d.profile_id ? ' · مرتبط بحساب دخول' : ' · بدون حساب دخول'}
                  </p>
                </div>
                <span className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  <Button variant="outline" onClick={() => startEdit(d)}>
                    تعديل
                  </Button>
                  {!d.profile_id ? (
                    <Button variant="outline" onClick={() => startLink(d.id)}>
                      ربط بحساب
                    </Button>
                  ) : null}
                  <Button
                    variant={d.is_active ? 'danger' : 'outline'}
                    disabled={workingId === d.id}
                    onClick={() => void toggleActive(d)}
                  >
                    {d.is_active ? 'إيقاف الطبيب' : 'تفعيل الطبيب'}
                  </Button>
                </span>
              </div>

              {linkingId === d.id ? (
                <div className="row" style={{ gap: 8, marginBlockStart: 8, flexWrap: 'wrap' }}>
                  <select value={linkProfileId} onChange={(e) => setLinkProfileId(e.target.value)}>
                    <option value="">— اختر حساباً —</option>
                    {unlinked.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name ?? p.id} {p.phone ? `— ${p.phone}` : ''}
                      </option>
                    ))}
                  </select>
                  <Button disabled={!linkProfileId || linking} onClick={() => void submitLink()}>
                    {linking ? 'جارٍ الربط…' : 'ربط'}
                  </Button>
                  <Button variant="outline" onClick={() => setLinkingId(null)}>
                    إلغاء
                  </Button>
                  {!unlinked.length ? (
                    <span className="muted" style={{ fontSize: 12 }}>
                      لا توجد حسابات أطباء غير مرتبطة حالياً.
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          {!doctors.length ? <EmptyState icon="🩺" text="لا يوجد أطباء مُضافون بعد" /> : null}
        </div>
      ) : null}
    </Card>
  );
}
