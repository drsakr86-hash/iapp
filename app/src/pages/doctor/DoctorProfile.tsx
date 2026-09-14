/* -------------------------------------------------------------------------
 * DoctorProfile — editing the doctor display name.
 * -------------------------------------------------------------------------
 * The form is seeded from the shared doctor context and saves back through
 * it. It holds draft text in local state (an input must be controlled), but
 * the moment the save succeeds the context becomes the source of truth
 * again — the draft is not kept as a second copy of the name.
 * ---------------------------------------------------------------------- */

import { useEffect, useState } from 'react';
import { Button, Card } from '../../components/ui';
import { MedText } from '../../components/medical/Medical';
import { DoctorManagement } from '../../components/doctor/DoctorManagement';
import { useDoctor } from '../../hooks/useDoctor';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function DoctorProfile() {
  useDocumentTitle('ملف الطبيب');
  const { doctor, displayName, loading, error } = useDoctor();
  const { rename } = useDoctor();
  const { profile } = useAuth();
  const toast = useToast();

  const [nameAr, setNameAr] = useState('');
  const [title, setTitle] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  /* Seed the draft once the record arrives. */
  useEffect(() => {
    /* Seeding an editable draft from asynchronously-loaded server state.
       The draft is local by necessity: an input must be controlled. */
    if (!doctor) return;
    // oxlint-disable-next-line react/set-state-in-effect
    setNameAr(doctor.full_name_ar ?? '');
    setTitle(doctor.title_ar ?? '');
    setNameEn(doctor.full_name_en ?? '');
  }, [doctor]);

  async function save() {
    if (saving) return;
    setSaving(true);
    setProblem(null);
    try {
      await rename({ full_name_ar: nameAr, title_ar: title, full_name_en: nameEn });
      toast.success('تم حفظ الاسم — سيظهر في كل الشاشات والوصفات');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'تعذّر حفظ الاسم';
      setProblem(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Card title="ملف الطبيب"><p className="muted">جارٍ التحميل…</p></Card>;

  if (!doctor) {
    return (
      <div className="stack">
        <Card title="ملف الطبيب">
          <p className="alert">
            لا يوجد سجل طبيب مرتبط بهذا الحساب في جدول iapp.doctors.
          </p>
          <p className="muted" style={{ fontSize: 12 }}>
            الاسم المعروض حالياً مأخوذ من ملف الحساب: <strong>{displayName}</strong>.
            لتعديله يجب ربط الحساب بسجل طبيب عبر العمود profile_id.
          </p>
          {error ? <p className="alert">{error}</p> : null}
        </Card>

        <DoctorManagement />
      </div>
    );
  }

  return (
    <div className="stack">
      <Card title="الاسم المعروض">
        <p className="muted" style={{ fontSize: 12 }}>
          هذا الاسم يظهر في لوحة الطبيب، الوصفات، التقارير، ونماذج الفحص —
          كلها تقرأ من هنا.
        </p>

        <label className="field">
          <span className="field__label">اللقب</span>
          <input type="text" value={title} placeholder="د." onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label className="field">
          <span className="field__label">الاسم بالعربية</span>
          <input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        </label>

        <label className="field">
          <span className="field__label">الاسم بالإنجليزية (للطباعة)</span>
          <input
            type="text"
            dir="ltr"
            className="med-text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
          />
        </label>

        <p className="muted" style={{ fontSize: 12 }}>
          المعاينة: <strong>{[title.trim(), nameAr.trim()].filter(Boolean).join(' ') || '—'}</strong>
          {nameEn.trim() ? <> — <MedText>{nameEn.trim()}</MedText></> : null}
        </p>

        {problem ? <p className="alert">{problem}</p> : null}

        <Button onClick={save} disabled={saving || nameAr.trim().length < 3}>
          {saving ? 'جارٍ الحفظ…' : 'حفظ الاسم'}
        </Button>
      </Card>

      <Card title="بيانات الحساب">
        <p className="muted" style={{ fontSize: 12 }}>
          البريد: <MedText>{profile?.email ?? '—'}</MedText>
        </p>
        <p className="muted" style={{ fontSize: 12 }}>
          رقم الترخيص: <MedText>{doctor.license_no ?? '—'}</MedText>
        </p>
      </Card>

      <DoctorManagement />
    </div>
  );
}
