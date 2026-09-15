import { MedText, MedValue } from '../../medical/Medical';
import * as M from '../../../utils/models';
import { RL, eyeLabel, label, type ReportLang } from '../../../i18n/report';
import type { DrugsReportItem } from '../../../types/report';
import { Section } from './shared';

export function DrugsSection({ items, lang }: { items: DrugsReportItem[]; lang: ReportLang }) {
  if (!items.length) return null;
  return (
    <Section title={label(RL.medicationRx, lang)}>
      {items.map(({ prescription, items: lines }) => (
        <div key={prescription.id} style={{ marginBlockEnd: 10 }}>
          <div className="medical-report__muted">
            <MedValue>{M.fmtDay(prescription.prescribed_on)}</MedValue>
          </div>
          <table className="medical-report__table">
            <thead>
              <tr>
                <th>{label(RL.drug, lang)}</th>
                <th>{label(RL.dose, lang)}</th>
                <th>{label(RL.frequency, lang)}</th>
                <th>{label(RL.duration, lang)}</th>
                <th>{label(RL.eye, lang)}</th>
                <th>{label(RL.instructions, lang)}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((it) => (
                <tr key={it.id}>
                  <td>
                    <MedText>{it.displayName}</MedText>
                  </td>
                  <td>{it.dose ?? '—'}</td>
                  <td>{it.frequency ?? '—'}</td>
                  <td>{it.duration ?? '—'}</td>
                  <td>{it.eye ? eyeLabel(it.eye, lang) : '—'}</td>
                  <td>{it.instructions ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {prescription.notes ? <p className="medical-report__muted">{prescription.notes}</p> : null}
        </div>
      ))}
    </Section>
  );
}
