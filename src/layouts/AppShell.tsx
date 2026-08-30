/**
 * AppShell — top bar + role navigation + outlet.
 *
 * Layout mirrors the legacy applications: a sticky header, a bottom tab bar
 * on phones that becomes a horizontal pill bar from 900px up, and a centred
 * content column. dir="rtl" is set once on <html>; nothing here needs to
 * think about direction because the stylesheet uses logical properties.
 */
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_AR } from '../types/domain';
import { Button } from '../components/ui';

export type Section = 'doctor' | 'secretary' | 'patient' | 'admin';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

/**
 * Tabs mirror the legacy applications' navigation. Only the routes that
 * exist in Step 2 are listed; the rest arrive with their screens in
 * Steps 5-7 rather than as dead links.
 */
const NAV: Record<Section, NavItem[]> = {
  doctor: [{ to: '/doctor', label: 'اليوم', icon: '📅', end: true }],
  secretary: [{ to: '/secretary', label: 'مواعيد اليوم', icon: '📅', end: true }],
  patient: [{ to: '/patient', label: 'مواعيدي', icon: '📅', end: true }],
  admin: [{ to: '/admin', label: 'النظام', icon: '⚙️', end: true }],
};

const TITLE: Record<Section, string> = {
  doctor: 'الطبيب',
  secretary: 'السكرتارية',
  patient: 'بوابة المريض',
  admin: 'مدير النظام',
};

export function AppShell({ section }: { section: Section }) {
  const { profile, signOut } = useAuth();
  const items = NAV[section];

  return (
    <>
      <header className="topbar">
        <span className="topbar__title">I App — {TITLE[section]}</span>
        <span className="topbar__spacer" />
        {profile ? (
          <span className="topbar__meta">
            {profile.fullName ?? profile.email} · {ROLE_AR[profile.role]}
          </span>
        ) : null}
        <Button variant="outline" onClick={() => void signOut()} style={{ padding: '6px 12px' }}>
          خروج
        </Button>
      </header>

      <nav className="bottomnav" aria-label="التنقّل">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="bottomnav__item">
            <span className="bottomnav__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="app-shell">
        <Outlet />
      </main>
    </>
  );
}
