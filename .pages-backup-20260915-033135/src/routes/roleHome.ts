import type { Role } from '../types/domain';

/** Landing route for each role. */
export function roleHome(role: Role): string {
  switch (role) {
    case 'doctor':
      return '/doctor';
    case 'secretary':
      return '/secretary';
    case 'patient':
      return '/patient';
    case 'admin':
      return '/admin';
    default:
      return '/unauthorized';
  }
}

/**
 * Which top-level route prefix each role may land on. Mirrors the
 * `allow={[...]}` lists on the <ProtectedRoute> elements in routes/
 * index.tsx exactly — if those change, this must change with them.
 *
 * Exists because LoginPage remembers "where the person was headed" via
 * location.state.from (set by ProtectedRoute when it bounces an
 * unauthenticated visit to /login) and returns them there after signing
 * in. That is correct when the same account that got bounced logs back
 * in — but if a DIFFERENT-role account signs in afterward on the same
 * device/tab (e.g. logged out of a patient account, logs into a doctor
 * account), blindly honoring the old `from` sends the new account to a
 * page it has no access to, landing on /unauthorized instead of home.
 * See LoginPage's redirect effect — it checks this before using `from`.
 */
const ROLE_PREFIXES: Record<Role, string[]> = {
  doctor: ['/doctor', '/accounting'],
  secretary: ['/secretary'],
  patient: ['/patient'],
  admin: ['/doctor', '/accounting', '/secretary', '/admin'],
};

export function pathAllowedForRole(path: string, role: Role): boolean {
  return ROLE_PREFIXES[role]?.some((prefix) => path === prefix || path.startsWith(prefix + '/')) ?? false;
}
