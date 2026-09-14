import type { ReactNode } from 'react';
import { MedValue } from '../../medical/Medical';
import type { Eye } from '../../../types/domain';

export const EYES: readonly Eye[] = ['OD', 'OS'] as const;
export const EYE_EN_LABEL: Record<Eye, string> = {
  OD: 'Right Eye',
  OS: 'Left Eye',
  OU: 'Both Eyes',
};

export function Row({ label, value }: { label: string; value: ReactNode }) {
  if (value == null || value === '') return null;
  return (
    <div className="medical-report__row">
      <span className="medical-report__row-label">{label}</span>
      <span className="medical-report__row-value">
        <MedValue>{value}</MedValue>
      </span>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="medical-report__section">
      <h2 className="medical-report__section-title">{title}</h2>
      {children}
    </section>
  );
}
