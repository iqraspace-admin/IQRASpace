import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cx } from "./classNames";

const controlClass =
  "w-full min-h-[48px] rounded-[var(--radius-m)] border-[1.5px] border-line-strong bg-surface px-4 py-2.5 text-base text-ink transition-colors placeholder:text-muted hover:border-primary focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-paper-alt disabled:text-muted";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(controlClass, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(controlClass, className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(controlClass, "min-h-[120px] resize-y", className)} {...rest} />;
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 block text-sm font-semibold leading-snug text-ink">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-[13px] text-ink-soft">{hint}</span>}
    </label>
  );
}
