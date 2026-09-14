/**
 * AppShell — top bar + role navigation + outlet.
 *
 * LAYOUT MODEL — reset to the simplest possible thing after repeated
 * real-browser reports that desktop primary-nav content still started
 * underneath the nav, despite each prior revision reasoning through why
 * it shouldn't (and, in one round, an actual WebKit engine measuring zero
 * overlap under the same CSS). Rather than keep refining sticky-based
 * offset logic that real Chrome kept disagreeing with, this removes
 * position tricks from the desktop chrome entirely:
 *
 * .topbar, .bottomnav (desktop), and .subnav are all plain, ordinary
 * `position: static` block-level siblings — no sticky, no fixed, no
 * wrapper element, no calculated offset, no ResizeObserver. <main> simply
 * comes after them in the DOM. Normal-flow siblings physically cannot
 * overlap one another; there is no CSS positioning mode involved that
 * could get that wrong. The tradeoff, explicitly accepted: the header no
 * longer stays pinned while scrolling a long page on desktop — it
 * scrolls away with the rest of the content, exactly like any other
 * block element before it. That's a UX downgrade from a sticky header,
 * not a bug, and is deliberately the price paid to make the base layout
 * unambiguously correct before any "stays visible while scrolling"
 * enhancement is reconsidered.
 *
 * Mobile keeps its existing fixed bottom tab bar (.bottomnav is
 * `position: fixed; bottom: 0` only below the 900px breakpoint) — a
 * fixed element does not reserve flow space, so .app-shell still needs a
 * bottom padding to clear it; that padding is now a static constant
 * (--bottomnav-h in theme.css), not a runtime measurement, per instruction.
 */
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDoctor } from '../hooks/useDoctor';
import { ROLE_AR } from '../types/domain';
import { Button } from '../components/ui';

export type Section = 'doctor' | 'secretary' | 'patient' | 'admin' | 'accounting';

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
  doctor: [
    { to: '/doctor', label: 'اليوم', icon: '📅', end: true },
    { to: '/doctor/appointments', label: 'المواعيد', icon: '🗓️' },
    { to: '/doctor/patients', label: 'ملف المريض', icon: '🩺' },
    { to: '/doctor/payments', label: 'المدفوعات', icon: '💳' },
    { to: '/doctor/clinics', label: 'العيادات', icon: '🏥' },
    { to: '/doctor/services', label: 'الخدمات', icon: '🧾' },
    { to: '/doctor/lists', label: 'القوائم', icon: '⚙️' },
    { to: '/accounting', label: 'المحاسبة', icon: '📊' },
    { to: '/doctor/profile', label: 'ملفي', icon: '👤' },
  ],
  accounting: [
    { to: '/accounting', label: 'الرئيسية', icon: '📊', end: true },
    { to: '/accounting/revenue', label: 'تحصيل', icon: '💰' },
    { to: '/accounting/expenses', label: 'مصروفات', icon: '🧾' },
    { to: '/accounting/transfers', label: 'تحويلات', icon: '🔁' },
    { to: '/accounting/refunds', label: 'مرتجعات', icon: '↩️' },
    { to: '/accounting/closing', label: 'الإغلاق اليومي', icon: '🔒' },
    { to: '/accounting/accounts', label: 'الحسابات', icon: '🏦' },
    { to: '/accounting/reports', label: 'التقارير', icon: '📈' },
    { to: '/accounting/settings', label: 'الإعدادات', icon: '⚙️' },
  ],
  secretary: [{ to: '/secretary', label: 'مواعيد اليوم', icon: '📅', end: true }],
  patient: [
    { to: '/patient', label: 'اليوم', icon: '📅', end: true },
    { to: '/patient/appointments', label: 'مواعيدي', icon: '🗓️' },
    { to: '/patient/prescriptions', label: 'روشتاتي', icon: '💊' },
    { to: '/patient/exams', label: 'فحوصاتي', icon: '🔬' },
  ],
  admin: [
    { to: '/admin', label: 'النظام', icon: '⚙️', end: true },
    { to: '/admin/payments', label: 'المدفوعات', icon: '💳' },
    { to: '/admin/clinics', label: 'العيادات', icon: '🏥' },
    { to: '/admin/services', label: 'الخدمات', icon: '🧾' },
  ],
};

const TITLE: Record<Section, string> = {
  doctor: 'الطبيب',
  secretary: 'السكرتارية',
  patient: 'بوابة المريض',
  admin: 'مدير النظام',
  accounting: 'الحسابات المالية',
};

export function AppShell({ section }: { section: Section }) {
  const { profile, signOut } = useAuth();
  /* One name source. The header must not render profile.fullName directly:
     a doctor who renames themselves in settings would then see the old name
     here until a reload, which is what made the name look un-editable. */
  const { displayName } = useDoctor();
  const items = NAV[section];

  /* Accounting is a MODULE inside the doctor application, not a separate
     shell — the /accounting/* route tree renders <AppShell section="doctor">
     (see routes/index.tsx), so the primary doctor navigation is always
     what's shown above. This only decides whether the secondary
     Accounting sub-nav additionally appears underneath it. */
  const location = useLocation();
  const isAccounting =
    location.pathname === '/accounting' || location.pathname.startsWith('/accounting/');

  return (
    <>
      <header className="topbar">
        <span className="topbar__title">I App — {TITLE[section]}</span>
        <span className="topbar__spacer" />
        {profile ? (
          <span className="topbar__meta">
            {displayName} · {ROLE_AR[profile.role]}
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

      {isAccounting ? <AccountingSubNav /> : null}

      <main className="app-shell">
        <Outlet />
      </main>
    </>
  );
}

/**
 * Secondary navigation shown only while the current route is under
 * /accounting/*. Reuses NAV.accounting's existing item list — nothing
 * about that data changed, only how it's rendered (as a sub-nav strip
 * under the primary doctor nav, not as a separate top-level AppShell
 * section). Disappears the instant the path moves outside /accounting.
 */
function AccountingSubNav() {
  return (
    <nav className="subnav" aria-label="تنقّل المحاسبة">
      {NAV.accounting.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className="subnav__item">
          <span className="subnav__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
