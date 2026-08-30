export function Spinner({ label }: { label?: string }) {
  return (
    <div className="centered" role="status" aria-live="polite">
      <div className="spinner" />
      {label ? <p className="muted">{label}</p> : null}
    </div>
  );
}
