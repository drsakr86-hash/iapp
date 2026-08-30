import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Toasts } from '../components/ui';
import { AppRoutes } from '../routes';

/**
 * Provider order matters: ErrorBoundary is outermost so a crash inside any
 * provider still renders a readable Arabic screen rather than a blank page.
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
          <BrowserRouter basename="/iapp/app">
            <AppRoutes />
            <Toasts />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
