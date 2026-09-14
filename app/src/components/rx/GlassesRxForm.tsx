/* -------------------------------------------------------------------------
 * GlassesRxForm — the refraction chart.
 * -------------------------------------------------------------------------
 * LAYOUT CONTRACT
 *
 * The chart is rendered inside <MedBlock>, which sets dir="ltr". Within it:
 *
 *   - the eye column is FIRST, and the rows run OD then OS, top to bottom
 *   - the value columns run SPH → CYL → AXIS → ADD, left to right
 *   - every numeric input isolates its own direction, so a typed '-' stays
 *     attached to the number it belongs to
 *
 * The Arabic headings and helper text sit OUTSIDE the block and stay RTL.
 * This is the whole point: the page does not change direction, the chart
 * does.
 *
 * OD = RIGHT eye. OS = LEFT eye. The state object below is keyed by those
 * labels, and the service tags each saved row with the same label. There is
 * no array index anywhere in the path, so no reordering — of columns, of
 * rows, or of the page — can swap the eyes.
 * ---------------------------------------------------------------------- */

import { useCallback, useState } from 'react';
import { MedBlock, MedInput, MedValue } from '../medical/Medical';
import { Button, Card } from '../ui';
import { useToast } from '../../hooks/useToast';
import * as rx from '../../services/prescriptions';
import { power, addPower as fmtAdd, axis as fmtAxis, pd as fmtPd, today } from '../../utils/medical';
import { EYE_AR, RX_EYE_ORDER, type Eye } from '../../types/domain';

interface EyeState {
  sphere: string;
  cylinder: string;
  axis: string;
}

const EMPTY_EYE: EyeState = { sphere: '', cylinder: '', axis: '' };

export interface GlassesRxFormProps {
  patientId: string;
  visitId?: string | null;
  examinationId?: string | null;
  doctorId?: string | null;
  clinicId?: string | null;
  onSaved?: (row: rx.PrescriptionRow) => void;
}

export function GlassesRxForm({
  patientId,
  visitId = null,
  examinationId = null,
  doctorId = null,
  clinicId = null,
  onSaved,
}: GlassesRxFormProps) {
  const toast = useToast();

  /* Keyed by eye label, never by position. */
  const [eyes, setEyes] = useState<Record<'OD' | 'OS', EyeState>>({
    OD: { ...EMPTY_EYE },
    OS: { ...EMPTY_EYE },
  });
  const [add, setAdd] = useState('');
  const [pdValue, setPdValue] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = useCallback(
    (eye: 'OD' | 'OS', field: keyof EyeState, value: string) => {
      setEyes((prev) => ({ ...prev, [eye]: { ...prev[eye], [field]: value } }));
    },
    [],
  );

  async function save() {
    /* Guard against a double submit: a second click while the first request
       is in flight would create two prescriptions for the same eyes. */
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const row = await rx.createGlasses({
        patientId,
        od: eyes.OD,
        os: eyes.OS,
        addPower: add,
        ipdMm: pdValue,
        prescribedOn: date,
        visitId,
        examinationId,
        doctorId,
        clinicId,
        notes,
      });
      toast.success('تم حفظ وصفة النظارة');
      setEyes({ OD: { ...EMPTY_EYE }, OS: { ...EMPTY_EYE } });
      setAdd('');
      setPdValue('');
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
    <Card title="وصفة نظارة">
      <p className="muted" style={{ fontSize: 12, marginBlockEnd: 10 }}>
        القياسات تُكتب بالترقيم الطبي من اليسار إلى اليمين. OD هي العين اليمنى
        وOS هي العين اليسرى.
      </p>

      {/* ── the LTR island ─────────────────────────────────────────── */}
      <MedBlock className="rx-chart">
        <table>
          <thead>
            <tr>
              <th>EYE</th>
              <th>SPH</th>
              <th>CYL</th>
              <th>AXIS</th>
            </tr>
          </thead>
          <tbody>
            {RX_EYE_ORDER.map((eye) => {
              const key = eye as 'OD' | 'OS';
              return (
                <tr key={key}>
                  <td className="rx-eye">
                    {key}
                    <small>{EYE_AR[eye as Eye]}</small>
                  </td>
                  <td>
                    <MedInput
                      label={`${key} SPH`}
                      value={eyes[key].sphere}
                      placeholder="+0.00"
                      onChange={(e) => setField(key, 'sphere', e.target.value)}
                    />
                  </td>
                  <td>
                    <MedInput
                      label={`${key} CYL`}
                      value={eyes[key].cylinder}
                      placeholder="-0.00"
                      onChange={(e) => setField(key, 'cylinder', e.target.value)}
                    />
                  </td>
                  <td>
                    <MedInput
                      label={`${key} AXIS`}
                      value={eyes[key].axis}
                      placeholder="0"
                      inputMode="numeric"
                      onChange={(e) => setField(key, 'axis', e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </MedBlock>

      <div className="grid-2" style={{ marginBlockStart: 12 }}>
        <label className="field">
          <span>الإضافة للقراءة (ADD)</span>
          <MedInput
            label="ADD"
            value={add}
            placeholder="+0.00"
            onChange={(e) => setAdd(e.target.value)}
          />
        </label>
        <label className="field">
          <span>المسافة بين الحدقتين (PD) — مم</span>
          <MedInput
            label="PD"
            value={pdValue}
            placeholder="62.0"
            onChange={(e) => setPdValue(e.target.value)}
          />
        </label>
      </div>

      <label className="field" style={{ marginBlockStart: 10 }}>
        <span>تاريخ الوصفة</span>
        <input
          type="date"
          dir="ltr"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      <label className="field" style={{ marginBlockStart: 10 }}>
        <span>ملاحظات</span>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {/* Live preview in exactly the form it will print. Reading back the
          formatted values is how a doctor catches a mistyped sign before it
          reaches the optician. */}
      <div style={{ marginBlockStart: 14 }}>
        <span className="muted" style={{ fontSize: 12 }}>
          معاينة الوصفة كما ستُطبع
        </span>
        <MedBlock className="rx-chart" >
          <table>
            <thead>
              <tr>
                <th>EYE</th>
                <th>SPH</th>
                <th>CYL</th>
                <th>AXIS</th>
                <th>ADD</th>
              </tr>
            </thead>
            <tbody>
              {RX_EYE_ORDER.map((eye) => {
                const key = eye as 'OD' | 'OS';
                return (
                  <tr key={key}>
                    <td className="rx-eye">{key}</td>
                    <td><MedValue>{power(eyes[key].sphere)}</MedValue></td>
                    <td><MedValue>{power(eyes[key].cylinder)}</MedValue></td>
                    <td><MedValue>{fmtAxis(eyes[key].axis)}</MedValue></td>
                    <td><MedValue>{add ? fmtAdd(add) : '—'}</MedValue></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </MedBlock>
        <p className="muted" style={{ fontSize: 12, marginBlockStart: 6 }}>
          PD: <MedValue>{pdValue ? fmtPd(pdValue) : '—'}</MedValue> مم
        </p>
      </div>

      {error ? <p className="alert" style={{ marginBlockStart: 10 }}>{error}</p> : null}

      <Button onClick={save} disabled={saving} style={{ marginBlockStart: 12 }}>
        {saving ? 'جارٍ الحفظ…' : 'حفظ وصفة النظارة'}
      </Button>
    </Card>
  );
}

export default GlassesRxForm;
