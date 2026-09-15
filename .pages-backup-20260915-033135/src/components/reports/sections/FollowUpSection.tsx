import { MedValue } from '../../medical/Medical';
import * as M from '../../../utils/models';
import { RL, label, type ReportLang } from '../../../i18n/report';
import type { FollowUp } from '../../../types/clinical';
import { Section } from './shared';

export function FollowUpSection({ followUps, lang }: { followUps: FollowUp[]; lang: ReportLang }) {
  if (!followUps.length) return null;
  return (
    <Section title={label(RL.followUp, lang)}>
      {followUps.map((f) => (
        <p key={f.id}>
          <MedValue>{M.fmtDay(f.due_date)}</MedValue>
          {' — '}
          {f.reason ?? label(RL.followUp, lang)}
          {f.notes ? ` — ${f.notes}` : ''}
        </p>
      ))}
    </Section>
  );
}
