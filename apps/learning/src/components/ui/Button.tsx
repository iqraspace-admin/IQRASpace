"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./classNames";

export type ButtonVariant = "primary" | "outline" | "ghost" | "gold" | "danger";
export type ButtonSize = "lg" | "md" | "sm";

// Mirrors apps/site's `.btn` (pill, 1.5px border, 600 weight) and its size scale.
const base =
  "inline-flex items-center justify-center gap-2.5 rounded-full border-[1.5px] border-transparent font-semibold whitespace-nowrap no-underline transition-colors disabled:cursor-not-allowed disabled:border-transparent disabled:bg-paper-alt disabled:text-muted";

const sizes: Record<ButtonSize, string> = {
  lg: "min-h-[54px] px-[30px] text-base",
  md: "min-h-[46px] px-6 text-[15px]",
  sm: "min-h-9 px-4 text-[13px]",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-deep",
  outline: "border-heading bg-transparent text-heading hover:bg-primary-tint",
  ghost: "bg-paper-alt text-heading hover:bg-line",
  gold: "bg-accent text-[#163d32] hover:bg-accent-deep hover:text-white",
  danger: "bg-danger-tint text-danger hover:border-danger",
};

export function buttonClassName(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cx(base, sizes[size], variants[variant], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export function Button({ variant = "primary", size = "md", className, children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClassName(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClassName(variant, size, className)}>
      {children}
    </Link>
  );
}
