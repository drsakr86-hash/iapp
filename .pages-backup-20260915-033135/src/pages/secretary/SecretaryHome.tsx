/** Secretary landing page — Step 2 placeholder. Migrated in Step 6. */
import { useAuth } from '../../hooks/useAuth';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Card } from '../../components/ui';

export default function SecretaryHome() {
  useDocumentTitle('السكرتارية');
  const { profile } = useAuth();
  return (
    <Card title={`أهلاً ${profile?.fullName ?? ''}`}>
      <p className="muted">
        الأساس جاهز. شاشات السكرتارية تُنقل في الخطوة 6 باستخدام محرّك المواعيد
        الحالي دون أي محرّك ثانٍ.
      </p>
    </Card>
  );
}
