export function Tag({ label, color = 'var(--muted)' }: { label: string; color?: string }) {
  return (
    <span className="tag" style={{ color }}>
      {label}
    </span>
  );
}
