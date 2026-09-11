/**
 * Reciters this app offers for per-Ayah audio, mirrored from the
 * IqraSpace Flutter app's `lib/core/constants/reciters.dart` — same
 * identifiers, same display names, so both platforms offer literally the
 * same audio files, not just similarly-named ones. Mirrors
 * lib/content/translations.ts's shape/role: the single source of truth
 * the Settings UI reads from.
 *
 * These identifiers are Al Quran Cloud (alquran.cloud) "edition" ids for
 * its `format=audio&type=versebyverse` editions — the same source the
 * Flutter app uses. Rather than calling Al Quran Cloud's API at request
 * time (an extra network hop, and a dependency this app's existing
 * content pipeline has no other reason to take on), this app builds the
 * per-Ayah URL directly against the underlying CDN those editions are
 * served from (`cdn.islamic.network`) — a stable, keyless, predictable
 * URL pattern confirmed live (`/quran/audio/128/{reciter}/{n}.mp3`
 * returns the correct Ayah's mp3 for both a Surah-1 and a Surah-2 Ayah).
 * `{n}` is the GLOBAL Ayah number (1-6236), which is exactly what this
 * app's already-synced `Verse.id` already is (confirmed: Surah 1's 7
 * Ayahs are id 1-7, Surah 2 Ayah 1 is id 8) — so no content-pipeline
 * change, no new credentials, no new dependency was needed to add audio.
 */
export type ReciterId = "ar.alafasy" | "ar.abdulsamad" | "ar.husary" | "ar.abdurrahmaansudais" | "ar.mahermuaiqly";

export type Reciter = {
  id: ReciterId;
  label: string;
};

export const RECITERS: readonly Reciter[] = [
  { id: "ar.alafasy", label: "Mishary Alafasy" },
  { id: "ar.abdulsamad", label: "Abdul Basit Abdul Samad" },
  { id: "ar.husary", label: "Mahmoud Al-Husary" },
  { id: "ar.abdurrahmaansudais", label: "Abdurrahmaan As-Sudais" },
  { id: "ar.mahermuaiqly", label: "Maher Al Muaiqly" },
];

export const DEFAULT_RECITER: ReciterId = "ar.alafasy";

export function reciterLabel(id: ReciterId): string {
  return RECITERS.find((r) => r.id === id)?.label ?? id;
}

/** The mp3 URL for one Ayah, given its global (1-6236) Ayah number — see
    the module doc comment above for how/why this is safe to build
    client-side with no API call. `128` is the bitrate directory Al Quran
    Cloud's CDN serves these editions at. */
export function ayahAudioUrl(reciter: ReciterId, globalAyahId: number): string {
  return `https://cdn.islamic.network/quran/audio/128/${reciter}/${globalAyahId}.mp3`;
}
