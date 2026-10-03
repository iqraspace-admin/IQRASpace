export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="mb-2.5">
      {label && (
        <div className="mb-1 flex justify-between text-[13px] text-ink-soft">
          <span>{label}</span>
          <span className="text-ink">{clamped}%</span>
        </div>
      )}
      <div className="h-[9px] overflow-hidden rounded-full bg-paper-alt">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function StatCard({ value, label }: { value: ReactNodeLike; label: string }) {
  return (
    <div className="rounded-[var(--radius-m)] border border-line bg-surface p-4 shadow-[var(--shadow-s)]">
      <div className="font-display text-[2rem] leading-tight text-heading">{value}</div>
      <div className="text-[13px] font-medium text-ink-soft">{label}</div>
    </div>
  );
}

// Kept loose on purpose: a stat value is usually a number or short string.
type ReactNodeLike = string | number;
