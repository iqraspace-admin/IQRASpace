"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { loadBookmarks, toggleBookmark, type BookmarkKey } from "@/lib/preferences/storage";
import type { Chapter } from "@/lib/content/types";

type Props = {
  chapters: Chapter[];
};

/**
 * Client-rendered bookmarks list — hydrates the bookmark keys
 * (`"surah:ayah"` strings, unchanged storage shape) from localStorage and
 * resolves each one's Surah name from `chapters`, the same
 * already-proven pattern ContinueReadingCard uses for its last position.
 * Deliberately doesn't change the bookmark storage format (no snippet/
 * name caching) — see the implementation plan for why.
 */
export function BookmarksList({ chapters }: Props) {
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

  if (keys.length === 0) {
    return (
      <p style={{ color: "var(--color-text-muted)" }}>
        No bookmarks yet — tap the star on any Ayah while reading to save it here.
      </p>
    );
  }

  const entries = keys
    .map((key) => {
      const [surahNumber, ayahNumber] = key.split(":").map(Number);
      return { key, surahNumber, ayahNumber, chapter: chapters.find((c) => c.id === surahNumber) };
    })
    .sort((a, b) => a.surahNumber - b.surahNumber || a.ayahNumber - b.ayahNumber);

  function remove(key: BookmarkKey) {
    setKeys(toggleBookmark(key));
  }

  return (
    <ol aria-label="Bookmarked Ayahs" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {entries.map(({ key, surahNumber, ayahNumber, chapter }) => (
        <li key={key} style={rowStyle}>
          <Link href={`/surah/${surahNumber}?verse=${surahNumber}:${ayahNumber}`} style={linkStyle}>
            <span>
              <strong>{chapter?.name_simple ?? `Surah ${surahNumber}`}</strong>
              <span style={{ color: "var(--color-text-muted)" }}> — Ayah {ayahNumber}</span>
            </span>
            {chapter && (
              <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)", fontSize: "1.1rem" }}>
                {chapter.name_arabic}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => remove(key)}
            aria-label={`Remove bookmark for ${chapter?.name_simple ?? `Surah ${surahNumber}`}, Ayah ${ayahNumber}`}
            style={removeButtonStyle}
          >
            Remove
          </button>
        </li>
      ))}
    </ol>
  );
}

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
  padding: "0.85rem 0",
  borderBottom: "1px solid var(--color-border)",
};

const linkStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  textDecoration: "none",
  color: "var(--color-text)",
};

const removeButtonStyle: CSSProperties = {
  flexShrink: 0,
  background: "none",
  border: "1px solid var(--color-border)",
  borderRadius: "0.375rem",
  padding: "0.35rem 0.65rem",
  color: "var(--color-text-muted)",
  fontSize: "0.8rem",
  cursor: "pointer",
};
