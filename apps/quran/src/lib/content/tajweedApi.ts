"use client";

import { useEffect, useState } from "react";
import { parseTajweedMarkup, type TajweedSpan } from "./tajweed";

/**
 * Fetches Tajweed-tagged Arabic text from Al Quran Cloud's public,
 * keyless `quran-tajweed` edition — the same source/edition the
 * IqraSpace Flutter app uses for its own Tajweed coloring. Deliberately
 * a live client-side fetch, not build-time-synced content like the rest
 * of this app's Quran text: it's opt-in (see ReaderPreferences.tajweedEnabled),
 * so only readers who turn it on ever cause this extra network call, and
 * the reader still works with plain (uncolored) text if it's slow or the
 * host is unreachable — see useTajweedSpans' fallback below.
 */

type SurahTajweed = Map<number, TajweedSpan[]>; // keyed by verse_number

const cache = new Map<number, Promise<SurahTajweed | null>>();

async function fetchSurahTajweed(surahNumber: number): Promise<SurahTajweed | null> {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-tajweed`);
    if (!response.ok) return null;
    const json = await response.json();
    const ayahs = json?.data?.ayahs as { numberInSurah: number; text: string }[] | undefined;
    if (!ayahs) return null;
    const map: SurahTajweed = new Map();
    for (const ayah of ayahs) {
      map.set(ayah.numberInSurah, parseTajweedMarkup(ayah.text));
    }
    return map;
  } catch {
    return null;
  }
}

function getSurahTajweed(surahNumber: number): Promise<SurahTajweed | null> {
  let entry = cache.get(surahNumber);
  if (!entry) {
    entry = fetchSurahTajweed(surahNumber);
    cache.set(surahNumber, entry);
  }
  return entry;
}

/** Returns this Ayah's Tajweed spans once loaded, or `null` while loading,
    unavailable, or disabled — callers should fall back to plain text for
    `null`, exactly like the Flutter reader falls back when a facet of a
    surah fetch is missing. */
export function useTajweedSpans(surahId: number, verseNumber: number, enabled: boolean): TajweedSpan[] | null {
  const [spans, setSpans] = useState<TajweedSpan[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!enabled) {
        await Promise.resolve(); // satisfies react-hooks/set-state-in-effect
        if (!cancelled) setSpans(null);
        return;
      }
      const surahSpans = await getSurahTajweed(surahId);
      if (!cancelled) setSpans(surahSpans?.get(verseNumber) ?? null);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [surahId, verseNumber, enabled]);

  return spans;
}
