/* -------------------------------------------------------------------------
 * MedicationRxForm — drug prescription.
 * -------------------------------------------------------------------------
 * DIRECTION CONTRACT
 *
 * A drug line mixes scripts: an Arabic instruction wrapped around a Latin
 * drug name and a numeric dose. Left in a single RTL run, "Latanoprost
 * 0.005% 1 drop" reorders into nonsense and the strength can end up beside
 * the wrong token.
 *
 * So each Latin/numeric run is isolated with <MedText> / <MedValue> while
 * the Arabic frequency and duration stay in page direction. The FORM stays
 * RTL; only the values inside it are LTR.
 *
 * The drug name input is a <select> of the catalogue plus a free-text
 * <input>, never a <datalist> — Android does not render datalist reliably
 * and the combination silently degrades to a plain text box on the devices
 * the clinic actually uses.
 * ---------------------------------------------------------------------- */

import { useEffect, useState } from 'react';
import { MedInput, MedText, MedValue } from '../medical/Medical';
import { Button, Card } from '../ui';
import { useToast } from '../../hooks/useToast';
import * as rx from '../../services/prescriptions';
import { today } from '../../utils/medical';
import { EYE_AR, type Eye } from '../../types/domain';
import * as dropdownSvc from '../../services/dropdownOptions';
import { MEDICATION_DURATIONS, MEDICATION_FREQUENCIES } from '../../config/fieldOptions';

interface Line {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  eye: Eye | '';
}

const BLANK: Line = { name: '', dose: '', frequency: '', duration: '', eye: '' };

/** Common ophthalmic frequencies, written the way they are prescribed. */
const FREQUENCIES = [...MEDICATION_FREQUENCIES];

export interface MedicationRxFormProps {
  patientId: string;
  visitId?: string | null;
  doctorId?: string | null;
  clinicId?: string | null;
  onSaved?: (row: rx.PrescriptionRow) => void;
}

export function MedicationRxForm({
  patientId,
  visitId = null,
  doctorId = null,
  clinicId = null,
  onSaved,
}: MedicationRxFormProps) {
  const toast = useToast();
  const [lines, setLines] = useState<Line[]>([{ ...BLANK }]);
  const [catalogue, setCatalogue] = useState<rx.MedicationOption[]>([]);
  const [dynamic, setDynamic] = useState<dropdownSvc.DropdownOptionRow[]>([]);
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([rx.medications(), dropdownSvc.listActive()])
      .then(([m, options]) => { if (!active) return; setCatalogue(m); setDynamic(options); })
      .catch(() => {
        /* the catalogue is a convenience; free text still works without it */
      });
    return () => {
      active = false;
    };
  }, []);

  function update(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { ...BLANK }]);
  }

  function removeLine(i: number) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const row = await rx.createDrugs({
        patientId,
        visitId,
        doctorId,
        clinicId,
        prescribedOn: date,
        notes,
        items: lines
          .filter((l) => l.name.trim().length > 1)
          .map((l) => ({
            name: l.name,
            dose: l.dose,
            frequency: l.frequency,
            duration: l.duration,
            eye: l.eye || null,
          })),
      });
      toast.success('تم حفظ وصفة الأدوية');
      setLines([{ ...BLANK }]);
      setNotes('');
      onSaved?.(row);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'تعذّر حفظ الوصفة';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="وصفة أدوية">
      {lines.map((line, i) => (
        <div className="rx-med" key={i}>
          <div className="grid-2">
            <label className="field">
              <span className="field__label">اسم الدواء</span>
              {/* select + free input, never <datalist> */}
              <select
                value={catalogue.some((m) => m.name === line.name) ? line.name : ''}
                onChange={(e) => e.target.value && update(i, { name: e.target.value })}
              >
                <option value="">— اختر من القائمة —</option>
                {catalogue.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name_ar ? `${m.name_ar} — ${m.name}` : m.name}{m.strength ? ` — ${m.strength}` : ''}
                  </option>
                ))}
              </select>
              <MedInput
                label="drug name"
                value={line.name}
                placeholder="or type the drug name"
                inputMode="text"
                onChange={(e) => update(i, { name: e.target.value })}
              />
            </label>

            <label className="field">
              <span className="field__label">الجرعة</span>
              <MedInput
                label="dose"
                value={line.dose}
                placeholder="1 drop"
                inputMode="text"
                onChange={(e) => update(i, { dose: e.target.value })}
              />
            </label>
          </div>

          <div className="grid-2">
            <label className="field">
              <span className="field__label">التكرار</span>
              <select
                value={line.frequency}
                onChange={(e) => update(i, { frequency: e.target.value })}
              >
                <option value="">— اختر —</option>
                {(dynamic.filter((o) => o.field_key === 'med_frequency').map((o) => o.label_ar).length ? dynamic.filter((o) => o.field_key === 'med_frequency').map((o) => o.label_ar) : FREQUENCIES).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">المدة</span>
              <select value={line.duration} onChange={(e) => update(i, { duration: e.target.value })}>
                <option value="">— اختر —</option>
                {(dynamic.filter((o) => o.field_key === 'med_duration').map((o) => o.label_ar).length ? dynamic.filter((o) => o.field_key === 'med_duration').map((o) => o.label_ar) : MEDICATION_DURATIONS).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span className="field__label">العين</span>
            <select
              value={line.eye}
              onChange={(e) => update(i, { eye: e.target.value as Eye | '' })}
            >
              <option value="">— غير محدد —</option>
              {(['OD', 'OS', 'OU'] as Eye[]).map((e) => (
                <option key={e} value={e}>
                  {e} — {EYE_AR[e]}
                </option>
              ))}
            </select>
          </label>

          {/* Preview of the line as it will be printed. The drug name and
              dose read left-to-right; the Arabic duration does not. */}
          {line.name ? (
            <p className="rx-med__sig">
              <MedText>{line.name}</MedText>
              {line.dose ? <> — <MedValue>{line.dose}</MedValue></> : null}
              {line.eye ? <> — <MedValue>{line.eye}</MedValue></> : null}
              {line.frequency ? <> — {line.frequency}</> : null}
              {line.duration ? <> — {line.duration}</> : null}
            </p>
          ) : null}

          {lines.length > 1 ? (
            <Button variant="outline" onClick={() => removeLine(i)} style={{ marginBlockStart: 8 }}>
              حذف هذا السطر
            </Button>
          ) : null}
        </div>
      ))}

      <Button variant="outline" onClick={addLine} style={{ marginBlockStart: 10 }}>
        + إضافة دواء
      </Button>

      <label className="field" style={{ marginBlockStart: 10 }}>
        <span className="field__label">تاريخ الوصفة</span>
        <input type="date" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <label className="field" style={{ marginBlockStart: 10 }}>
        <span className="field__label">ملاحظات</span>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {error ? <p className="alert" style={{ marginBlockStart: 10 }}>{error}</p> : null}

      <Button onClick={save} disabled={saving} style={{ marginBlockStart: 12 }}>
        {saving ? 'جارٍ الحفظ…' : 'حفظ وصفة الأدوية'}
      </Button>
    </Card>
  );
}

export default MedicationRxForm;
