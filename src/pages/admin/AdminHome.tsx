/** Admin landing page — Step 2 placeholder. */
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Card } from '../../components/ui';

export default function AdminHome() {
  useDocumentTitle('مدير النظام');
  return (
    <Card title="مدير النظام">
      <p className="muted">مسار محجوز. لا توجد شاشات إدارية في هذه المرحلة.</p>
    </Card>
  );
}
