"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, Ref } from "react";
import { JumpToAyah } from "./JumpToAyah";

type NavTarget = { href: string; label: string };

type Props = {
  previous: NavTarget | undefined;
  next: NavTarget | undefined;
  variant?: "top" | "bottom";
  /** The Surah/Page currently open, shown centered between Previous
      and Next — bold, in the strongest available text color so it reads
      as the "you are here" anchor rather than another link (Previous/
      Next stay in the teal link color either side of it). Only rendered
      for the "top" variant — see the doc comment below for why "bottom"
      is a plain repeat, not a full nav bar. */
  current?: string;
  /** The current Surah's Arabic name, shown above `current` — Surah
      reader only (PageReader has no Arabic-name concept, so it never
      passes this). */
  currentArabic?: string;
  /** Supplying this turns the center label into a button (Jump to
      Surah) — Surah reader only; PageReader leaves this unset, so its
      center label stays the same plain, inert span as before. It also
      gates the whole extra control cluster below (Play/Stop, Go-to-Ayah,
      Auto-scroll) — none of those make sense for the Page reader either. */
  onCurrentClick?: () => void;
  /** Shown instead of a blank space when there's no Previous/Next
      target (e.g. Surah 1 / the last synced Surah) — "First Surah"/
      "Last Surah" or "First Page"/"Last Page" — so the boundary reads
      as an intentional edge, not a missing link. */
  previousBoundaryLabel?: string;
  nextBoundaryLabel?: string;
  /** Play/Stop whole-Surah recitation — Surah reader only. All three
      omitted together when there's nothing to play from (there always
      is, in practice, but keeps this component honest about being
      optional). */
  onPlayClick?: () => void;
  isPlaying?: boolean;
  isLoading?: boolean;
  /** Auto-scroll while reading (constant speed, independent of audio —
      see AyahList's separate audio-follow-scroll) — Surah reader only. */
  onAutoScrollClick?: () => void;
  isAutoScrolling?: boolean;
  /** Present only for the Surah reader — renders a "Go to Ayah" icon
      button that reveals JumpToAyah's existing form in a small popover
      rather than growing this row inline (this row's height feeds
      --reader-navbar-height, which PDF Mode's own toolbar stacks
      sticky beneath — an inline expansion would jolt that on every
      open/close). */
  goToAyah?: { surahId: number; versesCount: number };
};

/**
 * Prev/next navigation, shared by Surah/Page readers (each just
 * supplies its own href/label pairs) — kept as one component so the
 * two readers can't drift into subtly different markup/behavior. The
 * Surah reader's Play/Stop, Go-to-Ayah, and Auto-scroll controls live
 * here too now (merged from a separate row that used to sit well below
 * the heading/Bismillah, wasting vertical space and separating them
 * from the Surah name they act on) — all gated behind `onCurrentClick`,
 * so PageReader's usage (which never passes it) is unaffected.
 *
 * Every reader renders this twice (top and bottom of the ayah list) —
 * only the top one is a `<nav>` landmark. Two identically-labeled
 * landmarks on one page is confusing for landmark-based screen-reader
 * navigation (found by an axe-core scan, not by inspection — see
 * PRODUCT-ROADMAP.md's Phase 1 status); the bottom copy is a plain
 * repeat for convenience, not a second landmark to jump to. The new
 * controls (Play/Stop etc.) only render in the "top" copy — repeating
 * interactive audio/scroll controls at the bottom too would just be
 * clutter, not a convenience.
 *
 * The "top" copy is sticky, stacked directly beneath SiteHeader (see
 * that component's own sticky/--site-header-height comment) so it — and
 * the current Surah/Page name — stay visible while scrolling.
 * CSS Grid (1fr / auto / 1fr), not flex `justify-content: space-between`:
 * with two differently-sized Previous/Next labels either side, `space-
 * between` would put equal *gaps* around the current-name span rather
 * than actually centering it — the grid's two equal 1fr tracks are what
 * make the middle column land at the true visual center regardless of
 * how long either label is. This holds just as well now that the middle
 * column holds a cluster of controls instead of just the name.
 */
export function ReaderNavBar({
  previous,
  next,
  variant = "top",
  current,
  currentArabic,
  onCurrentClick,
  previousBoundaryLabel,
  nextBoundaryLabel,
  onPlayClick,
  isPlaying,
  isLoading,
  onAutoScrollClick,
  isAutoScrolling,
  goToAyah,
}: Props) {
  const Container = variant === "top" ? "nav" : "div";
  const isTop = variant === "top";
  // Container itself is one of two intrinsic tags (nav/div) chosen at
  // runtime, so TS can't narrow which HTMLElement subtype its own `ref`
  // prop expects — both are plain HTMLElements for every purpose this
  // ref is actually used for (measuring rendered height), hence the cast.
  const navRef = useRef<HTMLElement>(null);
  const [goToAyahOpen, setGoToAyahOpen] = useState(false);
  const goToAyahWrapperRef = useRef<HTMLDivElement>(null);

  // Keeps --reader-navbar-height (globals.css) in sync with this row's
  // REAL rendered height — see that CSS var's own comment for why (PDF
  // Mode's own toolbar stacks sticky beneath it). Only the "top" variant
  // is sticky/measured; the "bottom" copy never needs this.
  useEffect(() => {
    if (!isTop) return;
    const el = navRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty("--reader-navbar-height", `${entry.contentRect.height}px`);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isTop]);

  // Lightweight click-outside/Escape close for the Go-to-Ayah popover —
  // deliberately not the full useModalA11y treatment (focus trap, body-
  // scroll lock) used by the Settings/Jump-to-Surah dialogs: this is a
  // small anchored popover next to a reading surface that stays fully
  // usable underneath it, not a modal takeover.
  useEffect(() => {
    if (!goToAyahOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      if (goToAyahWrapperRef.current && !goToAyahWrapperRef.current.contains(e.target as Node)) {
        setGoToAyahOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setGoToAyahOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [goToAyahOpen]);

  return (
    <Container
      ref={navRef as Ref<HTMLDivElement>}
      {...(isTop ? { "aria-label": "Surah/Page navigation" } : {})}
      style={isTop ? topNavStyle : bottomNavStyle}
    >
      {previous ? (
        <Link href={previous.href} style={{ ...navLinkStyle, justifySelf: "start" }}>
          <span aria-hidden="true">←</span>
          <span className="reader-nav-edge-label">{previous.label}</span>
        </Link>
      ) : (
        <span style={{ ...boundaryLabelStyle, justifySelf: "start" }}>{previousBoundaryLabel}</span>
      )}

      {isTop &&
        (onCurrentClick ? (
          <div style={middleClusterStyle}>
            {onPlayClick && (
              <button
                type="button"
                onClick={onPlayClick}
                aria-pressed={isPlaying}
                aria-label={isLoading ? "Loading recitation" : isPlaying ? "Stop playing Surah" : "Play Surah"}
                style={iconCircleStyle(!!isPlaying)}
              >
                {isLoading ? <LoadingIcon /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
            )}

            <button
              type="button"
              onClick={onCurrentClick}
              aria-haspopup="dialog"
              aria-label={`Jump to Surah — currently ${current}`}
              style={currentButtonStyle}
            >
              {currentArabic && (
                <span dir="rtl" lang="ar" style={currentArabicStyle}>
                  {currentArabic}
                </span>
              )}
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                <span style={currentLabelStyle}>{current}</span>
                <ChevronDownIcon />
              </span>
            </button>

            {onAutoScrollClick && (
              <button
                type="button"
                onClick={onAutoScrollClick}
                aria-pressed={isAutoScrolling}
                aria-label={isAutoScrolling ? "Stop auto-scroll" : "Start auto-scroll"}
                style={iconCircleStyle(!!isAutoScrolling)}
              >
                <AutoScrollIcon />
              </button>
            )}

            {goToAyah && (
              <div ref={goToAyahWrapperRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setGoToAyahOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={goToAyahOpen}
                  aria-label="Go to Ayah"
                  style={iconCircleStyle(goToAyahOpen)}
                >
                  <HashIcon />
                </button>
                {goToAyahOpen && (
                  <div style={goToAyahPopoverStyle}>
                    <JumpToAyah
                      surahId={goToAyah.surahId}
                      versesCount={goToAyah.versesCount}
                      onJump={() => setGoToAyahOpen(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <span style={currentLabelStyle}>{current}</span>
        ))}

      {next ? (
        <Link href={next.href} style={{ ...navLinkStyle, justifySelf: "end" }}>
          <span className="reader-nav-edge-label">{next.label}</span>
          <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span style={{ ...boundaryLabelStyle, justifySelf: "end" }}>{nextBoundaryLabel}</span>
      )}
    </Container>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function AutoScrollIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="7 8 12 13 17 8" />
      <polyline points="7 15 12 20 17 15" />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="9" y1="4" x2="7" y2="20" />
      <line x1="17" y1="4" x2="15" y2="20" />
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="3" y1="15" x2="19" y2="15" />
    </svg>
  );
}

const navLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.3rem",
  color: "var(--color-primary)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textDecoration: "none",
};

const currentLabelStyle: CSSProperties = {
  fontWeight: 700,
  color: "var(--color-text)",
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

/** Muted, non-link text shown at a Previous/Next boundary (e.g. "First
    Surah") instead of empty space — reads as an intentional edge. Renders
    as an empty (but still grid-tracked) span when the caller doesn't pass
    a boundary label, preserving today's layout exactly. */
const boundaryLabelStyle: CSSProperties = {
  color: "var(--color-text-muted)",
  fontSize: "0.85rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

/** The tappable "Jump to Surah" trigger — Arabic name stacked above the
    existing English `current` label, echoing the Flutter app's tappable
    AppBar title. */
const currentButtonStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.1rem",
  background: "none",
  border: "none",
  padding: "0.15rem 0.4rem",
  borderRadius: "0.375rem",
  color: "inherit",
  cursor: "pointer",
  flex: "1 1 auto",
  minWidth: 0,
};

const currentArabicStyle: CSSProperties = {
  fontFamily: "var(--font-arabic)",
  fontSize: "1.1rem",
  fontWeight: 600,
  color: "var(--color-primary)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "100%",
};

/** The middle grid cell's own contents — Play/Stop, the Surah name, Go-
    to-Ayah, Auto-scroll, all in one compact row instead of the name
    alone. `minWidth: 0` lets the name button (the one `flex: 1 1 auto`
    element) actually shrink/truncate under pressure rather than
    overflowing the outer grid's `auto`-sized middle track. */
const middleClusterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.35rem",
  minWidth: 0,
  maxWidth: "100%",
};

/** Small circular icon-button language shared by Play/Stop, Auto-scroll,
    and Go-to-Ayah — deliberately identical so the three read as one
    family of compact controls flanking the Surah name. */
function iconCircleStyle(active: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2rem",
    height: "2rem",
    flexShrink: 0,
    borderRadius: "9999px",
    border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
    background: active ? "var(--color-primary)" : "var(--color-bg)",
    color: active ? "var(--color-primary-contrast)" : "var(--color-text)",
    cursor: "pointer",
  };
}

/** Go-to-Ayah's popover — anchored under its trigger button rather than
    expanding this row inline, since this row's height feeds
    --reader-navbar-height (see globals.css), which PDF Mode's own
    toolbar stacks sticky beneath; an inline expansion would jolt that
    offset every time the popover opens/closes. Same bordered-surface-
    plus-shadow language as the Settings/Jump-to-Surah dialogs. */
const goToAyahPopoverStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 0.5rem)",
  right: 0,
  zIndex: 45,
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.5rem",
  padding: "0.75rem",
  boxShadow: "0 4px 16px rgb(0 0 0 / 12%)",
  minWidth: "14rem",
};

const topNavStyle: CSSProperties = {
  position: "sticky",
  top: "var(--site-header-height)",
  zIndex: 40,
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: "0.5rem",
  background: "var(--color-surface)",
  borderBottom: "1px solid var(--color-border)",
  padding: "0.5rem 0.5rem",
  marginBottom: "1.5rem",
};

const bottomNavStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "2rem",
  paddingTop: "1rem",
  borderTop: "1px solid var(--color-border)",
};
