"use client";

import Link from "next/link";
import { loadBookmarks, type BookmarkKey } from "@/lib/preferences/storage";
import { useT } from "@/lib/i18n/useT";
import type { Chapter } from "@/lib/content/types";
import { useHydratedState } from "./useHydratedState";
import { HomeCard } from "./HomeCard";
import { headingRowStyle, headingStyle, seeAllStyle, rowStyle } from "./homeRowStyles";

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
  const keys = useHydratedState<BookmarkKey[] | null>(loadBookmarks, null);
  const { t } = useT();

  if (keys === null) return null; // avoid a first-render "no bookmarks" flash before hydration

  return (
    <section style={{ width: "100%" }}>
      <div style={headingRowStyle}>
        <h2 style={headingStyle}>{t("homeBookmarks")}</h2>
        <Link href="/bookmarks" style={seeAllStyle}>
          {t("homeSeeAll")}
        </Link>
      </div>

      {keys.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>{t("homeNoBookmarksYet")}</p>
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
              <HomeCard
                key={key}
                href={`/surah/${surahNumber}?verse=${surahNumber}:${ayahNumber}`}
                title={chapter?.name_simple ?? `Surah ${surahNumber}`}
                subtitle={t("homeAyah", { n: ayahNumber })}
              />
            ))}
        </div>
      )}
    </section>
  );
}
