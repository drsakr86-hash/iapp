/* -------------------------------------------------------------------------
 * ComparisonView — this examination against the one before it.
 * -------------------------------------------------------------------------
 * Ported from emrRows() in v2/doctor.html. The row ORDER is clinical, not
 * database column order: acuity → refraction → pressure → anterior →
 * posterior. That sequence is how the examination is actually performed, and
 * reordering it to match the table would make the comparison harder to read.
 *
 * Values that changed are highlighted. A row where both visits are empty is
 * dropped entirely — an all-dashes table hides the three rows that matter.
 * ---------------------------------------------------------------------- */

import { useEffect, useState } from 'react';
import * as examinationsSvc from '../../services/examinations';
import * as M from '../../utils/models';
import type { Examination } from '../../types/clinical';
import { EmptyState, Spinner } from '../ui';

interface Row {
  label: string;
  cur: string;
  prev: string;
}

function val(v: unknown): string {
  if (v == null || v === '') return '';
  return String(v);
}

function buildRows(cur: Examination | null, prev: Examination | null): Row[] {
  const rows: Row[] = [];
  const add = (label: string, a: unknown, b: unknown) => {
    const A = val(a);
    const B = val(b);
    if (!A && !B) return; // both empty — not a comparison
    rows.push({ label, cur: A || '—', prev: B || '—' });
  };

  add('بلا تصحيح — يمنى', cur?.va_right, prev?.va_right);
  add('بلا تصحيح — يسرى', cur?.va_left, prev?.va_left);
  add('بأفضل تصحيح — يمنى', cur?.va_right_corrected, prev?.va_right_corrected);
  add('بأفضل تصحيح — يسرى', cur?.va_left_corrected, prev?.va_left_corrected);
  add('بالثقب — يمنى', cur?.va_right_ph, prev?.va_right_ph);
  add('بالثقب — يسرى', cur?.va_left_ph, prev?.va_left_ph);

  add('ضغط — يمنى', cur?._iop_od?.value_mmhg, prev?._iop_od?.value_mmhg);
  add('ضغط — يسرى', cur?._iop_os?.value_mmhg, prev?._iop_os?.value_mmhg);

  for (const defs of [M.ANT_FIELDS, M.POST_FIELDS]) {
    for (const d of defs) {
      add(`${d[1]} — يمنى`, cur?._map?.OD?.[d[0]], prev?._map?.OD?.[d[0]]);
      add(`${d[1]} — يسرى`, cur?._map?.OS?.[d[0]], prev?._map?.OS?.[d[0]]);
    }
  }

  add('الخطة', cur?.treatment_plan, prev?.treatment_plan);
  return rows;
}

export function ComparisonView({ patientId }: { patientId: string }) {
  const [cur, setCur] = useState<Examination | null>(null);
  const [prev, setPrev] = useState<Examination | null>(null);
  const [all, setAll] = useState<Examination[]>([]);
  const [pick, setPick] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    examinationsSvc
      .comparePair(patientId, pick)
      .then((r) => {
        if (!active) return;
        setCur(r.cur);
        setPrev(r.prev);
        setAll(r.all);
        setError(null);
      })
      .catch((e: Error) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [patientId, pick]);

  if (loading) return <Spinner label="جارٍ بناء المقارنة…" />;
  if (error) return <p className="alert">{error}</p>;
  if (!cur) return <EmptyState icon="📊" text="لا فحوصات للمقارنة" />;
  if (!prev) return <EmptyState icon="📊" text="فحص واحد فقط — لا يوجد فحص سابق للمقارنة" />;

  const rows = buildRows(cur, prev);

  return (
    <div className="stack">
      <select className="input" value={pick ?? all[0]?.id} onChange={(e) => setPick(e.target.value)}>
        {all.map((e) => (
          <option key={e.id} value={e.id}>
            {M.fmtDay(e.exam_date)}
          </option>
        ))}
      </select>

      <div className="cmp">
        <div className="cmp__row cmp__row--head">
          <span />
          <span>{M.fmtDay(cur.exam_date)}</span>
          <span className="muted">{M.fmtDay(prev.exam_date)}</span>
        </div>
        {rows.map((r, i) => {
          const changed = r.cur !== r.prev;
          return (
            <div className={'cmp__row' + (changed ? ' cmp__row--changed' : '')} key={i}>
              <span className="cmp__label">{r.label}</span>
              <span style={changed ? { color: 'var(--accent)', fontWeight: 600 } : undefined}>
                {r.cur}
              </span>
              <span className="muted">{r.prev}</span>
            </div>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
        المميّز بالأزرق تغيّر عن الفحص السابق. الصفوف الفارغة في الفحصين محذوفة.
      </p>
    </div>
  );
}
