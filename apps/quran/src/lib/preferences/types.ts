import type { TranslationLanguageId } from "@/lib/content/translations";
import type { ArabicFontId } from "@/lib/content/arabicFonts";
import { DEFAULT_RECITER, type ReciterId } from "@/lib/content/reciters";
import { DEFAULT_LISTENING_TRACK, type ListeningTrack } from "@/lib/content/listeningAudio";

/**
 * Reader preferences (Readme.md §10/§11) — deliberately the same shape as
 * supabase/migrations/0001_init_schema.sql's user_preferences table, so
 * Phase 5's "upgrade local data to synced data" (ARCHITECTURE.md §5) is a
 * direct mapping, not a translation layer.
 */
export type Theme = "light" | "dark" | "sepia" | "system";
export type ReadingWidth = "narrow" | "comfortable" | "wide";
/** UI chrome language (nav labels, Settings, headings) — matches the
    IqraSpace Flutter app's own English/Telugu/Urdu app-language setting.
    Independent of the Quran ayah Translation setting: this only affects
    this app's own interface text, never the Quran Arabic text or any
    translation content. */
export type UiLanguage = "en" | "te" | "ur";
/** Which of the IqraSpace Flutter app's 3 Reader Modes this Surah reader
    behaves as — matching Flutter's actual audio architecture, not just
    its UI labels:
    - "reading": no audio at all.
    - "listening": the whole-Surah nav-bar Play button streams a single
      continuous file directly from Cloudflare R2 (lib/content/
      listeningAudio.ts) — never the per-ayah Quran API — with no
      per-Ayah highlight (there's no per-ayah timing data for a local
      whole-Surah file), matching Flutter's `playSurahLocal` exactly.
    - "readingListening": the whole-Surah Play button instead queues
      per-Ayah audio from the Quran API, with now-playing highlight/
      auto-scroll — this app's original, pre-Reader-Mode behavior,
      unchanged.
    Per-Ayah tap-to-play buttons (AyahBlock) always use the Quran API
    regardless of mode (only hidden entirely in "reading") — Listening
    Mode's R2 file is a separate, additional whole-Surah control, not a
    replacement for them. See AUDIO.md's "Why this exists" for the
    background-playback reliability reason this split exists at all. */
export type ReaderMode = "listening" | "reading" | "readingListening";

export type ReaderPreferences = {
  theme: Theme;
  /** Which Arabic Quran typeface to render Ayahs in. Defaults to
      "amiriQuran" — the Uthmani-cut Amiri Quran face, matching the
      IqraSpace Flutter app's own default (`defaultArabicFontFamily` in
      its arabic_fonts.dart) so a first-time reader sees the same Quran
      typeface on either platform. */
  arabicFont: ArabicFontId;
  arabicFontScale: number;
  translationFontScale: number;
  lineSpacing: number;
  readingWidth: ReadingWidth;
  /** Which translation language(s) to show, e.g. ["english"]. Empty by
      default — the Quran Arabic text is the thing being read; translation
      is opt-in, not shown until a reader explicitly turns one on. */
  enabledTranslations: TranslationLanguageId[];
  /** Whether the per-ayah bookmark star is shown at all. Defaults to true
      (unlike enabledTranslations) — bookmarking is an existing, no-account
      feature (Readme.md §15) already visible on every ayah; this toggle
      is for readers who want to hide it for a cleaner look, not an
      opt-in reveal like translations. */
  showBookmarks: boolean;
  /** Renders the original scanned Mushaf page (via PdfViewer) instead of
      the typeset AyahList — off by default, like enabledTranslations:
      this is an opt-in alternate reading surface ("see the real Mushaf"),
      not a replacement for the accessible, translation-capable default
      view. Only affects the Surah reader — see PDF-CONTENT.md for why a
      Juz-level or Mushaf-page PDF view isn't offered. */
  pdfMode: boolean;
  /** Which reciter's audio to play for per-Ayah/whole-Surah playback
      (lib/audio/AudioProvider.tsx). Defaults to the same reciter the
      IqraSpace Flutter app defaults to. */
  reciter: ReciterId;
  /** Constant-speed auto-scroll rate in px/second while reading a Surah
      silently — matches the IqraSpace Flutter app's own auto-scroll
      speed range/default exactly. Persisted, unlike whether auto-scroll
      is currently ON (that's ReaderPreferencesProvider's separate,
      non-persisted `autoScrollEnabled` — see its own comment for why). */
  autoScrollSpeed: number;
  /** Distraction-free reading — hides per-Ayah chrome (play/bookmark
      buttons, translation lines, the verse-number badge) and shows only
      the colored Arabic text, matching the IqraSpace Flutter app's Read
      Mode toggle. Off by default — an opt-in alternate view, like
      pdfMode. */
  readModeEnabled: boolean;
  /** Live per-letter Tajweed coloring of the Arabic text (fetched from Al
      Quran Cloud's `quran-tajweed` edition — see lib/content/tajweedApi.ts),
      matching the IqraSpace Flutter app's Tajweed coloring. Off by
      default: this triggers a live third-party fetch per Surah opened,
      unlike the rest of this app's build-time-synced content, so it's
      opt-in rather than on for every anonymous visitor by default. */
  tajweedEnabled: boolean;
  /** UI chrome language — see UiLanguage's own doc comment. */
  uiLanguage: UiLanguage;
  /** Reader Mode — see ReaderMode's own doc comment. Defaults to
      "readingListening", i.e. exactly this app's pre-existing reading
      experience — introducing this preference changes nothing for an
      existing reader until they explicitly pick a different mode. */
  readerMode: ReaderMode;
  /** Listening Mode's audio-source choice — see ListeningTrack's own doc
      comment (lib/content/listeningAudio.ts): "arabicOnly" streams
      `arabic/{NNN}.mp3`, "arabicPlusUrdu" streams `urdu/{NNN}.mp3`
      instead (never both/never chained). Read fresh every time
      Listening Mode's Play button (or a Previous/Next Surah while it's
      active) is pressed, matching Flutter's own
      `IqraAudioHandler.playSurahLocal`. */
  listeningTrack: ListeningTrack;
};

export const DEFAULT_PREFERENCES: ReaderPreferences = {
  theme: "system",
  arabicFont: "amiriQuran",
  arabicFontScale: 1,
  translationFontScale: 1,
  lineSpacing: 1,
  readingWidth: "comfortable",
  enabledTranslations: [],
  showBookmarks: true,
  pdfMode: false,
  reciter: DEFAULT_RECITER,
  autoScrollSpeed: 30,
  readModeEnabled: false,
  tajweedEnabled: false,
  uiLanguage: "en",
  readerMode: "readingListening",
  listeningTrack: DEFAULT_LISTENING_TRACK,
};

export const FONT_SCALE_MIN = 0.75;
export const FONT_SCALE_MAX = 1.75;
export const FONT_SCALE_STEP = 0.125;

export const LINE_SPACING_MIN = 0.85;
export const LINE_SPACING_MAX = 1.5;
export const LINE_SPACING_STEP = 0.125;

export const AUTO_SCROLL_SPEED_MIN = 10;
export const AUTO_SCROLL_SPEED_MAX = 120;
export const AUTO_SCROLL_SPEED_STEP = 5;
