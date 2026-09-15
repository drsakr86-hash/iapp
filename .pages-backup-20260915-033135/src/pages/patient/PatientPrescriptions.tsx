import { useEffect, useState } from 'react';
import { Card, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import * as portal from '../../services/patientPortal';
import * as M from '../../utils/models';

export default function PatientPrescriptions() {
  useDocumentTitle('روشتاتي');
  const [rows, setRows] = useState<portal.MyPrescriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await portal.myPrescriptions();
        if (alive) setRows(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'تعذّر تحميل الروشتات');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="stack">
      <Card title={`روشتاتي (${rows.length})`}>
        {loading ? <Spinner label="جارٍ التحميل…" /> : null}
        {error ? <p className="alert">{error}</p> : null}
        {!loading && !error && rows.length === 0 ? (
          <p className="muted">لا توجد روشتات بعد.</p>
        ) : null}
      </Card>

      {rows.map((rx) => (
        <PrescriptionCard key={rx.id} rx={rx} />
      ))}
    </div>
  );
}

function PrescriptionCard({ rx }: { rx: portal.MyPrescriptionRow }) {
  const meds = rx.prescription_items.filter((i) => i.free_text || i.dose || i.frequency);
  return (
    <Card>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>{M.fmtDay(rx.prescribed_on)}</strong>
        <span className="muted">{rx.is_glasses ? 'نظارة' : 'أدوية'}</span>
      </div>

      {rx.refractions.length > 0 ? (
        <div className="stack" style={{ marginTop: 8 }}>
          <div className="muted">👓 كشف النظارة</div>
          <table style={{ width: '100%', fontSize: 13, textAlign: 'center' }}>
            <thead>
              <tr>
                <th></th>
                <th>SPH</th>
                <th>CYL</th>
                <th>AXIS</th>
                <th>ADD</th>
              </tr>
            </thead>
            <tbody>
              {rx.refractions.map((r, i) => (
                <tr key={i}>
                  <td>{M.EYE_AR[r.eye] ?? r.eye}</td>
                  <td>{r.sphere ?? '—'}</td>
                  <td>{r.cylinder ?? '—'}</td>
                  <td>{r.axis ?? '—'}</td>
                  <td>{r.add_power ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {meds.length > 0 ? (
        <div className="stack" style={{ marginTop: 8 }}>
          <div className="muted">💊 الأدوية</div>
          {meds.map((m) => (
            <div key={m.id} className="muted">
              • {m.free_text ?? '—'}
              {m.dose ? ` — ${m.dose}` : ''}
              {m.frequency ? ` — ${m.frequency}` : ''}
              {m.duration ? ` — ${m.duration}` : ''}
            </div>
          ))}
        </div>
      ) : null}

      {rx.legacy_medicines_text ? (
        <div className="muted" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
          {rx.legacy_medicines_text}
        </div>
      ) : null}

      {rx.notes ? <p className="muted" style={{ marginTop: 8 }}>📝 {rx.notes}</p> : null}
    </Card>
  );
}
