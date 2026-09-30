"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ReaderSettingsPanel } from "@/components/reader/ReaderSettingsPanel";
import { useModalA11y } from "@/lib/reader/useModalA11y";
import { useT } from "@/lib/i18n/useT";
import { BrandWordmark } from "./BrandWordmark";

type NavItem = { href: string; label: string; external?: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: "/surah", label: "Surahs" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/supplications", label: "Supplications" },
  { href: "/search", label: "Search" },
  { href: "/learning", label: "Learning", external: true },
];

/**
 * Structural rebuild (not the earlier token/color-only pass) to match
 * apps/site's header shape (design spec §3.2/3.3): a real nav-links row
 * on desktop, collapsing to a menu button + full-screen sheet below
 * 1024px — same breakpoint apps/site's own nav collapses at.
 *
 * One deliberate departure from apps/site's own mobile pattern: apps/site
 * hides its header CTA in the sheet on mobile (only the logo + menu
 * button show). Reading Settings (theme, font, reciter, Arabic font...)
 * is this app's single most-used control, reached from every page and
 * often mid-reading — burying it two taps deep behind the nav sheet
 * would be a real usability regression this task's "preserve existing
 * functionality" explicitly rules out. So the Settings trigger stays
 * directly visible at every viewport width (icon-only on mobile to make
 * room), and only the five nav links collapse into the sheet.
 *
 * Reading/navigation never requires an account, so there is deliberately
 * no sign-in control here — that's a future phase.
 */
export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useT();

  // Keeps --site-header-height (globals.css) in sync with this header's
  // REAL rendered height, not a guessed constant — see ReaderNavBar's
  // sticky "top" offset, which depends on this staying accurate.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty("--site-header-height", `${entry.contentRect.height}px`);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useModalA11y(sheetOpen, sheetRef, () => setSheetOpen(false));

  useEffect(() => {
    if (!sheetOpen) menuButtonRef.current?.focus();
  }, [sheetOpen]);

  function closeSheet() {
    setSheetOpen(false);
  }

  function isCurrent(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      <header
        ref={headerRef}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid var(--color-border)",
          background: "color-mix(in srgb, var(--color-bg) 94%, transparent)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: "var(--content-max-width)",
            margin: "0 auto",
            padding: "0.65rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            minHeight: "3.5rem",
          }}
        >
          <Link
            href="/"
            style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", minWidth: 0, textDecoration: "none" }}
            aria-label="IqraSpace Quran — home"
          >
            <span style={{ flexShrink: 0 }}>
              <BrandWordmark showProductLabel={false} />
            </span>
            <span className="header-tagline" style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              {t("headerTagline")}
            </span>
          </Link>

          <nav className="qr-nav" aria-label="Primary" style={{ marginLeft: "auto" }}>
            {NAV_ITEMS.map((item) =>
              item.external ? (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}>
            <ReaderSettingsPanel />
            <button
              ref={menuButtonRef}
              type="button"
              className="qr-menu-btn"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen(true)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      {sheetOpen && (
        <div
          ref={sheetRef}
          className="qr-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          tabIndex={-1}
        >
          <div className="qr-sheet-top">
            <span style={{ display: "flex", alignItems: "center" }}>
              <BrandWordmark showProductLabel={false} />
            </span>
            <button type="button" className="qr-menu-btn" style={{ display: "inline-flex" }} aria-label="Close menu" onClick={() => setSheetOpen(false)}>
              <CloseIcon />
            </button>
          </div>
          <nav aria-label="Mobile">
            {NAV_ITEMS.map((item) =>
              item.external ? (
                <a key={item.href} href={item.href} onClick={closeSheet}>
                  {item.label}
                  <ArrowGlyph />
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  onClick={closeSheet}
                >
                  {item.label}
                  {!isCurrent(item.href) && <ArrowGlyph />}
                </Link>
              ),
            )}
          </nav>
        </div>
      )}
    </>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ArrowGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
