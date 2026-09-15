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
const DoctorAppointments = lazy(() => import('../pages/doctor/DoctorAppointments'));
const DoctorPatientRecord = lazy(() => import('../pages/doctor/DoctorPatientRecord'));
const DoctorMedicalReport = lazy(() => import('../pages/doctor/DoctorMedicalReport'));
const DoctorPayments = lazy(() => import('../pages/doctor/DoctorPayments'));
const DoctorPaymentReceipt = lazy(() => import('../pages/doctor/DoctorPaymentReceipt'));
const DoctorProfile = lazy(() => import('../pages/doctor/DoctorProfile'));
const SecretaryHome = lazy(() => import('../pages/secretary/SecretaryHome'));
const PatientHome = lazy(() => import('../pages/patient/PatientHome'));
const PatientAppointments = lazy(() => import('../pages/patient/PatientAppointments'));
const PatientPrescriptions = lazy(() => import('../pages/patient/PatientPrescriptions'));
const PatientExams = lazy(() => import('../pages/patient/PatientExams'));
const PatientLinkGate = lazy(() =>
  import('../components/patient/PatientLinkGate').then((m) => ({ default: m.PatientLinkGate })),
);
const AdminHome = lazy(() => import('../pages/admin/AdminHome'));
const AdminClinics = lazy(() => import('../pages/admin/AdminClinics'));
const AdminServices = lazy(() => import('../pages/admin/AdminServices'));
const DropdownSettings = lazy(() => import('../pages/doctor/DropdownSettings'));

const AccountingDashboard = lazy(() => import('../pages/accounting/AccountingDashboard'));
const AccountingAccounts = lazy(() => import('../pages/accounting/AccountingAccounts'));
const AccountingRevenue = lazy(() => import('../pages/accounting/AccountingRevenue'));
const AccountingExpenses = lazy(() => import('../pages/accounting/AccountingExpenses'));
const AccountingTransfers = lazy(() => import('../pages/accounting/AccountingTransfers'));
const AccountingRefunds = lazy(() => import('../pages/accounting/AccountingRefunds'));
const AccountingClosing = lazy(() => import('../pages/accounting/AccountingClosing'));
const AccountingReports = lazy(() => import('../pages/accounting/AccountingReports'));
const AccountingSettings = lazy(() => import('../pages/accounting/AccountingSettings'));

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
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="patients" element={<DoctorPatientRecord />} />
            <Route path="patients/:patientId" element={<DoctorPatientRecord />} />
            <Route
              path="patients/:patientId/report/:visitId"
              element={<DoctorMedicalReport />}
            />
            <Route path="profile" element={<DoctorProfile />} />
            <Route path="clinics" element={<AdminClinics />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="lists" element={<DropdownSettings />} />
            <Route path="payments" element={<DoctorPayments />} />
            <Route path="payments/:paymentId/receipt" element={<DoctorPaymentReceipt />} />
            {/* Visit, examination, diagnosis, prescriptions, imaging, and
                follow-up are NOT separate routes — they are sections
                rendered inline inside DoctorPatientRecord (patients/:id),
                not a migration gap. */}
          </Route>
        </Route>

        {/* Accounting — doctor/admin only, per the approved authorization
            decision (doctor has the same clinic scope as admin; see
            ACCOUNTING-ARCHITECTURE.md §Authorization). No secretary or
            patient route exists here in this phase. */}
        <Route element={<ProtectedRoute allow={['doctor', 'admin']} />}>
          <Route path="/accounting" element={<AppShell section="doctor" />}>
            <Route index element={<AccountingDashboard />} />
            <Route path="accounts" element={<AccountingAccounts />} />
            <Route path="revenue" element={<AccountingRevenue />} />
            <Route path="expenses" element={<AccountingExpenses />} />
            <Route path="transfers" element={<AccountingTransfers />} />
            <Route path="refunds" element={<AccountingRefunds />} />
            <Route path="closing" element={<AccountingClosing />} />
            <Route path="reports" element={<AccountingReports />} />
            <Route path="settings" element={<AccountingSettings />} />
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
            <Route element={<PatientLinkGate />}>
              <Route index element={<PatientHome />} />
              <Route path="appointments" element={<PatientAppointments />} />
              <Route path="prescriptions" element={<PatientPrescriptions />} />
              <Route path="exams" element={<PatientExams />} />
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute allow={['admin']} />}>
          <Route path="/admin" element={<AppShell section="admin" />}>
            <Route index element={<AdminHome />} />
            <Route path="clinics" element={<AdminClinics />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="payments" element={<DoctorPayments />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
