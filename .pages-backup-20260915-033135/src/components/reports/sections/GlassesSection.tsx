import { MedBlock, MedValue } from '../../medical/Medical';
import * as M from '../../../utils/models';
import { addPower, axis as fmtAxis, cylinder as fmtCyl, sphere as fmtSphere } from '../../../utils/medical';
import { RL, fmtIpd, label, type ReportLang } from '../../../i18n/report';
import type { GlassesReportItem } from '../../../types/report';
import { Section } from './shared';

export function GlassesSection({ items, lang }: { items: GlassesReportItem[]; lang: ReportLang }) {
  if (!items.length) return null;
  return (
    <Section title={label(RL.glassesRx, lang)}>
      {items.map(({ prescription, od, os }) => {
        // IPD is stored once as a binocular value, duplicated onto both eye
        // rows by prescriptions.createGlasses() — shown once, never per eye.
        const ipd = fmtIpd(od?.ipd_mm ?? os?.ipd_mm ?? null);
        return (
          <div key={prescription.id} style={{ marginBlockEnd: 10 }}>
            <div className="medical-report__muted">
              <MedValue>{M.fmtDay(prescription.prescribed_on)}</MedValue>
            </div>
            <MedBlock>
              <table className="medical-report__table">
                <thead>
                  <tr>
                    <th>Eye</th>
                    <th>SPH</th>
                    <th>CYL</th>
                    <th>AXIS</th>
                    <th>ADD</th>
                  </tr>
                </thead>
                <tbody>
                  {([['OD', od] as const, ['OS', os] as const]).map(([eye, r]) =>
                    r ? (
                      <tr key={eye}>
                        <td>{eye}</td>
                        <td>{r.sphere != null ? fmtSphere(r.sphere) : '—'}</td>
                        <td>{r.cylinder != null ? fmtCyl(r.cylinder) : '—'}</td>
                        <td>{r.axis != null ? fmtAxis(r.axis) : '—'}</td>
                        <td>{r.add_power != null ? addPower(r.add_power) : '—'}</td>
                      </tr>
                    ) : null,
                  )}
                </tbody>
              </table>
            </MedBlock>
            {ipd ? (
              <p className="medical-report__row" style={{ marginBlockStart: 4 }}>
                <span className="medical-report__row-label">{label(RL.ipd, lang)}</span>
                <span className="medical-report__row-value">
                  <MedValue>{ipd}</MedValue>
                </span>
              </p>
            ) : null}
            {prescription.notes ? <p className="medical-report__muted">{prescription.notes}</p> : null}
          </div>
        );
      })}
    </Section>
  );
}
