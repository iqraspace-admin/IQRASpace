"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";

/**
 * The entry-tile row from the IqraSpace Flutter app's Home screen —
 * "Read Quran" and "Learning" reproduced for visual parity, plus a third
 * "Supplications" tile (this app's own addition, alongside — not instead
 * of — Learning, per the redesign brief).
 *
 * "Learning" now links to the real, live apps/learning tutoring LMS at
 * `/learning` — a plain `<a>`, not next/link's `<Link>`: apps/learning is
 * a separate Vercel project/Next.js "zone" stitched under the same
 * iqraspace.org domain only by apps/landing's Multi-Zones rewrite (root
 * CLAUDE.md), so this is a real cross-zone navigation (a full page load),
 * not an in-app route `<Link>` would try to resolve within this app's own
 * basePath and 404 on.
 */
export function EntryTiles() {
  const { t } = useT();
  return (
    <div style={gridStyle}>
      <Link href="/surah" className="entry-tile" style={tileStyle}>
        <span style={badgeStyle("var(--color-primary)")}>
          <BookIcon />
        </span>
        <span style={titleStyle}>{t("entryReadQuranTitle")}</span>
        <span style={subtitleStyle}>{t("entryReadQuranSubtitle")}</span>
      </Link>

      <a href="/learning" className="entry-tile" style={tileStyle}>
        <span style={badgeStyle("var(--color-accent)")}>
          <CapIcon />
        </span>
        <span style={titleStyle}>{t("entryLearningTitle")}</span>
        <span style={subtitleStyle}>{t("entryLearningSubtitle")}</span>
      </a>

      <Link href="/supplications" className="entry-tile" style={tileStyle}>
        <span style={badgeStyle("var(--color-primary)")}>
          <HandsIcon />
        </span>
        <span style={titleStyle}>{t("entrySupplicationsTitle")}</span>
        <span style={subtitleStyle}>{t("entrySupplicationsSubtitle")}</span>
      </Link>
    </div>
  );
}

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(9.5rem, 1fr))",
  gap: "0.75rem",
  width: "100%",
};

const tileStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  minHeight: "7rem",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text)",
  textDecoration: "none",
  boxShadow: "var(--shadow-1)",
  transition: "box-shadow 0.2s, border-color 0.2s",
};

function badgeStyle(tintFrom: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.75rem",
    height: "2.75rem",
    borderRadius: "var(--radius-md)",
    background: `color-mix(in srgb, ${tintFrom} 14%, var(--color-surface))`,
    color: tintFrom === "var(--color-accent)" ? "var(--color-accent-text)" : "var(--color-primary)",
  };
}

const titleStyle: CSSProperties = {
  marginTop: "0.75rem",
  fontWeight: 700,
  fontSize: "1rem",
};

const subtitleStyle: CSSProperties = {
  marginTop: "0.2rem",
  fontSize: "0.85rem",
  color: "var(--color-text-muted)",
};

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function CapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
    </svg>
  );
}

function HandsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 13V6a1.5 1.5 0 0 1 3 0v5" />
      <path d="M11 11V4a1.5 1.5 0 0 1 3 0v7" />
      <path d="M14 11V5.5a1.5 1.5 0 0 1 3 0V13" />
      <path d="M17 8.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.4L4 15" />
    </svg>
  );
}
