"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PLATFORM, PLATFORM_NAV } from "@/lib/platformLinks";
import { Brand } from "./Brand";
import { Icon } from "./icons";
import { buttonClassName } from "@/components/ui/Button";
import type { NavItem } from "./navConfig";

/**
 * The header every Learning App page shares — a structural match for
 * apps/site's `.site-header` (spec §3.2/3.3), not a recolour: the same sticky
 * ivory bar with blurred backdrop and hairline border, the same brand lockup,
 * pill nav links with a gold underline on the current section, a primary
 * "Open Quran Reader" CTA, and — below 1024px — a menu button that opens a
 * full-screen sheet of large serif links (same breakpoint the site collapses at).
 *
 * `variant="app"` (signed-in workspace) adds the workspace pieces: bell/theme/
 * avatar on the right and the workspace's own nav inside the mobile sheet,
 * since the sidebar that carries it on desktop isn't visible on phones.
 * `variant="public"` (landing/login/signup) shows Log in / Sign up instead.
 */
export function SiteHeader({
  variant,
  actions,
  mobileActions,
  workspaceNav,
  sheetFooter,
}: {
  variant: "app" | "public";
  /** Right-hand cluster on desktop (bell/theme/avatar, or auth buttons). */
  actions?: ReactNode;
  /** Right-hand cluster next to the menu button on phones (e.g. just the bell). */
  mobileActions?: ReactNode;
  /** App variant only: the workspace links shown in the mobile sheet. */
  workspaceNav?: NavItem[];
  /** Extra controls pinned to the bottom of the mobile sheet (log out, auth buttons, theme). */
  sheetFooter?: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const learningHref = variant === "app" ? "/dashboard" : "/";

  // Close the sheet on navigation (state adjusted during render, not in an effect).
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
  }

  // Sheet a11y: lock page scroll, close on Escape, and return focus to the
  // menu button afterwards.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    sheetRef.current?.querySelector<HTMLElement>("button, a")?.focus();
    const btn = menuBtnRef.current;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      btn?.focus();
    };
  }, [open]);

  // Desktop nav: in the app variant the "Quran Reader" CTA button already
  // covers that destination, and "Mobile App" only fits from 1280px up.
  const desktopNav = PLATFORM_NAV.filter((l) => variant === "public" || l.href !== PLATFORM.quran);

  const navLinkClass =
    "relative rounded-full px-3.5 py-3 text-[15px] font-medium leading-none text-ink no-underline hover:bg-primary-tint hover:text-heading aria-[current=page]:font-semibold aria-[current=page]:text-heading";
  const underline =
    "after:absolute after:inset-x-3.5 after:bottom-1 after:h-0.5 after:rounded-sm after:bg-accent after:content-['']";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
        <div
          className={`flex h-[var(--header-h)] items-center gap-6 px-5 sm:px-6 lg:gap-8 ${
            variant === "app" ? "" : "mx-auto max-w-[1264px] lg:px-8"
          } ${variant === "app" ? "lg:px-8" : ""}`}
        >
          <Brand />

          <nav aria-label="IqraSpace" className="ml-auto hidden items-center gap-1 lg:flex">
            {desktopNav.map((l) => {
              const current = l.internal;
              const cls = `${navLinkClass} ${current ? underline : ""} ${l.label === "Mobile App" ? "hidden xl:block" : ""}`;
              return l.internal ? (
                <Link key={l.label} href={learningHref} aria-current="page" className={cls}>
                  {l.label}
                </Link>
              ) : (
                <a key={l.label} href={l.href} className={cls}>
                  {l.label}
                </a>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {variant === "app" && (
              <a href={PLATFORM.quran} className={buttonClassName("primary", "sm", "ml-2 mr-1")}>
                Open Quran Reader <Icon name="arrow" className="h-4 w-4" />
              </a>
            )}
            {actions}
          </div>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            {mobileActions}
            <button
              ref={menuBtnRef}
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="site-sheet"
              onClick={() => setOpen(true)}
              className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-m)] border-[1.5px] border-line-strong bg-surface text-heading"
            >
              <Icon name="menu" className="h-[22px] w-[22px]" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          ref={sheetRef}
          id="site-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-[60] flex flex-col overflow-auto bg-paper lg:hidden"
        >
          <div className="flex h-[var(--header-h)] flex-none items-center justify-between border-b border-line px-5 sm:px-6">
            <Brand showTagline={false} />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-m)] border-[1.5px] border-line-strong bg-surface text-heading"
            >
              <Icon name="close" className="h-[22px] w-[22px]" />
            </button>
          </div>

          <nav aria-label="Mobile" className="flex flex-col px-5 py-4 sm:px-6">
            {variant === "app" && workspaceNav && (
              <>
                <p className="mb-1 mt-2 flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-accent-deep">
                  <span className="h-px w-6 bg-accent" />
                  Your workspace
                </p>
                {workspaceNav.map((item) => {
                  const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="flex min-h-[52px] items-center gap-3 border-b border-line py-3 text-[17px] font-medium text-ink no-underline aria-[current=page]:font-semibold aria-[current=page]:text-primary"
                    >
                      <Icon name={item.icon} className="h-5 w-5 text-primary" />
                      {item.label}
                      {active && <span className="ml-auto h-2 w-2 rounded-full bg-accent" />}
                    </Link>
                  );
                })}
                <p className="mb-1 mt-8 flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-accent-deep">
                  <span className="h-px w-6 bg-accent" />
                  IqraSpace
                </p>
              </>
            )}
            {PLATFORM_NAV.map((l) => {
              const cls =
                "flex min-h-[60px] items-center justify-between border-b border-line py-[18px] font-display text-[22px] leading-[1.2] text-heading no-underline aria-[current=page]:text-primary";
              const arrow = <Icon name="arrow" className="h-5 w-5 text-ink-soft" />;
              return l.internal ? (
                <Link key={l.label} href={learningHref} aria-current="page" className={cls}>
                  {l.label}
                  <span className="h-2 w-2 rounded-full bg-accent" />
                </Link>
              ) : (
                <a key={l.label} href={l.href} className={cls}>
                  {l.label}
                  {arrow}
                </a>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-3 px-5 pb-8 pt-6 sm:px-6">
            <a href={PLATFORM.quran} className={buttonClassName("primary", "lg", "w-full")}>
              Open Quran Reader <Icon name="arrow" className="h-[18px] w-[18px]" />
            </a>
            {sheetFooter}
            <p className="mt-1 text-center text-sm text-ink-soft">Read. Listen. Learn. Reflect.</p>
          </div>
        </div>
      )}
    </>
  );
}
