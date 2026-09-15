import { MedText, MedValue } from '../../medical/Medical';
import * as M from '../../../utils/models';
import { modalityLabel } from '../../../types/domain';
import { RL, eyeLabel, label, type ReportLang } from '../../../i18n/report';
import type { Study } from '../../../services/imaging';
import { Section } from './shared';

interface Pair {
  ar: string;
  en: string;
}

export type ReportStudy = Study & { thumbUrl?: string | null };export function ImagingSection({
  studies,
  lang,
  titleOverride,
}: {
  studies: ReportStudy[];
  lang: ReportLang;
  /** Standalone Imaging Report uses "Imaging Findings" instead of the
   *  complete report's "Imaging / Investigations". */
  titleOverride?: Pair;
}) {
  if (!studies.length) return null;
  return (
    <Section title={label(titleOverride ?? RL.imaging, lang)}>
      <div className="medical-report__images">
        {studies.map((s) => (
          <figure className="medical-report__image-card" key={s.id}>
            {s.thumbUrl ? (
              <img className="medical-report__image-thumb" src={s.thumbUrl} alt={modalityLabel(s.modality)} />
            ) : (
              <div className="medical-report__image-thumb" />
            )}
            <figcaption className="medical-report__image-caption">
              <MedText>{modalityLabel(s.modality)}</MedText>
              {' · '}
              {s.eye ? eyeLabel(s.eye, lang) : ''}
              <br />
              <MedValue>{s.study_date ? M.fmtDay(s.study_date) : ''}</MedValue>
              {/* doctor_report is selected by the service (STUDY_COLS) but not
                  yet declared on the Study interface — read it defensively
                  rather than editing that shared service type. */}
              {(s as unknown as { doctor_report?: string | null }).doctor_report ? (
                <div>{(s as unknown as { doctor_report?: string | null }).doctor_report}</div>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
