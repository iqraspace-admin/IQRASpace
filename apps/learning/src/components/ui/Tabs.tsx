import { cx } from "./classNames";

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="mb-4 flex gap-1.5 border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            "-mb-px border-b-2 px-4 py-3 text-[15px] font-semibold transition-colors",
            active === t.value
              ? "border-accent text-heading"
              : "border-transparent text-ink-soft hover:text-heading"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function ViewToggle<T extends string>({
  options,
  active,
  onChange,
}: {
  options: { value: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex gap-1 rounded-full border border-line bg-surface-alt p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
            active === o.value ? "bg-surface text-heading shadow-[var(--shadow-s)]" : "text-ink-soft"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
