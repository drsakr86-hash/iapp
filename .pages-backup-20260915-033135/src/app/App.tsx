import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { DoctorProvider } from '../contexts/DoctorContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Toasts } from '../components/ui';
import { AppRoutes } from '../routes';

/**
 * Provider order matters: ErrorBoundary is outermost so a crash inside any
 * provider still renders a readable Arabic screen rather than a blank page.
 *
 * DoctorProvider sits inside AuthProvider because it reads the session to
 * find the doctor row, and outside the router so that every screen shares
 * ONE doctor identity and one display name. A rename in settings therefore
 * reaches the dashboard, prescriptions and reports without a reload.
 *
 * basename must match `base` in vite.config.ts. GitHub Pages has no SPA
 * rewrite, so the build copies index.html to 404.html — Pages then serves
 * the app for deep links while preserving the path for the router.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <DoctorProvider>
            <BrowserRouter basename="/iapp/app">
              <AppRoutes />
              <Toasts />
            </BrowserRouter>
          </DoctorProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
