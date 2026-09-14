/**
 * Admin landing page — quick links into the admin screens that already
 * exist (Clinic Locations, Services, Payments). This used to claim no
 * admin screens existed yet, which stopped being true once those pages
 * shipped; the empty state was never updated to match.
 */
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Card } from '../../components/ui';

const LINKS = [
  { to: '/admin/clinics', label: 'العيادات', icon: '🏥' },
  { to: '/admin/services', label: 'الخدمات', icon: '🧾' },
  { to: '/admin/payments', label: 'المدفوعات', icon: '💳' },
];

export default function AdminHome() {
  useDocumentTitle('مدير النظام');
  return (
    <Card title="مدير النظام">
      <div className="stack">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="row">
            <span aria-hidden="true">{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
