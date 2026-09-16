import { MedText, MedValue } from '../../medical/Medical';
import * as M from '../../../utils/models';
import { ORDER_STATUS_AR, URGENCY_AR, modalityLabel } from '../../../types/domain';
import { RL, eyeLabel, label, type ReportLang } from '../../../i18n/report';
import type { ImagingOrder } from '../../../services/imaging';
import { Section } from './shared';

export function InvestigationRequestSection({
  orders,
  lang,
}: {
  orders: ImagingOrder[];
  lang: ReportLang;
}) {
  if (!orders.length) return null;
  return (
    <Section title={label(RL.investigationRequest, lang)}>
      {orders.map((o) => (
        <div key={o.id} style={{ marginBlockEnd: 10 }}>
          <div className="medical-report__muted">
            <MedValue>{M.fmtDay(o.ordered_on)}</MedValue>
            {o.order_no ? ` · #${o.order_no}` : ''}
            {' · '}
            {URGENCY_AR[o.urgency] ?? o.urgency}
            {' · '}
            {ORDER_STATUS_AR[o.status] ?? o.status}
          </div>
          {o.clinical_indication ? (
            <p>
              <strong>{label(RL.clinicalIndication, lang)}: </strong>
              {o.clinical_indication}
            </p>
          ) : null}
          <table className="medical-report__table">
            <thead>
              <tr>
                <th>{label(RL.requestedExam, lang)}</th>
                <th>{label(RL.eye, lang)}</th>
                <th>{label(RL.notes, lang)}</th>
              </tr>
            </thead>
            <tbody>
              {(o.items ?? []).map((it) => (
                <tr key={it.id}>
                  <td>
                    <MedText>{modalityLabel(it.modality)}</MedText>
                  </td>
                  <td>{eyeLabel(it.eye, lang)}</td>
                  <td>{it.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {o.clinical_notes ? <p className="medical-report__muted">{o.clinical_notes}</p> : null}
        </div>
      ))}
    </Section>
  );
}
