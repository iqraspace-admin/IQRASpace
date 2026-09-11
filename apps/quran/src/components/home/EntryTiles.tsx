import type { CSSProperties } from "react";
import Link from "next/link";

/**
 * The two-column "Read Quran" / "Learning" entry-tile row from the
 * IqraSpace Flutter app's Home screen — reproduced here for visual
 * parity, not functional parity: "Learning" is a plain, non-interactive
 * placeholder card (no `<Link>`, no destination) with a small "Coming
 * soon" badge, since Learning stays a future phase on the website (per
 * the redesign brief) — only its *presence*, matching what the Flutter
 * reference actually shows, is in scope here.
 */
export function EntryTiles() {
  return (
    <div style={gridStyle}>
      <Link href="/surah" className="entry-tile" style={tileStyle}>
        <span style={badgeStyle("var(--color-primary)")}>
          <BookIcon />
        </span>
        <span style={titleStyle}>Read Quran</span>
        <span style={subtitleStyle}>114 Surahs, Tajweed &amp; translation</span>
      </Link>

      <div className="entry-tile" style={{ ...tileStyle, cursor: "default", position: "relative" }} aria-disabled="true">
        <span style={comingSoonBadgeStyle}>Coming soon</span>
        <span style={badgeStyle("var(--color-accent)")}>
          <CapIcon />
        </span>
        <span style={titleStyle}>Learning</span>
        <span style={subtitleStyle}>Courses &amp; guided lessons</span>
      </div>
    </div>
  );
}

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "0.75rem",
  width: "100%",
};

const tileStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  minHeight: "7rem",
  borderRadius: "1rem",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text)",
  textDecoration: "none",
};

function badgeStyle(tintFrom: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.75rem",
    height: "2.75rem",
    borderRadius: "0.75rem",
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

const comingSoonBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "0.75rem",
  right: "0.75rem",
  fontSize: "0.7rem",
  fontWeight: 600,
  color: "var(--color-text-muted)",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: "9999px",
  padding: "0.15rem 0.55rem",
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
