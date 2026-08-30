/**
 * Shown when a signed-in user cannot use the app: no profile row, a
 * deactivated account, an unrecognised role, or a route their role may not
 * open. Deliberately vague about which — telling an unauthorised user
 * exactly why is an information leak.
 */
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Button } from '../components/ui';
import { ROLE_AR } from '../types/domain';

export default function UnauthorizedPage() {
  useDocumentTitle('غير مصرّح');
  const { profile, problem, signOut } = useAuth();

  return (
    <div className="centered">
      <h1 style={{ fontSize: 'var(--fs-lg)', margin: 0 }}>لا تملك صلاحية الوصول</h1>
      <p className="muted" style={{ maxWidth: 380 }}>
        {profile
          ? `حسابك مسجَّل كـ${ROLE_AR[profile.role]}، وهذه الصفحة ليست ضمن صلاحياتك.`
          : 'حسابك غير مهيَّأ للاستخدام. راجع إدارة النظام.'}
      </p>
      {import.meta.env.DEV && problem ? (
        <p className="muted" style={{ fontSize: 11, direction: 'ltr' }}>
          {problem}
        </p>
      ) : null}
      <Button variant="outline" onClick={() => void signOut()}>
        تسجيل الخروج
      </Button>
    </div>
  );
}
