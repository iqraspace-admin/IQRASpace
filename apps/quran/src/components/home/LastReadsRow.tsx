"use client";

import { loadLastReads, type ReadingHistoryEntry } from "@/lib/preferences/storage";
import { useT } from "@/lib/i18n/useT";
import type { Chapter } from "@/lib/content/types";
import { useHydratedState } from "./useHydratedState";
import { HomeCard } from "./HomeCard";
import { headingStyle, rowStyle } from "./homeRowStyles";

type Props = {
  chapters: Chapter[];
};

/**
 * "Last Reads" (plural) — every entry of the reading history beyond the
 * one already shown as the big "Continue Reading" card, one-click resume
 * for each. Mirrors the IqraSpace Flutter app's Home screen section,
 * which is likewise gated on having more than one entry: with only one
 * (or zero) recent reads, this row would just repeat the Continue
 * Reading card, so it renders nothing.
 */
export function LastReadsRow({ chapters }: Props) {
  const entries = useHydratedState<ReadingHistoryEntry[]>(loadLastReads, []);
  const { t } = useT();

  const rest = entries.slice(1);
  if (rest.length === 0) return null;

  return (
    <section style={{ width: "100%" }}>
      <h2 style={{ ...headingStyle, margin: "0 0 0.75rem" }}>{t("homeLastReads")}</h2>
      <div style={rowStyle}>
        {rest.map((entry) => {
          const chapter = chapters.find((c) => c.id === entry.surahNumber);
          return (
            <HomeCard
              key={entry.surahNumber}
              href={`/surah/${entry.surahNumber}?verse=${entry.surahNumber}:${entry.ayahNumber}`}
              title={chapter?.name_simple ?? `Surah ${entry.surahNumber}`}
              subtitle={t("homeAyah", { n: entry.ayahNumber })}
            />
          );
        })}
      </div>
    </section>
  );
}
