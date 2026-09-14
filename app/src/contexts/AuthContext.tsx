/* -------------------------------------------------------------------------
 * AuthContext — session restoration, role detection, sign in/out.
 * -------------------------------------------------------------------------
 * Status model (drives every guard and loading state in the app):
 *
 *   'loading'   — restoring a persisted session; render nothing role-specific
 *   'anon'      — no session; login screen
 *   'ready'     — session + valid, active profile with a known role
 *   'no_profile'— authenticated but unusable (missing/inactive/unknown role)
 *
 * 'no_profile' is deliberately distinct from 'anon'. Collapsing them shows a
 * login screen to someone who is already logged in, which is exactly the
 * confusing loop the legacy app was fixed to avoid.
 * ---------------------------------------------------------------------- */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Profile } from '../types/domain';
import * as authService from '../services/auth';
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  /**
   * React 18/19 StrictMode double-invokes effects in development. Without
   * this guard the subscription is registered twice and every auth event is
   * handled twice.
   */
  const mounted = useRef(true);

  const resolve = useCallback(async () => {
    const result = await authService.loadProfile();
    if (!mounted.current) return;

    if (result.profile) {
      setProfile(result.profile);
      setProblem(null);
      setStatus('ready');
      return;
    }
    setProfile(null);
    if (result.failure === 'no_session') {
      setProblem(null);
      setStatus('anon');
    } else {
      setProblem(result.message ?? 'تعذّر قراءة ملف الحساب');
      setStatus('no_profile');
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    // 1. Restore any persisted session on first paint.
    //    This IS the "synchronize with an external system" case the
    //    set-state-in-effect rule exists for: the session lives in Supabase's
    //    storage, not in React, and its status cannot be derived at render.
    // oxlint-disable-next-line react/set-state-in-effect
    void resolve();

    // 2. Track sign-in / sign-out / token refresh / expiry thereafter.
    const unsubscribe = authService.onAuthChange((session) => {
      if (!mounted.current) return;
      if (!session) {
        setProfile(null);
        setProblem(null);
        setStatus('anon');
        return;
      }
      void resolve();
    });

    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [resolve]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await authService.signIn(email, password);
      // onAuthChange fires on success and drives the state transition; on
      // failure the service has already signed out, so nothing to undo here.
      return { ok: result.ok, error: result.error };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    if (!mounted.current) return;
    setProfile(null);
    setProblem(null);
    setStatus('anon');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, profile, problem, signIn, signOut, refresh: resolve }),
    [status, profile, problem, signIn, signOut, resolve],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
