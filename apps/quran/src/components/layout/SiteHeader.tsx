"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ReaderSettingsPanel } from "@/components/reader/ReaderSettingsPanel";
import { BrandWordmark } from "./BrandWordmark";

/**
 * Persistent, minimal header (Readme.md §11 — "do not overcrowd").
 * Reading/navigation never requires an account, so there is deliberately
 * no sign-in control here yet — that's Phase 5.
 *
 * Deliberately just two things: the brand (wordmark + tagline) and
 * Settings. Surahs/Pages/Bookmarks navigation and the Theme control used
 * to live here too — they now live inside Settings' own "Browse" and
 * "Appearance" sections (ReaderSettingsPanel.tsx), which is why Settings
 * is no longer gated to reader pages only (it used to only render on an
 * open Surah/Page, back when it was purely reading-preference controls
 * with nothing to affect elsewhere) — it's reachable from every page now,
 * same as the features it now contains.
 *
 * Sticky (not `position: fixed`) so it stays visible while scrolling: a
 * sticky element still reserves its own space in normal document flow,
 * so nothing below it needs manual top-padding to avoid being covered —
 * `fixed` would need that compensation recalculated every time this
 * header's height changes (e.g. its nav wrapping onto a second line on a
 * narrow viewport), which sticky avoids entirely. The Surah/Page nav
 * row (ReaderNavBar's "top" variant) stacks sticky directly beneath this
 * one, offset by --site-header-height (measured below).
 */
export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);

  // Keeps --site-header-height (globals.css) in sync with this header's
  // REAL rendered height, not a guessed constant — it can change (its nav
  // row wrapping at narrow widths, a browser font-size setting, etc.), and
  // ReaderNavBar's sticky "top" offset would drift out of sync with
  // whatever guess was hardcoded otherwise.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty("--site-header-height", `${entry.contentRect.height}px`);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--content-max-width)",
          margin: "0 auto",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", minWidth: 0, textDecoration: "none" }}
          aria-label="IqraSpace Quran — home"
        >
          <span style={{ flexShrink: 0 }}>
            {/* No product label here (showProductLabel=false) — the
                tagline right next to it already answers "what is this",
                so showing both would be redundant in an already-tight row. */}
            <BrandWordmark showProductLabel={false} />
          </span>
          {/* A separate CSS class (not just overflow/ellipsis) rather than
              letting this truncate down to one or two stray characters on
              a narrow phone — that reads as a rendering glitch, not a
              graceful degrade. Below 480px it's hidden outright instead;
              same breakpoint ReaderNavBar's edge-Surah-name labels use. */}
          <span className="header-tagline" style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Read. Listen. Learn. Reflect.
          </span>
        </Link>

        <ReaderSettingsPanel />
      </div>
    </header>
  );
}
