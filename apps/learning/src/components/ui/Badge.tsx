import type { ReactNode } from "react";
import { cx } from "./classNames";

export type BadgeTone = "green" | "red" | "amber" | "teal" | "muted";

const tones: Record<BadgeTone, string> = {
  green: "bg-success-tint text-success",
  red: "bg-danger-tint text-danger",
  amber: "bg-warning-tint text-warning",
  teal: "bg-primary-tint text-primary-deep",
  muted: "bg-paper-alt text-muted",
};

export function Badge({ tone = "muted", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold leading-none tracking-[0.02em]",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-full border px-3 py-2 text-[13px] font-medium leading-none transition-colors",
        active
          ? "border-primary bg-primary text-white"
          : "border-line-strong bg-surface text-ink hover:border-primary hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}
