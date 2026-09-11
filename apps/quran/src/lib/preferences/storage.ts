import { DEFAULT_PREFERENCES, type ReaderPreferences } from "./types";

/**
 * Local-device storage for reader preferences and reading position — this
 * is what makes reading/bookmarking/continuing work with zero account
 * (Readme.md §9, ARCHITECTURE.md §5). All access is guarded for SSR
 * (localStorage doesn't exist on the server) and wrapped in try/catch —
 * a private-browsing mode or blocked site data should degrade to
 * defaults, never crash the reader (Readme.md §42's resilience principle
 * applied to local storage too, not just the network).
 */

const PREFERENCES_KEY = "iqraspace-quran:preferences";
const LAST_POSITION_KEY = "iqraspace-quran:last-position";
const LAST_READS_KEY = "iqraspace-quran:last-reads";
const BOOKMARKS_KEY = "iqraspace-quran:bookmarks";

/** Most-recent-first reading history, capped at this many surahs — mirrors
    the IqraSpace Flutter app's LastReadNotifier so both platforms "feel
    like the same product" on this feature too. */
const MAX_LAST_READS = 8;

export function loadPreferences(): ReaderPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<ReaderPreferences>) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: ReaderPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    // Storage unavailable (private mode, quota, blocked site data) — the
    // reader still works, it just won't remember this change.
  }
}

export type ReadingHistoryEntry = {
  surahNumber: number;
  ayahNumber: number;
  updatedAt: string;
};

/**
 * Recent reading history — most-recent-first, at most one entry per Surah
 * (re-reading a Surah moves it back to the front rather than adding a
 * duplicate), capped at MAX_LAST_READS. Powers both the home page's
 * single "Continue Reading" card (the first entry) and its plural "Last
 * Reads" row (the rest) — see ContinueReadingCard/LastReadsRow.
 */
export function loadLastReads(): ReadingHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LAST_READS_KEY);
    if (raw) return JSON.parse(raw) as ReadingHistoryEntry[];
    // One-time migration: readers who already had a single last position
    // (this key's shape before it became a history) shouldn't see "Start
    // Reading" the first time this ships — seed the list from it. The old
    // key itself is left alone; harmless if it's never read again.
    const legacyRaw = window.localStorage.getItem(LAST_POSITION_KEY);
    return legacyRaw ? [JSON.parse(legacyRaw) as ReadingHistoryEntry] : [];
  } catch {
    return [];
  }
}

/** Removes any existing entry for this Surah, then prepends a fresh one —
    most-recent-first, one entry per Surah, capped at MAX_LAST_READS. */
export function recordLastRead(position: Omit<ReadingHistoryEntry, "updatedAt">): ReadingHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const rest = loadLastReads().filter((entry) => entry.surahNumber !== position.surahNumber);
    const next = [{ ...position, updatedAt: new Date().toISOString() }, ...rest].slice(0, MAX_LAST_READS);
    window.localStorage.setItem(LAST_READS_KEY, JSON.stringify(next));
    return next;
  } catch {
    // Same as savePreferences — non-fatal.
    return [];
  }
}

export type BookmarkKey = string; // `${surahNumber}:${ayahNumber}`, matches verse_key shape

export function loadBookmarks(): BookmarkKey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_KEY);
    return raw ? (JSON.parse(raw) as BookmarkKey[]) : [];
  } catch {
    return [];
  }
}

export function toggleBookmark(key: BookmarkKey): BookmarkKey[] {
  const current = loadBookmarks();
  const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    } catch {
      // Non-fatal — see above.
    }
  }
  return next;
}
