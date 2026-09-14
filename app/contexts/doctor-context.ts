/** Context object and types — kept separate from the provider for Fast Refresh. */
import { createContext } from 'react';
import type { DoctorRecord } from '../services/doctors';

export interface DoctorContextValue {
  /** The iapp.doctors row for the signed-in user, or null if they have none. */
  doctor: DoctorRecord | null;
  /** The resolved display name — the ONLY name any screen should render. */
  displayName: string;
  loading: boolean;
  error: string | null;
  /** Re-read after an edit so every consumer updates at once. */
  refresh: () => Promise<void>;
  /** Save a new display name and update every consumer. */
  rename: (patch: {
    full_name_ar: string;
    title_ar?: string | null;
    full_name_en?: string | null;
  }) => Promise<void>;
}

export const DoctorContext = createContext<DoctorContextValue | null>(null);
