export function Spinner({ label, fullPage }: { label?: string; fullPage?: boolean }) {
  return (
    <div className={fullPage ? 'centered' : 'centered centered--inline'} role="status" aria-live="polite">
      <div className="spinner" />
      {label ? <p className="muted">{label}</p> : null}
    </div>
  );
}
