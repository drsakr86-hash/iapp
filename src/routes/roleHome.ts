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
