/* -------------------------------------------------------------------------
 * DoctorProvider — the single doctor identity for the whole session.
 * -------------------------------------------------------------------------
 * WHY THIS IS A CONTEXT AND NOT A HOOK PER SCREEN
 *
 * The requirement is that a renamed doctor appears everywhere at once:
 * dashboard, prescriptions, reports, examination forms, printed documents.
 * That is only true if every one of those screens reads the SAME value. A
 * per-screen `useState(profile.fullName)` gives each screen its own copy,
 * and copies drift — which is precisely how a name ends up looking
 * un-editable: one screen updates and the rest keep showing the old string
 * until a full reload.
 *
 * So the name lives here, once. `rename()` writes to iapp.doctors and
 * updates this state; every consumer re-renders with the new value in the
 * same tick. No screen may keep its own doctor-name state.
 *
 * The doctor row is also where doctor_id comes from. appointments,
 * examinations, prescriptions and imaging_orders all reference
 * iapp.doctors.id — not auth.uid() — so `doctor?.id` from this context is
 * what write paths must pass. Passing the profile id produces a foreign-key
 * violation.
 * ---------------------------------------------------------------------- */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as doctorsService from '../services/doctors';
import { useAuth } from '../hooks/useAuth';
import { DoctorContext, type DoctorContextValue } from './doctor-context';

export function DoctorProvider({ children }: { children: ReactNode }) {
  const { profile, status } = useAuth();
  const [doctor, setDoctor] = useState<doctorsService.DoctorRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (status !== 'ready') {
      setDoctor(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await doctorsService.mine();
      if (mounted.current) setDoctor(row);
    } catch (e) {
      /* A missing doctor row is NOT an error — a secretary has none. Only a
         failed read is reported. */
      if (mounted.current) setError(e instanceof Error ? e.message : 'تعذّر قراءة ملف الطبيب');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    mounted.current = true;
    /* The doctor row lives in the database, not in React, and cannot be
       derived during render — the external-system case the rule allows. */
    // oxlint-disable-next-line react/set-state-in-effect
    void refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  const rename = useCallback<DoctorContextValue['rename']>(
    async (patch) => {
      if (!doctor) throw new Error('لا يوجد ملف طبيب مرتبط بهذا الحساب');
      const updated = await doctorsService.updateName(doctor.id, patch);
      if (mounted.current) setDoctor(updated);
    },
    [doctor],
  );

  const displayName = useMemo(
    () => doctorsService.displayName(doctor, profile),
    [doctor, profile],
  );

  const value = useMemo<DoctorContextValue>(
    () => ({ doctor, displayName, loading, error, refresh, rename }),
    [doctor, displayName, loading, error, refresh, rename],
  );

  return <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>;
}
