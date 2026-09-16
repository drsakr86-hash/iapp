/**
 * Context object and types, kept separate from the provider component so
 * that Fast Refresh works correctly during Steps 5-13 development
 * (a module exporting both a component and a non-component breaks HMR).
 */
import { createContext } from 'react';
import type { Profile } from '../types/domain';

export type AuthStatus = 'loading' | 'anon' | 'ready' | 'no_profile';

export interface AuthContextValue {
  status: AuthStatus;
  profile: Profile | null;
  /** Why the profile is unusable, when status is 'no_profile'. */
  problem: string | null;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
