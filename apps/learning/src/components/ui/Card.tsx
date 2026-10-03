import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./classNames";

export function Card({
  children,
  className,
  padded = true,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; padded?: boolean }) {
  return (
    <div
      className={cx(
        "rounded-[var(--radius-l)] border border-line bg-surface shadow-[var(--shadow-s)]",
        padded && "p-5 sm:p-6",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="mb-3 flex items-center gap-2.5 text-[13px] font-semibold uppercase leading-none tracking-[0.12em] text-accent-deep before:h-px before:w-6 before:bg-accent before:content-['']">
      {children}
    </span>
  );
}

export function SectionHead({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h3 className="text-[22px] leading-tight">{title}</h3>
        {subtitle && <p className="mt-1 text-[15px] text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
