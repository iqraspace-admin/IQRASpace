import chaptersIndex from "@/content/generated/chapters.json";

/**
 * A client-safe slice of the synced chapters list (id/name/verses_count
 * only) — lib/content/quran.ts's getAllChapters() is server-only (reads
 * via node:fs), but chapters.json itself is small (114 entries) and
 * already committed content, safe to import directly into a client
 * bundle. Used by MiniPlayerBar, which needs a Surah's name and ayah
 * count without a server round-trip.
 */
export type ChapterSummary = { id: number; name_simple: string; name_arabic: string; verses_count: number };

const CHAPTERS: readonly ChapterSummary[] = [...chaptersIndex.chapters].sort((a, b) => a.id - b.id);

export function getChapterSummary(id: number): ChapterSummary | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

export function getAdjacentChapterId(id: number, direction: "previous" | "next"): number | undefined {
  const index = CHAPTERS.findIndex((c) => c.id === id);
  if (index === -1) return undefined;
  const adjacent = direction === "previous" ? CHAPTERS[index - 1] : CHAPTERS[index + 1];
  return adjacent?.id;
}

/** Global (1-6236) Ayah number for `ayahNumber` within surah `surahId` —
    see lib/content/reciters.ts's own doc comment: this is exactly what
    Verse.id already is, so it's safe to compute from verses_count alone,
    with no per-ayah data needed. */
export function getGlobalAyahId(surahId: number, ayahNumber: number): number {
  let offset = 0;
  for (const chapter of CHAPTERS) {
    if (chapter.id >= surahId) break;
    offset += chapter.verses_count;
  }
  return offset + ayahNumber;
}
