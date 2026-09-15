import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth__box">
        <div className="auth__brand">
          <h1>I App</h1>
          <p>EYE CLINIC</p>
        </div>
        {children}
      </div>
    </div>
  );
}
