/* -------------------------------------------------------------------------
 * Route table.
 * -------------------------------------------------------------------------
 * Each role section is React.lazy so Vite emits a separate chunk: a patient
 * on a phone never downloads the doctor application. The split is by role,
 * which is also the natural security and workload boundary.
 *
 * STEP 2 SCOPE: the foundation only. Each role has one placeholder page.
 * Feature routes are added in Steps 5-7.
 * ---------------------------------------------------------------------- */

import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { roleHome } from './roleHome';
import { AppShell } from '../layouts/AppShell';
import { Spinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const DoctorHome = lazy(() => import('../pages/doctor/DoctorHome'));
const SecretaryHome = lazy(() => import('../pages/secretary/SecretaryHome'));
const PatientHome = lazy(() => import('../pages/patient/PatientHome'));
const AdminHome = lazy(() => import('../pages/admin/AdminHome'));

/** Sends "/" to the right place for whoever is signed in. */
function RootRedirect() {
  const { status, profile } = useAuth();
  if (status === 'loading') return <Spinner label="جارٍ التحميل…" />;
  if (status === 'anon') return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/unauthorized" replace />;
  return <Navigate to={roleHome(profile.role)} replace />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<Spinner label="جارٍ التحميل…" />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<ProtectedRoute allow={['doctor', 'admin']} />}>
          <Route path="/doctor" element={<AppShell section="doctor" />}>
            <Route index element={<DoctorHome />} />
            {/* Step 5: patients, patient file, visit, examination,
                diagnosis, prescription, follow-up, imaging, reports, AI */}
          </Route>
        </Route>

        <Route element={<ProtectedRoute allow={['secretary', 'admin']} />}>
          <Route path="/secretary" element={<AppShell section="secretary" />}>
            <Route index element={<SecretaryHome />} />
            {/* Step 6: today, all appointments, requests, queue,
                patient search, registration, rooms, arrival */}
          </Route>
        </Route>

        <Route element={<ProtectedRoute allow={['patient']} />}>
          <Route path="/patient" element={<AppShell section="patient" />}>
            <Route index element={<PatientHome />} />
            {/* Step 7: profile, requests, status, follow-up,
                approved prescriptions, approved reports */}
          </Route>
        </Route>

        <Route element={<ProtectedRoute allow={['admin']} />}>
          <Route path="/admin" element={<AppShell section="admin" />}>
            <Route index element={<AdminHome />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
