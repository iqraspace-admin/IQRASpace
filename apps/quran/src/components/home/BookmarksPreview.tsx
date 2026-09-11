"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { loadBookmarks, type BookmarkKey } from "@/lib/preferences/storage";
import type { Chapter } from "@/lib/content/types";

type Props = {
  chapters: Chapter[];
};

const MAX_PREVIEW = 5;

/**
 * Home's "Bookmarks" preview — mirrors the IqraSpace Flutter app's Home
 * screen bookmarks section (heading + "See all" + up to a handful of
 * cards, or an empty-state hint). Resolves the same bare `"surah:ayah"`
 * keys BookmarksList.tsx already resolves for the full `/bookmarks`
 * page, capped here at MAX_PREVIEW and newest-looking-first isn't
 * possible (no timestamp is stored — see BookmarksList's own note), so
 * this uses the same Mushaf-order sort for consistency with that page.
 */
export function BookmarksPreview({ chapters }: Props) {
  const [keys, setKeys] = useState<BookmarkKey[] | null>(null);

  useEffect(() => {
    async function hydrate() {
      const loaded = loadBookmarks();
      await Promise.resolve(); // satisfies react-hooks/set-state-in-effect
      setKeys(loaded);
    }
    hydrate();
  }, []);

  if (keys === null) return null; // avoid a first-render "no bookmarks" flash before hydration

  return (
    <section style={{ width: "100%" }}>
      <div style={headingRowStyle}>
        <h2 style={headingStyle}>Bookmarks</h2>
        <Link href="/bookmarks" style={seeAllStyle}>
          See all
        </Link>
      </div>

      {keys.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
          No bookmarks yet — tap the star icon while reading to save an Ayah.
        </p>
      ) : (
        <div style={rowStyle}>
          {keys
            .map((key) => {
              const [surahNumber, ayahNumber] = key.split(":").map(Number);
              return { key, surahNumber, ayahNumber, chapter: chapters.find((c) => c.id === surahNumber) };
            })
            .sort((a, b) => a.surahNumber - b.surahNumber || a.ayahNumber - b.ayahNumber)
            .slice(0, MAX_PREVIEW)
            .map(({ key, surahNumber, ayahNumber, chapter }) => (
              <Link key={key} href={`/surah/${surahNumber}?verse=${surahNumber}:${ayahNumber}`} style={cardStyle}>
                <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                  {chapter?.name_simple ?? `Surah ${surahNumber}`}
                </span>
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>Ayah {ayahNumber}</span>
              </Link>
            ))}
        </div>
      )}
    </section>
  );
}

const headingRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: "0.75rem",
};

const headingStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 600,
  fontSize: "1.125rem",
  color: "var(--color-text)",
  margin: 0,
};

const seeAllStyle: CSSProperties = {
  color: "var(--color-primary)",
  fontWeight: 600,
  fontSize: "0.85rem",
  textDecoration: "none",
};

const rowStyle: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  overflowX: "auto",
  paddingBottom: "0.25rem",
  scrollSnapType: "x proximity",
  WebkitOverflowScrolling: "touch",
};

const cardStyle: CSSProperties = {
  flexShrink: 0,
  scrollSnapAlign: "start",
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  width: "9.5rem",
  padding: "0.75rem 0.9rem",
  borderRadius: "0.5rem",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  textDecoration: "none",
};
