import { useContext } from 'react';
import { DoctorContext, type DoctorContextValue } from '../contexts/doctor-context';

export function useDoctor(): DoctorContextValue {
  const ctx = useContext(DoctorContext);
  if (!ctx) throw new Error('useDoctor must be used inside <DoctorProvider>');
  return ctx;
}
