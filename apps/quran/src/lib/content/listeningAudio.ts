/**
 * Listening Mode's whole-Surah audio — streamed directly from the
 * IqraSpace Flutter app's own dedicated Cloudflare R2 bucket
 * (`audio.iqraspace.org`), never from the per-ayah Quran API. Ported
 * from `apps/flutter/lib/core/constants/arabic_surah_audio.dart` /
 * `urdu_surah_audio.dart` — same base URL, same object-name pattern, same
 * split-part surah list — so the website streams the exact same files.
 * See `apps/flutter/AUDIO.md` for the full storage-layout writeup.
 *
 * Reading + Listening Mode is UNAFFECTED by this file — it still plays
 * per-ayah audio from the Quran API (lib/content/reciters.ts), since
 * that's what drives its ayah-level highlight/sync; only Listening
 * Mode's own whole-Surah playback uses these R2 URLs.
 */

const R2_AUDIO_BASE_URL = "https://audio.iqraspace.org";

/** Surahs split into sequential parts as a historical Supabase-Storage
    50MiB-object-limit workaround (R2 itself has no such limit, so the
    already-split files were kept as-is rather than re-merged — see
    AUDIO.md). Object names `arabic/{NNN}_part{i}.mp3`, i = 1-based.
    Every other Surah is a single `arabic/{NNN}.mp3` file. */
const ARABIC_SPLIT_PART_COUNT: Record<number, number> = {
  4: 2,
  5: 2,
  6: 2,
  7: 2,
  9: 2,
};

export type ListeningTrack = "arabicOnly" | "arabicPlusUrdu";
export const DEFAULT_LISTENING_TRACK: ListeningTrack = "arabicOnly";

export type SurahAudioPart = { url: string };

function pad3(surahNumber: number): string {
  return String(surahNumber).padStart(3, "0");
}

/** The Al-Afasy recitation part(s) for `surahNumber`, in playback order
    — almost always exactly one entry. Empty if out of range. */
export function getArabicListeningParts(surahNumber: number): SurahAudioPart[] {
  if (surahNumber < 1 || surahNumber > 114) return [];
  const splitCount = ARABIC_SPLIT_PART_COUNT[surahNumber];
  const padded = pad3(surahNumber);
  if (splitCount) {
    return Array.from({ length: splitCount }, (_, i) => ({
      url: `${R2_AUDIO_BASE_URL}/arabic/${padded}_part${i + 1}.mp3`,
    }));
  }
  return [{ url: `${R2_AUDIO_BASE_URL}/arabic/${padded}.mp3` }];
}

/** The Urdu-translation track for `surahNumber` — a single, self-
    contained file that already interleaves the Arabic recitation with
    its Urdu translation ayah by ayah (NOT Urdu-only — see AUDIO.md's
    "Storage layout"). Never chained after the plain Arabic file: the
    `arabic/` and `urdu/` tracks are mutually exclusive alternatives
    picked by the Listening Track setting, exactly matching
    `IqraAudioHandler.playSurahLocal`'s "never both, never one after the
    other" contract. */
export function getUrduListeningParts(surahNumber: number): SurahAudioPart[] {
  if (surahNumber < 1 || surahNumber > 114) return [];
  return [{ url: `${R2_AUDIO_BASE_URL}/urdu/${pad3(surahNumber)}.mp3` }];
}

/** The part(s) to play for `surahNumber` under the given Listening
    Track — the single call site SurahReader/MiniPlayerBar need, so
    neither has to know the arabicOnly/arabicPlusUrdu branching itself. */
export function getListeningParts(surahNumber: number, track: ListeningTrack): SurahAudioPart[] {
  return track === "arabicPlusUrdu" ? getUrduListeningParts(surahNumber) : getArabicListeningParts(surahNumber);
}
