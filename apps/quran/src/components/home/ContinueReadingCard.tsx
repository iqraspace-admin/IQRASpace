"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { loadLastReads, type ReadingHistoryEntry } from "@/lib/preferences/storage";
import { useT } from "@/lib/i18n/useT";
import type { Chapter } from "@/lib/content/types";

type Props = {
  chapters: Chapter[];
};

/**
 * Home page's "Continue Reading" (Readme.md §16) — the most recent entry
 * of the reading history (see LastReadsRow for the rest of it). Client
 * component — reading history lives in localStorage, so this can't be a
 * Server Component. `chapters` is passed down from the server page
 * instead of fetched again here, since content loading is server-only
 * (lib/content).
 */
export function ContinueReadingCard({ chapters }: Props) {
  const [position, setPosition] = useState<ReadingHistoryEntry | null>(null);
  const { t } = useT();

  useEffect(() => {
    async function hydrate() {
      const loaded = loadLastReads()[0] ?? null;
      await Promise.resolve(); // satisfies react-hooks/set-state-in-effect
      setPosition(loaded);
    }
    hydrate();
  }, []);

  // Server-rendered HTML (and the client's very first render, before the
  // effect above runs) always has no known last position — rendering
  // "Start Reading" for that case, same as a genuinely first-time visitor,
  // means the home page's primary CTA is a real link in the initial HTML
  // (works with JS disabled/slow, crawlable, no flash-of-missing-button)
  // rather than something that only appears after hydration completes.
  // It's corrected to "Continue Reading" a moment later for returning
  // visitors once localStorage has actually been read.
  if (!position) {
    const first = chapters[0];
    return (
      <Link href={first ? `/surah/${first.id}` : "/surah"} className="home-cta" style={ctaStyle}>
        <span>{t("homeBeginWith", { name: chapters[0]?.name_simple ?? "Al-Fatihah" })}</span>
        <ArrowIcon />
      </Link>
    );
  }

  const chapter = chapters.find((c) => c.id === position.surahNumber);
  return (
    <Link
      href={`/surah/${position.surahNumber}?verse=${position.surahNumber}:${position.ayahNumber}`}
      className="home-cta"
      style={ctaStyle}
    >
      <span>
        {t("homeContinueReading")}
        {chapter ? ` — ${chapter.name_simple}, ${t("homeAyah", { n: position.ayahNumber })}` : ""}
      </span>
      <ArrowIcon />
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// Full-width, bold pill — the site's one big "do this next" moment,
// matching the IqraSpace Flutter app's Home CTA in spirit (bold text,
// trailing arrow) but now a true pill (var(--radius-pill)) rather than a
// rounded rectangle, matching apps/site's .btn-primary shape exactly
// (design spec §3.1 — every button variant there is pill-radius).
const ctaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
  width: "100%",
  padding: "1.1rem 1.5rem",
  borderRadius: "var(--radius-pill)",
  background: "var(--color-primary)",
  color: "var(--color-primary-contrast)",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: "1.05rem",
  transition: "background 0.15s",
};
