/* -------------------------------------------------------------------------
 * ImagingOrderForm — طلب أشعة / طلب فحص
 * -------------------------------------------------------------------------
 * An order is a header (patient, doctor, clinic, date, urgency, indication)
 * plus one to twelve requested studies. The doctor_id is resolved from the
 * signed-in user through services/doctors.mine() by the parent screen and
 * passed in; this form never guesses it and never hard-codes it.
 * ---------------------------------------------------------------------- */

import { useState } from 'react';
import { Button, Card } from '../ui';
import { MedValue } from '../medical/Medical';
import { useToast } from '../../hooks/useToast';
import * as imaging from '../../services/imaging';
import { today } from '../../utils/medical';
import {
  EYE_AR,
  MODALITIES,
  MODALITY_AR,
  URGENCY_AR,
  type Eye,
  type Modality,
  type Urgency,
} from '../../types/domain';

interface ItemState {
  modality: Modality | '';
  eye: Eye | '';
  notes: string;
}

const BLANK: ItemState = { modality: '', eye: 'OU', notes: '' };

export interface ImagingOrderFormProps {
  patientId: string;
  visitId?: string | null;
  doctorId?: string | null;
  clinicId?: string | null;
  onCreated?: (order: imaging.ImagingOrder) => void;
}

export function ImagingOrderForm({
  patientId,
  visitId = null,
  doctorId = null,
  clinicId = null,
  onCreated,
}: ImagingOrderFormProps) {
  const toast = useToast();
  const [items, setItems] = useState<ItemState[]>([{ ...BLANK }]);
  const [orderedOn, setOrderedOn] = useState(today());
  const [urgency, setUrgency] = useState<Urgency>('routine');
  const [indication, setIndication] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, patch: Partial<ItemState>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const order = await imaging.createOrder({
        patientId,
        visitId,
        doctorId,
        clinicId,
        orderedOn,
        urgency,
        clinicalIndication: indication,
        clinicalNotes: notes,
        items: items
          .filter((it) => it.modality)
          .map((it) => ({
            modality: it.modality as Modality,
            eye: (it.eye || 'OU') as Eye,
            notes: it.notes,
          })),
      });
      toast.success('تم حفظ طلب الأشعة');
      setItems([{ ...BLANK }]);
      setIndication('');
      setNotes('');
      onCreated?.(order);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'تعذّر حفظ الطلب';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="طلب أشعة / فحص">
      <div className="grid-2">
        <label className="field">
          <span className="field__label">تاريخ الطلب</span>
          <input
            type="date"
            dir="ltr"
            value={orderedOn}
            onChange={(e) => setOrderedOn(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">درجة الاستعجال</span>
          <select value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
            {(Object.keys(URGENCY_AR) as Urgency[]).map((u) => (
              <option key={u} value={u}>
                {URGENCY_AR[u]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span className="field__label">الدلالة الإكلينيكية</span>
        <input
          type="text"
          value={indication}
          placeholder="سبب طلب الفحص"
          onChange={(e) => setIndication(e.target.value)}
        />
      </label>

      <p className="muted" style={{ fontSize: 12, marginBlockStart: 10 }}>
        الدراسات المطلوبة — حتى اثنتي عشرة دراسة
      </p>

      {items.map((it, i) => (
        <div className="rx-med" key={i}>
          <label className="field">
            <span className="field__label">
              الدراسة <MedValue>#{i + 1}</MedValue>
            </span>
            <select
              value={it.modality}
              onChange={(e) => update(i, { modality: e.target.value as Modality })}
            >
              <option value="">— اختر نوع التصوير —</option>
              {MODALITIES.map((m) => (
                <option key={m} value={m}>
                  {MODALITY_AR[m]}
                </option>
              ))}
            </select>
          </label>

          <div className="grid-2">
            <label className="field">
              <span className="field__label">العين</span>
              <select value={it.eye} onChange={(e) => update(i, { eye: e.target.value as Eye })}>
                {(['OD', 'OS', 'OU'] as Eye[]).map((e) => (
                  <option key={e} value={e}>
                    {e} — {EYE_AR[e]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">ملاحظة</span>
              <input
                type="text"
                value={it.notes}
                onChange={(e) => update(i, { notes: e.target.value })}
              />
            </label>
          </div>

          {items.length > 1 ? (
            <Button
              variant="outline"
              onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
            >
              حذف
            </Button>
          ) : null}
        </div>
      ))}

      {items.length < 12 ? (
        <Button
          variant="outline"
          onClick={() => setItems((prev) => [...prev, { ...BLANK }])}
          style={{ marginBlockStart: 10 }}
        >
          + إضافة دراسة
        </Button>
      ) : null}

      <label className="field" style={{ marginBlockStart: 10 }}>
        <span className="field__label">ملاحظات إكلينيكية</span>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {error ? <p className="alert">{error}</p> : null}

      <Button onClick={save} disabled={saving} style={{ marginBlockStart: 12 }}>
        {saving ? 'جارٍ الحفظ…' : 'حفظ الطلب'}
      </Button>
    </Card>
  );
}

export default ImagingOrderForm;
