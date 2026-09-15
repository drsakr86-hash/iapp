import { useEffect, useState } from 'react';
import { Card, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import * as portal from '../../services/patientPortal';
import * as M from '../../utils/models';

export default function PatientExams() {
  useDocumentTitle('فحوصاتي');
  const [rows, setRows] = useState<portal.MyExaminationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await portal.myExaminations();
        if (alive) setRows(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'تعذّر تحميل الفحوصات');
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
      <Card title={`فحوصاتي (${rows.length})`}>
        {loading ? <Spinner label="جارٍ التحميل…" /> : null}
        {error ? <p className="alert">{error}</p> : null}
        {!loading && !error && rows.length === 0 ? (
          <p className="muted">لا توجد فحوصات بعد.</p>
        ) : null}
      </Card>

      {rows.map((ex) => (
        <ExamCard key={ex.id} ex={ex} />
      ))}
    </div>
  );
}

function ExamCard({ ex }: { ex: portal.MyExaminationRow }) {
  const primaryDx = ex.diagnoses.find((d) => d.is_primary) ?? ex.diagnoses[0];
  return (
    <Card>
      <strong>{M.fmtDay(ex.exam_date)}</strong>

      {ex.chief_complaint ? (
        <p className="muted" style={{ marginTop: 6 }}>
          الشكوى: {ex.chief_complaint}
        </p>
      ) : null}

      {ex.va_right || ex.va_left ? (
        <div className="row" style={{ gap: 16, marginTop: 6 }}>
          {ex.va_right ? <span>حدة الإبصار (يمنى): {ex.va_right}</span> : null}
          {ex.va_left ? <span>حدة الإبصار (يسرى): {ex.va_left}</span> : null}
        </div>
      ) : null}

      {ex.iop_measurements.length > 0 ? (
        <div className="row" style={{ gap: 16, marginTop: 6 }}>
          {ex.iop_measurements.map((iop, i) => (
            <span key={i}>
              ضغط العين ({M.EYE_AR[iop.eye] ?? iop.eye}): {iop.value_mmhg}
            </span>
          ))}
        </div>
      ) : null}

      {primaryDx ? (
        <p style={{ marginTop: 6 }}>
          <strong>التشخيص:</strong> {primaryDx.diagnosis_text}
        </p>
      ) : null}

      {ex.follow_ups.length > 0 ? (
        <p className="muted" style={{ marginTop: 6 }}>
          📅 موعد المتابعة: {M.fmtDay(ex.follow_ups[0].due_date)}
          {ex.follow_ups[0].reason ? ` — ${ex.follow_ups[0].reason}` : ''}
        </p>
      ) : null}
    </Card>
  );
}
