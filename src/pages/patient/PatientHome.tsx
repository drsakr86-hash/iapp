/** Patient portal landing page — Step 2 placeholder. Migrated in Step 7. */
import { useAuth } from '../../hooks/useAuth';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Card } from '../../components/ui';

export default function PatientHome() {
  useDocumentTitle('بوابة المريض');
  const { profile } = useAuth();
  return (
    <Card title={`أهلاً ${profile?.fullName ?? ''}`}>
      <p className="muted">الأساس جاهز. بوابة المريض تُنقل في الخطوة 7.</p>
    </Card>
  );
}
