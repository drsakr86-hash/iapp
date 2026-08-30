/* -------------------------------------------------------------------------
 * ProtectedRoute — routing guard.
 * -------------------------------------------------------------------------
 * ⚠️ THIS IS NOT A SECURITY BOUNDARY. It is navigation UX.
 *
 * Anyone can edit the URL, disable JavaScript, or call the API directly.
 * What actually stops a secretary reading a doctor's notes, or patient A
 * reading patient B's file, is RLS in PostgreSQL. This component only keeps
 * honest users out of screens that would be empty or broken for their role.
 *
 * Consequence for the migration: never "fix" a permissions problem by
 * changing this file. If a role sees data it should not, the policy is
 * wrong, and the fix belongs in the database.
 * ---------------------------------------------------------------------- */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui';
import type { Role } from '../types/domain';

interface Props {
  /** Roles allowed to see these routes. Omit to require any signed-in user. */
  allow?: Role[];
}

export function ProtectedRoute({ allow }: Props) {
  const { status, profile } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Spinner label="جارٍ التحقق من الجلسة…" />;

  // Not signed in — remember where they were headed so login can return them.
  if (status === 'anon') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Signed in but the account has no usable profile.
  if (status === 'no_profile' || !profile) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allow && !allow.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

