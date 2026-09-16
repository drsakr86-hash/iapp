/* -------------------------------------------------------------------------
 * ExaminationSection — visual acuity, IOP, refraction, anterior/posterior.
 * -------------------------------------------------------------------------
 * OD is rendered first (left column of an LTR grid), OS second (right
 * column) — the same rule ExaminationForm.tsx uses for the live exam
 * screen. Every value is looked up by its own `eye` tag, never by row or
 * array position. This holds regardless of report language: only labels
 * translate, the OD/OS layout itself never changes.
 * ---------------------------------------------------------------------- */

import { MedBlock } from '../../medical/Medical';
import * as M from '../../../utils/models';
import { addPower, axis as fmtAxis, cylinder as fmtCyl, sphere as fmtSphere } from '../../../utils/medical';
import type { Eye } from '../../../types/domain';
import type { Examination } from '../../../types/clinical';
import { RL, fieldLabel, findingValue, label, type ReportLang } from '../../../i18n/report';
import { EYES, EYE_EN_LABEL, Row, Section } from './shared';

export function examinationHasContent(exam: Examination | null): exam is Examination {
  if (!exam) return false;
  return EYES.some((eye) => {
    const map = exam._map?.[eye] ?? {};
    return (
      (eye === 'OD' ? exam.va_right : exam.va_left) ||
      (eye === 'OD' ? exam._iop_od : exam._iop_os)?.value_mmhg != null ||
      (eye === 'OD' ? exam._ref_od : exam._ref_os)?.sphere != null ||
      Object.keys(map).length > 0
    );
  });
}

function EyeColumn({ eye, exam, lang }: { eye: Eye; exam: Examination; lang: ReportLang }) {
  const iop = eye === 'OD' ? exam._iop_od : exam._iop_os;
  const ref = eye === 'OD' ? exam._ref_od : exam._ref_os;
  const vaUnaided = eye === 'OD' ? exam.va_right : exam.va_left;
  const vaCorrected = eye === 'OD' ? exam.va_right_corrected : exam.va_left_corrected;
  const vaPh = eye === 'OD' ? exam.va_right_ph : exam.va_left_ph;
  const map = exam._map?.[eye] ?? {};

  const hasVA = vaUnaided || vaCorrected || vaPh;
  const hasRef =
    ref && (ref.sphere != null || ref.cylinder != null || ref.axis != null || ref.add_power != null);
  const anterior = M.ANT_FIELDS.map((d) => [d[0], d[1], map[d[0]]] as const).filter(([, , v]) => v);
  const posterior = M.POST_FIELDS.map((d) => [d[0], d[1], map[d[0]]] as const).filter(([, , v]) => v);

  return (
    <div className="medical-report__eye-col">
      <div className="medical-report__eye-head">
        {eye} — {EYE_EN_LABEL[eye]}
      </div>

      {hasVA ? (
        <>
          <Row label={label(RL.unaided, lang)} value={vaUnaided} />
          <Row label={label(RL.corrected, lang)} value={vaCorrected} />
          <Row label={label(RL.pinhole, lang)} value={vaPh} />
        </>
      ) : null}

      {iop?.value_mmhg != null ? (
        <Row label={`IOP${iop.method ? ` (${iop.method})` : ''}`} value={`${iop.value_mmhg} mmHg`} />
      ) : null}

      {hasRef ? (
        <>
          <Row label={label(RL.sphere, lang)} value={ref?.sphere != null ? fmtSphere(ref.sphere) : null} />
          <Row
            label={label(RL.cylinder, lang)}
            value={ref?.cylinder != null ? fmtCyl(ref.cylinder) : null}
          />
          <Row label={label(RL.axis, lang)} value={ref?.axis != null ? fmtAxis(ref.axis) : null} />
          <Row label={label(RL.add, lang)} value={ref?.add_power != null ? addPower(ref.add_power) : null} />
        </>
      ) : null}

      {anterior.length ? (
        <>
          <div className="medical-report__row-label" style={{ marginTop: 6, fontWeight: 700 }}>
            {label(RL.anteriorSegment, lang)}
          </div>
          {anterior.map(([key, arLabel, v]) => (
            <Row key={key} label={fieldLabel(key, arLabel, lang)} value={findingValue(v, lang)} />
          ))}
        </>
      ) : null}

      {posterior.length ? (
        <>
          <div className="medical-report__row-label" style={{ marginTop: 6, fontWeight: 700 }}>
            {label(RL.posteriorSegment, lang)}
          </div>
          {posterior.map(([key, arLabel, v]) => (
            <Row key={key} label={fieldLabel(key, arLabel, lang)} value={findingValue(v, lang)} />
          ))}
        </>
      ) : null}
    </div>
  );
}

export function ExaminationSection({
  exam,
  chiefComplaint,
  lang,
}: {
  exam: Examination;
  /** Shown above the OD/OS block; visit.chief_complaint or exam.chief_complaint. */
  chiefComplaint?: string | null;
  lang: ReportLang;
}) {
  return (
    <>
      {chiefComplaint ? (
        <Section title={label(RL.chiefComplaint, lang)}>
          <p>{chiefComplaint}</p>
        </Section>
      ) : null}

      <Section title={label(RL.examination, lang)}>
        <MedBlock className="medical-report__eyes">
          {EYES.map((eye) => (
            <EyeColumn key={eye} eye={eye} exam={exam} lang={lang} />
          ))}
        </MedBlock>
      </Section>
    </>
  );
}
