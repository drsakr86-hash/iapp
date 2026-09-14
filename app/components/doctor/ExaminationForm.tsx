/* -------------------------------------------------------------------------
 * ExaminationForm — new examination, and edit of an existing one.
 * -------------------------------------------------------------------------
 * Payload shape traced field-by-field from v2/doctor.html examForm() so it
 * matches what examinations.createFull()/update() expect. Do not rename a key
 * here without changing the service: they are a contract.
 *
 * Two behaviours carried over from the legacy form deliberately:
 *
 *  1. IOP, refraction, diagnosis and follow-up are captured on CREATE only.
 *     Editing an exam edits the exam; it does not silently insert a second
 *     IOP reading or a duplicate diagnosis. The legacy form disables the IOP
 *     method control on edit for the same reason.
 *
 *  2. createFull is not atomic — PostgREST has no transaction over REST. The
 *     exam saves first and later failures come back as `warnings`. Those are
 *     surfaced verbatim and for longer than a normal toast, because "saved,
 *     but the IOP didn't store" is something the doctor must actually read.
 *
 * No <datalist> anywhere: it is broken on Android. Suggestions are a <select>
 * that writes into a free-text <input>, which is the legacy pattern.
 * ---------------------------------------------------------------------- */

import { useEffect, useState } from 'react';
import * as examinationsSvc from '../../services/examinations';
import * as M from '../../utils/models';
import type { Examination, Patient } from '../../types/clinical';
import type { Eye } from '../../types/domain';
import { useToast } from '../../hooks/useToast';
import { Button, Field, Input, Modal } from '../ui';
import { IOP_VALUES } from '../../config/fieldOptions';
import * as dropdownSvc from '../../services/dropdownOptions';

/** Free-text input with a suggestion list beside it. */
function Suggest({
  label,
  value,
  options,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <Field label={label}>
      <div className="suggest">
        <Input value={value} dir={dir} onChange={(e) => onChange(e.target.value)} />
        <select
          className="input suggest__pick"
          value=""
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          aria-label={`اقتراحات ${label}`}
        >
          <option value="">▾</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    </Field>
  );
}

type FindingState = Record<string, Record<string, string>>; // field -> eye -> value

export function ExaminationForm({
  patient,
  exam,
  visitId,
  doctorId,
  clinicId,
  onClose,
  onSaved,
}: {
  patient: Patient;
  exam?: Examination | null;
  visitId?: string | null;
  doctorId?: string | null;
  clinicId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const isNew = !exam;
  const [dynamicOptions, setDynamicOptions] = useState<dropdownSvc.DropdownOptionRow[]>([]);

  useEffect(() => {
    let active = true;
    dropdownSvc.listActive().then((options) => {
      if (active) setDynamicOptions(options);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const [f, setF] = useState<Record<string, string>>(() => ({
    exam_date: exam?.exam_date ?? M.today(),
    chief_complaint: exam?.chief_complaint ?? '',
    va_right: exam?.va_right ?? '',
    va_left: exam?.va_left ?? '',
    va_right_corrected: exam?.va_right_corrected ?? '',
    va_left_corrected: exam?.va_left_corrected ?? '',
    va_right_ph: exam?.va_right_ph ?? '',
    va_left_ph: exam?.va_left_ph ?? '',
    color_vision: exam?.color_vision ?? '',
    contrast_sensitivity: exam?.contrast_sensitivity ?? '',
    cover_test: exam?.cover_test ?? '',
    anterior_segment: exam?.anterior_segment ?? '',
    posterior_segment: exam?.posterior_segment ?? '',
    treatment_plan: exam?.treatment_plan ?? '',
    notes: exam?.notes ?? '',
    // create-only
    iop_right: '',
    iop_left: '',
    iop_method: '',
    iop_time: '',
    ref_od_sph: '',
    ref_od_cyl: '',
    ref_od_axis: '',
    ref_od_add: '',
    ref_os_sph: '',
    ref_os_cyl: '',
    ref_os_axis: '',
    ref_os_add: '',
    diagnosis_text: '',
    diagnosis_eye: '',
    follow_up_date: '',
    follow_up_reason: '',
  }));

  // Findings start from the existing map when editing, so a correction edits
  // the previous value rather than starting from blank.
  const [findings, setFindings] = useState<FindingState>(() => {
    const init: FindingState = {};
    const map = exam?._map;
    for (const def of [...M.ANT_FIELDS, ...M.POST_FIELDS]) {
      init[def[0]] = {
        OD: map?.OD?.[def[0]] ?? '',
        OS: map?.OS?.[def[0]] ?? '',
      };
    }
    return init;
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const setFinding = (field: string, eye: string, v: string) =>
    setFindings((p) => ({ ...p, [field]: { ...p[field], [eye]: v } }));

  /** "All normal" fills each field with its normal value, both eyes. */
  function allNormal(defs: typeof M.ANT_FIELDS) {
    setFindings((p) => {
      const next = { ...p };
      for (const d of defs) {
        const normal = d[0] === 'cd_ratio' ? '0.3' : d[2][0];
        next[d[0]] = { OD: normal, OS: normal };
      }
      return next;
    });
  }

  /** Flatten to the row-per-(eye,field) shape findings.replace() expects. */
  function readFindings() {
    const out: Array<{ eye: Eye; field: string; value: string }> = [];
    for (const field of Object.keys(findings)) {
      for (const eye of ['OD', 'OS'] as Eye[]) {
        const value = findings[field]?.[eye];
        if (value && value.trim()) out.push({ eye, field, value: value.trim() });
      }
    }
    return out;
  }

  async function save() {
    setError(null);

    const row: Record<string, unknown> = {
      patient_id: patient.id,
      doctor_id: doctorId ?? null,
      clinic_id: clinicId ?? null,
      exam_date: f.exam_date,
      chief_complaint: f.chief_complaint,
      va_right: f.va_right,
      va_left: f.va_left,
      va_right_corrected: f.va_right_corrected,
      va_left_corrected: f.va_left_corrected,
      va_right_ph: f.va_right_ph,
      va_left_ph: f.va_left_ph,
      color_vision: f.color_vision,
      contrast_sensitivity: f.contrast_sensitivity,
      cover_test: f.cover_test,
      anterior_segment: f.anterior_segment,
      posterior_segment: f.posterior_segment,
      treatment_plan: f.treatment_plan,
      notes: f.notes,
      findings: readFindings(),
    };

    if (isNew) {
      row.visit_id = visitId ?? null;
      row.iop_right = f.iop_right;
      row.iop_left = f.iop_left;
      row.iop_method = f.iop_method;
      if (f.iop_time) row.iop_at = f.exam_date + 'T' + f.iop_time + ':00';
      for (const k of ['od', 'os'] as const) {
        row[`ref_${k}_sph`] = f[`ref_${k}_sph`];
        row[`ref_${k}_cyl`] = f[`ref_${k}_cyl`];
        row[`ref_${k}_axis`] = f[`ref_${k}_axis`];
        row[`ref_${k}_add`] = f[`ref_${k}_add`];
      }
      row.diagnosis_text = f.diagnosis_text;
      row.diagnosis_eye = f.diagnosis_eye || null;
      row.follow_up_date = f.follow_up_date;
      row.follow_up_reason = f.follow_up_reason;
    }

    const chk = M.validateExam(row);
    if (!chk.ok) {
      setError(chk.errors[0]);
      return;
    }

    setBusy(true);
    try {
      if (isNew) {
        const r = await examinationsSvc.createFull(row);
        if (r.warnings.length) {
          // Partial success is not success. Shown long, and worded so it is
          // clear the exam itself did save.
          toast.error('حُفظ الفحص — لكن: ' + r.warnings.join(' · '));
        } else {
          toast.success('تم حفظ الفحص');
        }
      } else {
        await examinationsSvc.update(exam.id, row);
        toast.success('تم حفظ التعديل');
      }
      onSaved();
    } catch (e) {
      setError(M.dbError(e));
    } finally {
      setBusy(false);
    }
  }

  const VA_ROWS = [
    ['UCVA', 'va_right', 'va_left'],
    ['BCVA', 'va_right_corrected', 'va_left_corrected'],
    ['PH', 'va_right_ph', 'va_left_ph'],
  ] as const;

  const REF_ROWS = [
    ['SPH', 'sph'],
    ['CYL', 'cyl'],
    ['AXIS', 'axis'],
    ['ADD', 'add'],
  ] as const;

  /** One VA row for a single eye. */
  function vaRow(label: string, key: string) {
    return (
      <div className="exam2col__row" key={key}>
        <span className="exam2col__row-label">{label}</span>
        <div className="suggest">
          <Input value={f[key]} dir="ltr" onChange={(e) => set(key, e.target.value)} />
          <select
            className="input suggest__pick"
            value=""
            onChange={(e) => e.target.value && set(key, e.target.value)}
            aria-label={label}
          >
            <option value="">▾</option>
            {M.VA_VALUES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  /** One structured-finding row (anterior/posterior) for a single eye. */
  function findingRow(d: (typeof M.ANT_FIELDS)[number], eye: Eye) {
    return (
      <div className="exam2col__row" key={d[0]}>
        <span className="exam2col__row-label">{d[1]}</span>
        <div className="suggest">
          <Input
            value={findings[d[0]]?.[eye] ?? ''}
            onChange={(e) => setFinding(d[0], eye, e.target.value)}
          />
          <select
            className="input suggest__pick"
            value=""
            onChange={(e) => e.target.value && setFinding(d[0], eye, e.target.value)}
            aria-label={`${d[1]} ${eye}`}
          >
            <option value="">▾</option>
            {(dynamicOptions.filter((o) => o.field_key === `finding:${d[0]}`).map((o) => o.label_ar).length
              ? dynamicOptions.filter((o) => o.field_key === `finding:${d[0]}`).map((o) => o.label_ar)
              : d[2]).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  /** The full OD (left) or OS (right) panel — same sections, one eye each. */
  function eyeColumn(eye: Eye) {
    const refSide = eye === 'OD' ? 'od' : 'os';
    const iopKey = eye === 'OD' ? 'iop_right' : 'iop_left';

    return (
      <div className="exam2col__col" key={eye}>
        <h2 className="exam2col__eye-header">
          {eye} — {eye === 'OD' ? 'Right Eye' : 'Left Eye'}
        </h2>

        <h3 className="exam2col__section">Visual Acuity (VA)</h3>
        {VA_ROWS.map(([label, rk, lk]) => vaRow(label, eye === 'OD' ? rk : lk))}

        {isNew ? (
          <>
            <h3 className="exam2col__section">Intraocular Pressure (IOP)</h3>
            <div className="exam2col__row">
              <span className="exam2col__row-label">IOP (mmHg)</span>
              <div className="suggest">
                <Input
                  type="number"
                  min="0"
                  max="80"
                  step="1"
                  dir="ltr"
                  inputMode="decimal"
                  value={f[iopKey]}
                  onChange={(e) => set(iopKey, e.target.value)}
                />
                <select
                  className="input suggest__pick"
                  value=""
                  onChange={(e) => e.target.value && set(iopKey, e.target.value)}
                  aria-label={`${eye} IOP quick values`}
                >
                  <option value="">▾</option>
                  {IOP_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <h3 className="exam2col__section">Refraction</h3>
            {REF_ROWS.map(([label, part]) => (
              <div className="exam2col__row" key={part}>
                <span className="exam2col__row-label">{label}</span>
                <Input
                  type="number"
                  step={part === 'axis' ? '1' : '0.25'}
                  dir="ltr"
                  inputMode="decimal"
                  value={f[`ref_${refSide}_${part}`]}
                  onChange={(e) => set(`ref_${refSide}_${part}`, e.target.value)}
                />
              </div>
            ))}
          </>
        ) : null}

        <h3 className="exam2col__section">Anterior Segment</h3>
        {M.ANT_FIELDS.map((d) => findingRow(d, eye))}

        <h3 className="exam2col__section">Posterior Segment</h3>
        {M.POST_FIELDS.map((d) => findingRow(d, eye))}
      </div>
    );
  }

  return (
    <Modal
      title={isNew ? `فحص جديد — ${patient.full_name}` : 'تعديل الفحص'}
      onClose={onClose}
      wide
    >
      <div className="grid-2">
        <Field label="تاريخ الفحص *">
          <Input
            type="date"
            dir="ltr"
            value={f.exam_date}
            onChange={(e) => set('exam_date', e.target.value)}
          />
        </Field>
        <div />
      </div>

      <Suggest
        label="الشكوى الرئيسية"
        value={f.chief_complaint}
        options={dynamicOptions.filter((o) => o.field_key === 'complaint').map((o) => o.label_ar).length ? dynamicOptions.filter((o) => o.field_key === 'complaint').map((o) => o.label_ar) : M.COMPLAINTS}
        onChange={(v) => set('chief_complaint', v)}
      />

      {/* ── Clinical examination workspace: LTR, OD left / OS right ──── */}
      <div className="exam2col-wrap">
        <div className="exam2col-actions">
          <button className="chip" type="button" onClick={() => allNormal(M.ANT_FIELDS)}>
            Normal — Anterior (Both Eyes)
          </button>
          <button className="chip" type="button" onClick={() => allNormal(M.POST_FIELDS)}>
            Normal — Posterior (Both Eyes)
          </button>
        </div>

        <div className="exam2col">
          {eyeColumn('OD')}
          {eyeColumn('OS')}
        </div>

        {isNew ? (
          <div className="grid-2" style={{ marginBlockStart: 'var(--gap-sm)' }}>
            <Field label="IOP Method">
              <select
                className="input"
                value={f.iop_method}
                onChange={(e) => set('iop_method', e.target.value)}
              >
                <option value="">—</option>
                {(dynamicOptions.filter((o) => o.field_key === 'iop_method').map((o) => o.label_ar).length ? dynamicOptions.filter((o) => o.field_key === 'iop_method').map((o) => o.label_ar) : M.IOP_METHOD).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="IOP Time">
              <Input
                type="time"
                dir="ltr"
                value={f.iop_time}
                onChange={(e) => set('iop_time', e.target.value)}
              />
            </Field>
          </div>
        ) : null}
      </div>
      <p className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
        الثقب (PH) هو ما يفرّق بين ضعف انكساري وضعف عضوي — لا تتركه إن كان الإبصار منخفضاً. الطريقة
        والوقت جزء من قياس الضغط: قراءتان بجهازين مختلفين لا تُقارنان.
      </p>

      <Field label="ملاحظات القطاع الأمامي">
        <textarea
          className="input"
          rows={2}
          value={f.anterior_segment}
          onChange={(e) => set('anterior_segment', e.target.value)}
        />
      </Field>
      <Field label="ملاحظات القطاع الخلفي">
        <textarea
          className="input"
          rows={2}
          value={f.posterior_segment}
          onChange={(e) => set('posterior_segment', e.target.value)}
        />
      </Field>

      <div className="grid-2">
        <Suggest
          label="رؤية الألوان"
          value={f.color_vision}
          options={['طبيعي', 'غير طبيعي']}
          onChange={(v) => set('color_vision', v)}
        />
        <Suggest
          label="حساسية التباين"
          value={f.contrast_sensitivity}
          options={['طبيعي', 'منخفض']}
          onChange={(v) => set('contrast_sensitivity', v)}
        />
        <Suggest
          label="اختبار التغطية"
          value={f.cover_test}
          options={['طبيعي', 'إيجابي']}
          onChange={(v) => set('cover_test', v)}
        />
        <div />
      </div>

      {isNew ? (
        <>
          <h3 className="form__section">التشخيص والمتابعة</h3>
          <Suggest
            label="التشخيص"
            value={f.diagnosis_text}
            options={dynamicOptions.filter((o) => o.field_key === 'diagnosis').map((o) => o.label_ar).length ? dynamicOptions.filter((o) => o.field_key === 'diagnosis').map((o) => o.label_ar) : M.DIAGNOSES_LIST}
            onChange={(v) => set('diagnosis_text', v)}
          />
          <div className="grid-2">
            <Field label="العين">
              <select
                className="input"
                value={f.diagnosis_eye}
                onChange={(e) => set('diagnosis_eye', e.target.value)}
              >
                <option value="">—</option>
                {Object.entries(M.EYE_AR).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="موعد المتابعة">
              <Input
                type="date"
                dir="ltr"
                value={f.follow_up_date}
                onChange={(e) => set('follow_up_date', e.target.value)}
              />
            </Field>
          </div>
          <Field label="سبب المتابعة">
            <Input
              value={f.follow_up_reason}
              onChange={(e) => set('follow_up_reason', e.target.value)}
            />
          </Field>
        </>
      ) : null}

      <Suggest
        label="الخطة العلاجية"
        value={f.treatment_plan}
        options={dynamicOptions.filter((o) => o.field_key === 'treatment_plan').map((o) => o.label_ar).length ? dynamicOptions.filter((o) => o.field_key === 'treatment_plan').map((o) => o.label_ar) : M.PLANS}
        onChange={(v) => set('treatment_plan', v)}
      />
      <Field label="ملاحظات">
        <textarea
          className="input"
          rows={2}
          value={f.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </Field>

      {error ? <p className="alert">{error}</p> : null}

      <div className="row" style={{ marginBlockStart: 14 }}>
        <Button onClick={() => void save()} disabled={busy}>
          {busy ? 'جارٍ الحفظ…' : 'حفظ الفحص'}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={busy}>
          إلغاء
        </Button>
      </div>
    </Modal>
  );
}
