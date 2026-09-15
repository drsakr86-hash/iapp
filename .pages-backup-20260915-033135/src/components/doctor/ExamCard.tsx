/* -------------------------------------------------------------------------
 * ExamCard — one examination, expandable to its full findings.
 * -------------------------------------------------------------------------
 * Preserves the three acuity readings the legacy app records: uncorrected,
 * best corrected and pinhole. Pinhole is what separates a refractive deficit
 * from an organic one, so it is shown alongside the other two rather than
 * hidden behind a detail toggle.
 *
 * IOP above 21 is highlighted (models.iopHigh) — it must not be buried among
 * the other numbers.
 * ---------------------------------------------------------------------- */

import { useState } from 'react';
import * as examinations from '../../services/examinations';
import * as M from '../../utils/models';
import type { Examination } from '../../types/clinical';
import { Spinner } from '../ui';

function VaRow({ label, od, os }: { label: string; od: string | null; os: string | null }) {
  if (!od && !os) return null;
  return (
    <div className="kv">
      <span className="kv__k">{label}</span>
      <span className="kv__v">
        يمنى {od || '—'} · يسرى {os || '—'}
      </span>
    </div>
  );
}

export function ExamCard({ exam }: { exam: Examination }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState<Examination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (full) return;
    setLoading(true);
    setError(null);
    try {
      setFull(await examinations.getFull(exam.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const iopOd = exam._iop_od?.value_mmhg ?? null;
  const iopOs = exam._iop_os?.value_mmhg ?? null;
  const shown = full ?? exam;

  return (
    <div className="card">
      <button className="exam__head" onClick={() => void toggle()} aria-expanded={open}>
        <span className="exam__date">{M.fmtDay(exam.exam_date)}</span>
        <span className="exam__spacer" />
        {iopOd != null || iopOs != null ? (
          <span className="exam__iop">
            ضغط:{' '}
            <b style={{ color: M.iopHigh(iopOd) ? 'var(--danger)' : 'var(--text)' }}>
              {iopOd ?? '—'}
            </b>
            {' / '}
            <b style={{ color: M.iopHigh(iopOs) ? 'var(--danger)' : 'var(--text)' }}>
              {iopOs ?? '—'}
            </b>
          </span>
        ) : null}
        <span className="exam__chev">{open ? '▲' : '▼'}</span>
      </button>

      {exam.chief_complaint ? <div className="muted">{exam.chief_complaint}</div> : null}

      {open ? (
        <div className="exam__body">
          {loading ? <Spinner label="جارٍ قراءة الفحص…" /> : null}
          {error ? <p className="alert">{error}</p> : null}

          {!loading && !error ? (
            <>
              <VaRow label="بلا تصحيح UCVA" od={shown.va_right} os={shown.va_left} />
              <VaRow
                label="بأفضل تصحيح BCVA"
                od={shown.va_right_corrected}
                os={shown.va_left_corrected}
              />
              <VaRow label="بالثقب PH" od={shown.va_right_ph} os={shown.va_left_ph} />

              {full?._ref_od || full?._ref_os ? (
                <div className="kv">
                  <span className="kv__k">الانكسار</span>
                  <span className="kv__v" dir="ltr">
                    OD {M.diopter(full._ref_od?.sphere)} / {M.diopter(full._ref_od?.cylinder)} ×{' '}
                    {full._ref_od?.axis ?? '—'} · OS {M.diopter(full._ref_os?.sphere)} /{' '}
                    {M.diopter(full._ref_os?.cylinder)} × {full._ref_os?.axis ?? '—'}
                  </span>
                </div>
              ) : null}

              {full?._map
                ? (['anterior', 'posterior'] as const).map((section) => {
                    const defs = section === 'anterior' ? M.ANT_FIELDS : M.POST_FIELDS;
                    const rows = defs.filter(
                      (d) => full._map?.OD[d[0]] || full._map?.OS[d[0]] || full._map?.OU[d[0]],
                    );
                    if (!rows.length) return null;
                    return (
                      <div key={section} className="exam__section">
                        <h4 className="exam__sectionTitle">
                          {section === 'anterior' ? 'القطاع الأمامي' : 'القطاع الخلفي'}
                        </h4>
                        {rows.map((d) => (
                          <div className="kv" key={d[0]}>
                            <span className="kv__k">{d[1]}</span>
                            <span className="kv__v">
                              يمنى {full._map?.OD[d[0]] ?? '—'} · يسرى {full._map?.OS[d[0]] ?? '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })
                : null}

              {shown.anterior_segment ? (
                <div className="kv">
                  <span className="kv__k">ملاحظات أمامية</span>
                  <span className="kv__v">{shown.anterior_segment}</span>
                </div>
              ) : null}
              {shown.posterior_segment ? (
                <div className="kv">
                  <span className="kv__k">ملاحظات خلفية</span>
                  <span className="kv__v">{shown.posterior_segment}</span>
                </div>
              ) : null}
              {shown.treatment_plan ? (
                <div className="kv">
                  <span className="kv__k">الخطة العلاجية</span>
                  <span className="kv__v">{shown.treatment_plan}</span>
                </div>
              ) : null}
              {shown.notes ? (
                <div className="kv">
                  <span className="kv__k">ملاحظات</span>
                  <span className="kv__v">{shown.notes}</span>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
