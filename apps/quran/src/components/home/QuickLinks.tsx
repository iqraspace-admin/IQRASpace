"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { JumpToSurah } from "@/components/reader/JumpToSurah";
import { ReaderSettingsPanel } from "@/components/reader/ReaderSettingsPanel";
import type { Chapter } from "@/lib/content/types";

type Props = {
  chapters: Chapter[];
};

/**
 * Quick Links — one-click access to the Quran features readers reach for
 * most often, mirroring the IqraSpace Flutter app's Home Quick Links
 * (Search / Tajweed Rules / Reader Settings). The web set is wider than
 * Flutter's three chips: this app already has standalone features
 * Flutter doesn't (a Mushaf Page view, a Bookmarks list) that deserve
 * equal one-click discoverability, while "Search" is left out since no
 * search feature exists on web yet (a future phase). "Browse Surahs" is
 * covered by the entry-tile row above this section, so it's not repeated
 * here.
 *
 * Tiles are a responsive square grid (icon badge on top, label below,
 * `aspectRatio:1`) rather than the small inline pill chips this used to
 * be — `repeat(auto-fit, minmax(9.5rem, 1fr))` reflows continuously from
 * ~2 per row on a narrow phone to 5-6 per row at the site's shared
 * --content-max-width, with no media query needed. One consistent badge
 * tint (not alternating with the entry tiles' teal/gold split above) —
 * that split is a meaningful "these are the two primary things" signal
 * reserved for EntryTiles; repeating it across every one of these
 * same-weight utility tiles would just dilute it.
 */
export function QuickLinks({ chapters }: Props) {
  const [jumpOpen, setJumpOpen] = useState(false);

  return (
    <section style={{ width: "100%" }}>
      <h2 style={headingStyle}>Quick Links</h2>
      <div style={gridStyle}>
        <Link href="/page" className="quick-link-tile" style={tileStyle}>
          <span style={badgeStyle}>
            <PagesIcon />
          </span>
          <span style={labelStyle}>Browse Pages</span>
        </Link>
        <button type="button" onClick={() => setJumpOpen(true)} className="quick-link-tile" style={tileStyle}>
          <span style={badgeStyle}>
            <CompassIcon />
          </span>
          <span style={labelStyle}>Jump to Surah</span>
        </button>
        <Link href="/bookmarks" className="quick-link-tile" style={tileStyle}>
          <span style={badgeStyle}>
            <StarIcon />
          </span>
          <span style={labelStyle}>Bookmarks</span>
        </Link>
        <ReaderSettingsPanel
          initialView="tajweedRules"
          triggerLabel="Tajweed Rules"
          triggerIcon={<DropletIcon />}
          triggerClassName="quick-link-tile"
          triggerStyleOverride={tileStyle}
        />
        <ReaderSettingsPanel triggerClassName="quick-link-tile" triggerStyleOverride={tileStyle} />
      </div>

      <JumpToSurah open={jumpOpen} onClose={() => setJumpOpen(false)} chapters={chapters} />
    </section>
  );
}

const headingStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 600,
  fontSize: "1.125rem",
  color: "var(--color-text)",
  margin: "0 0 0.75rem",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(9.5rem, 1fr))",
  gap: "0.75rem",
};

const tileStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  aspectRatio: "1",
  padding: "1rem",
  borderRadius: "1rem",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text)",
  cursor: "pointer",
  textDecoration: "none",
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2.5rem",
  height: "2.5rem",
  borderRadius: "9999px",
  background: "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))",
  color: "var(--color-primary)",
};

const labelStyle: CSSProperties = {
  marginTop: "0.5rem",
  fontWeight: 600,
  fontSize: "0.85rem",
  textAlign: "center",
  color: "var(--color-text)",
};

function PagesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2s7 7.58 7 12a7 7 0 0 1-14 0c0-4.42 7-12 7-12z" />
    </svg>
  );
}
