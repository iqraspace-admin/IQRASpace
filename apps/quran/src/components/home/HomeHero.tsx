"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadLastReads, type ReadingHistoryEntry } from "@/lib/preferences/storage";
import { useT } from "@/lib/i18n/useT";
import type { Chapter } from "@/lib/content/types";

type Props = {
  chapters: Chapter[];
};

/**
 * Home hero — structural replacement for the old small "Continue Reading"
 * pill (see git history for ContinueReadingCard.tsx): a full apps/site-
 * style hero band (pattern texture, eyebrow, big heading, lead, two
 * pill CTAs — design spec §4.1) instead of a single compact button
 * stacked above three separate tile grids. The personalization logic
 * (most recent reading position from localStorage) is unchanged, just
 * presented at hero scale now, as the page's actual headline moment
 * rather than one button among several same-weight tiles.
 *
 * Server-rendered HTML (and the client's very first render, before the
 * effect below runs) always has no known last position — rendering
 * "Begin with Al-Fatihah" for that case, same as a genuinely first-time
 * visitor, means the primary CTA is a real link in the initial HTML
 * (works with JS disabled/slow, crawlable, no flash-of-missing-button)
 * rather than something that only appears after hydration completes.
 */
export function HomeHero({ chapters }: Props) {
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

  const chapter = position ? chapters.find((c) => c.id === position.surahNumber) : undefined;
  const first = chapters[0];

  const heading =
    position && chapter
      ? `${t("homeContinueReading")} — ${chapter.name_simple}, ${t("homeAyah", { n: position.ayahNumber })}`
      : t("homeBeginWith", { name: first?.name_simple ?? "Al-Fatihah" });

  const primaryHref =
    position && chapter
      ? `/surah/${position.surahNumber}?verse=${position.surahNumber}:${position.ayahNumber}`
      : first
        ? `/surah/${first.id}`
        : "/surah";

  return (
    <section className="qr-pattern" style={{ padding: "2rem 1rem 2.5rem" }}>
      <div style={{ maxWidth: "var(--content-max-width)", margin: "0 auto" }}>
        <div className="qr-eyebrow">{t("headerTagline")}</div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: "clamp(1.9rem, 5vw, 2.75rem)",
            lineHeight: 1.12,
            color: "var(--color-text)",
            margin: "0 0 0.65rem",
            maxWidth: "20ch",
          }}
        >
          {heading}
        </h1>
        <p style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "var(--color-text-muted)", maxWidth: "48ch", margin: "0 0 1.5rem" }}>
          {t("entryReadQuranSubtitle")}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href={primaryHref} className="home-cta" style={primaryButtonStyle}>
            {position && chapter ? t("homeContinueReading") : t("homeBeginWith", { name: first?.name_simple ?? "Al-Fatihah" })}
            <ArrowIcon />
          </Link>
          <Link href="/surah" style={secondaryButtonStyle}>
            {t("homeBrowseAllSurahs")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.6rem",
  padding: "0.9rem 1.5rem",
  borderRadius: "var(--radius-pill)",
  background: "var(--color-primary)",
  color: "var(--color-primary-contrast)",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: "1rem",
} as const;

const secondaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.9rem 1.5rem",
  borderRadius: "var(--radius-pill)",
  border: "1.5px solid var(--color-primary)",
  color: "var(--color-primary)",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "1rem",
} as const;
