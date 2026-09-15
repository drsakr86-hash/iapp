import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import * as dropdownSvc from '../../services/dropdownOptions';
import * as rx from '../../services/prescriptions';
import {
  SERVICE_CATEGORIES,
  MEDICATION_DURATIONS,
  MEDICATION_FREQUENCIES,
  IOP_METHOD_OPTIONS,
} from '../../config/fieldOptions';
import * as M from '../../utils/models';

const GROUPS = [
  { key: 'complaint', label: 'الشكوى الرئيسية', fallback: M.COMPLAINTS },
  { key: 'diagnosis', label: 'التشخيص', fallback: M.DIAGNOSES_LIST },
  { key: 'treatment_plan', label: 'الخطة العلاجية', fallback: M.PLANS },
  { key: 'iop_method', label: 'طريقة قياس ضغط العين', fallback: IOP_METHOD_OPTIONS.map((x) => x.value) },
  { key: 'med_frequency', label: 'تكرار الدواء', fallback: [...MEDICATION_FREQUENCIES] },
  { key: 'med_duration', label: 'مدة الدواء', fallback: [...MEDICATION_DURATIONS] },
  { key: 'service_category', label: 'فئات الخدمات', fallback: [...SERVICE_CATEGORIES] },
  ...M.ANT_FIELDS.map((f) => ({ key: `finding:${f[0]}`, label: f[1], fallback: f[2] })),
  ...M.POST_FIELDS.map((f) => ({ key: `finding:${f[0]}`, label: f[1], fallback: f[2] })),
] as const;

export default function DropdownSettings() {
  useDocumentTitle('إدارة القوائم');
  const toast = useToast();
  const [remote, setRemote] = useState<dropdownSvc.DropdownOptionRow[]>([]);
  const [catalogue, setCatalogue] = useState<rx.MedicationOption[]>([]);
  const [medLoading, setMedLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>(GROUPS[0].key);
  const [newValue, setNewValue] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newMed, setNewMed] = useState({ name: '', nameAr: '', genericName: '', strength: '', form: 'drop' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRemote(await dropdownSvc.listAll());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تحميل القوائم');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadMeds = useCallback(async () => {
    setMedLoading(true);
    try {
      setCatalogue(await rx.medications());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذّر تحميل الأدوية');
    } finally {
      setMedLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); void loadMeds(); }, [load, loadMeds]);

  const activeGroup = GROUPS.find((g) => g.key === selectedGroup) ?? GROUPS[0];
  const rowsForGroup = useMemo(() => remote.filter((r) => r.field_key === selectedGroup), [remote, selectedGroup]);
  const displayRows = rowsForGroup.length
    ? rowsForGroup
    : activeGroup.fallback.map((v, i) => ({ id: `fallback-${selectedGroup}-${i}`, field_key: selectedGroup, value: v, label_ar: v, label_en: null, sort_order: i, is_active: true }));

  async function addOption() {
    const value = newValue.trim();
    if (!value) return;
    try {
      await dropdownSvc.create({ fieldKey: selectedGroup, value, labelAr: value, sortOrder: rowsForGroup.length + 1 });
      setNewValue('');
      await load();
      toast.success('تمت إضافة العنصر');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'تعذّرت الإضافة'); }
  }

  async function toggle(row: dropdownSvc.DropdownOptionRow) {
    if (row.id.startsWith('fallback-')) {
      toast.error('هذا عنصر افتراضي. أضف نسخة مخصصة جديدة ثم أوقفها عند الحاجة.');
      return;
    }
    if (busyId) return;
    setBusyId(row.id);
    try { await dropdownSvc.setActive(row.id, !row.is_active); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'تعذّر تحديث العنصر'); }
    finally { setBusyId(null); }
  }

  async function addMedication() {
    const name = newMed.name.trim();
    if (!name) { toast.error('اسم الدواء مطلوب'); return; }
    // The DB has no uniqueness constraint on medications.name, so this
    // check is the only thing preventing an accidental exact duplicate in
    // the active catalogue (e.g. a double-tap on "إضافة"). It only sees
    // currently active medications — an inactive one with the same name
    // is intentionally not flagged, since reusing a deactivated name is
    // a normal way to bring a medication back under the same identity.
    if (catalogue.some((m) => m.name.trim().toLowerCase() === name.toLowerCase())) {
      toast.error('يوجد دواء بنفس الاسم في القائمة الفعّالة بالفعل');
      return;
    }
    try {
      await rx.createMedication({
        name: newMed.name,
        nameAr: newMed.nameAr,
        genericName: newMed.genericName,
        strength: newMed.strength,
        form: newMed.form,
      });
      setNewMed({ name: '', nameAr: '', genericName: '', strength: '', form: 'drop' });
      await loadMeds();
      toast.success('تمت إضافة الدواء إلى القائمة');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'تعذّرت إضافة الدواء'); }
  }

  async function toggleMedication(id: string, active: boolean) {
    setBusyId(id);
    try { await rx.setMedicationActive(id, !active); await loadMeds(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'تعذّر تحديث الدواء'); }
    finally { setBusyId(null); }
  }

  return (
    <div className="stack">
      <Card title="إدارة القوائم المنسدلة">
        <p className="muted" style={{ fontSize: 12 }}>
          يمكن إضافة عناصر جديدة، و"حذف" العنصر هنا يعني إيقافه حتى لا يظهر للاستخدام الجديد، مع بقاء السجلات التاريخية كما هي.
        </p>
        <div className="grid-2">
          <label className="field">
            <span className="field__label">نوع القائمة</span>
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
              {GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field__label">إضافة عنصر</span>
            <div className="row" style={{ gap: 6 }}>
              <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="اكتب العنصر" />
              <Button onClick={() => void addOption()}>+ إضافة</Button>
            </div>
          </label>
        </div>
      </Card>

      {loading ? <Spinner label="جارٍ تحميل القوائم…" /> : null}
      {!loading ? (
        <Card title={activeGroup.label}>
          <div className="stack" style={{ gap: 6 }}>
            {displayRows.map((row) => (
              <div key={row.id} className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{row.label_ar}{row.label_en ? ` — ${row.label_en}` : ''}</span>
                {!row.id.startsWith('fallback-') ? (
                  <Button
                    variant={row.is_active ? 'danger' : 'outline'}
                    disabled={busyId === row.id}
                    onClick={() => void toggle(row)}
                  >
                    {row.is_active ? 'حذف من القائمة' : 'إعادة تفعيل'}
                  </Button>
                ) : <span className="muted">افتراضي</span>}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card title="قائمة الأدوية المحفوظة">
        <div className="grid-2">
          <label className="field"><span className="field__label">اسم الدواء *</span><input value={newMed.name} dir="ltr" onChange={(e) => setNewMed((m) => ({ ...m, name: e.target.value }))} /></label>
          <label className="field"><span className="field__label">الاسم بالعربية</span><input value={newMed.nameAr} onChange={(e) => setNewMed((m) => ({ ...m, nameAr: e.target.value }))} /></label>
          <label className="field"><span className="field__label">الاسم العلمي</span><input value={newMed.genericName} dir="ltr" onChange={(e) => setNewMed((m) => ({ ...m, genericName: e.target.value }))} /></label>
          <label className="field"><span className="field__label">التركيز</span><input value={newMed.strength} dir="ltr" onChange={(e) => setNewMed((m) => ({ ...m, strength: e.target.value }))} /></label>
          <label className="field"><span className="field__label">الشكل الدوائي</span><select value={newMed.form} onChange={(e) => setNewMed((m) => ({ ...m, form: e.target.value }))}><option value="drop">قطرة</option><option value="ointment">مرهم</option><option value="tablet">قرص</option><option value="capsule">كبسولة</option><option value="injection">حقن</option><option value="gel">جل</option><option value="other">أخرى</option></select></label>
          <div style={{ alignSelf: 'end' }}><Button onClick={() => void addMedication()}>+ حفظ الدواء</Button></div>
        </div>

        {medLoading ? <Spinner label="جارٍ تحميل الأدوية…" /> : null}
        {!medLoading ? (
          <div className="stack" style={{ gap: 6, marginBlockStart: 12 }}>
            {catalogue.map((m) => (
              <div className="row" key={m.id} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span><strong>{m.name}</strong>{m.name_ar ? ` — ${m.name_ar}` : ''}{m.strength ? ` — ${m.strength}` : ''}</span>
                <Button variant={m.is_active === false ? 'outline' : 'danger'} disabled={busyId === m.id} onClick={() => void toggleMedication(m.id, m.is_active !== false)}>
                  {m.is_active === false ? 'إعادة تفعيل' : 'حذف من القائمة'}
                </Button>
              </div>
            ))}
            {!catalogue.length ? <EmptyState icon="💊" text="لا توجد أدوية محفوظة بعد." /> : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
