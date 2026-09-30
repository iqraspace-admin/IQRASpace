"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { loadBookmarks, toggleBookmark, type BookmarkKey } from "@/lib/preferences/storage";
import { useT } from "@/lib/i18n/useT";
import type { Chapter } from "@/lib/content/types";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

type Props = {
  chapters: Chapter[];
};

/**
 * Client-rendered bookmarks list — hydrates the bookmark keys
 * (`"surah:ayah"` strings, unchanged storage shape) from localStorage and
 * resolves each one's Surah name from `chapters`, the same
 * already-proven pattern HomeHero uses for its last reading position.
 * Deliberately doesn't change the bookmark storage format (no snippet/
 * name caching) — see the implementation plan for why.
 */
/** Page heading/subtitle — a tiny client component (not the Server
    Component page itself) purely so it can call useT(); split out rather
    than making the whole /bookmarks page client-side, which would lose
    its server-side chapters lookup. Now a real page-hero (breadcrumb +
    eyebrow + H1 + lead), matching every other list page's shell instead
    of a bare <h1>. */
export function BookmarksHeader() {
  const { t } = useT();
  return (
    <>
      <Breadcrumbs trail={[{ href: "/bookmarks", label: t("bookmarksTitle") }]} />
      <div className="qr-page-hero">
        <div className="qr-eyebrow">Your Ayahs</div>
        <h1>{t("bookmarksTitle")}</h1>
        <p className="qr-lead">{t("bookmarksSubtitle")}</p>
      </div>
    </>
  );
}

export function BookmarksList({ chapters }: Props) {
  const [keys, setKeys] = useState<BookmarkKey[] | null>(null);
  const { t } = useT();

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
    return <p style={{ color: "var(--color-text-muted)" }}>{t("bookmarksEmpty")}</p>;
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
    <ol aria-label="Bookmarked Ayahs" className="qr-card-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {entries.map(({ key, surahNumber, ayahNumber, chapter }) => (
        <li key={key} className="qr-card row" style={{ padding: "0.85rem 1rem" }}>
          <Link href={`/surah/${surahNumber}?verse=${surahNumber}:${ayahNumber}`} style={linkStyle}>
            <span>
              <strong>{chapter?.name_simple ?? `Surah ${surahNumber}`}</strong>
              <span style={{ color: "var(--color-text-muted)" }}> — Ayah {ayahNumber}</span>
            </span>
            {chapter && (
              <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)", fontSize: "1.1rem", color: "var(--color-primary)" }}>
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
            {t("bookmarksRemove")}
          </button>
        </li>
      ))}
    </ol>
  );
}

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
  border: "1.5px solid var(--color-border-strong)",
  borderRadius: "var(--radius-pill)",
  padding: "0.4rem 0.85rem",
  color: "var(--color-text-muted)",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
};
