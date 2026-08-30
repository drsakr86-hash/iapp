/**
 * Doctor landing page — Step 2 placeholder.
 *
 * It performs one real authenticated read (active patient count) so that the
 * foundation is proven end to end: session → RLS → iapp schema → service →
 * component. The Doctor application itself is migrated in Step 5.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Card } from '../../components/ui';
import * as patients from '../../services/patients';

export default function DoctorHome() {
  useDocumentTitle('الطبيب');
  const { profile } = useAuth();

  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    patients
      .count()
      .then((n) => active && setCount(n))
      .catch((e: Error) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="stack">
      <Card title={`أهلاً ${profile?.fullName ?? ''}`}>
        <p className="muted">
          الأساس جاهز. شاشات الطبيب تُنقل في الخطوة 5.
        </p>
      </Card>

      <Card title="اختبار الاتصال بقاعدة البيانات">
        {loading ? <p className="muted">جارٍ القراءة…</p> : null}
        {error ? <p className="alert">{error}</p> : null}
        {count !== null ? (
          <p>
            عدد المرضى النشطين المرئيين لحسابك:{' '}
            <strong style={{ color: 'var(--accent)' }}>{count}</strong>
          </p>
        ) : null}
        <p className="muted" style={{ fontSize: 11 }}>
          قراءة فقط — لم تُعدَّل أي بيانات.
        </p>
      </Card>
    </div>
  );
}
