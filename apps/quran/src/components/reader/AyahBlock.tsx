"use client";

import { useEffect, useState } from "react";
import { loadBookmarks, toggleBookmark } from "@/lib/preferences/storage";
import { ayahElementId } from "@/lib/reader/ayahDom";
import { TRANSLATION_LANGUAGES, type TranslationLanguageId } from "@/lib/content/translations";
import { ayahAudioUrl } from "@/lib/content/reciters";
import { useAudio } from "@/lib/audio/AudioProvider";
import { useReaderPreferences } from "@/lib/preferences/ReaderPreferencesProvider";
import { useTajweedSpans } from "@/lib/content/tajweedApi";
import { colorForTajweedCode } from "@/lib/content/tajweed";
import type { VerseWithSurah } from "@/lib/content/types";

type Props = {
  /** Needs `surahId` (not just a bare Verse) to identify this Ayah for
      audio playback/highlighting — every AyahBlock caller (AyahList) is
      already working from a VerseWithSurah, so this costs nothing. */
  verse: VerseWithSurah;
  /** Which translation language(s) to render, if any are present on this
      verse — empty means "Arabic only" (the default; Readme.md §7's
      "never show a translation the reader didn't ask for"). */
  enabledTranslations: TranslationLanguageId[];
  /** Whether the bookmark star renders at all for this ayah. Bookmarked
      state itself is still tracked/loaded regardless (see effect below)
      so toggling this back on doesn't lose anything — it only hides the
      control. */
  showBookmarks: boolean;
  /** Reading Mode has no audio at all (ReaderMode, SurahReader.tsx) —
      hides this Ayah's own play button when false; the bookmark button
      is unaffected (Reading Mode still allows bookmarking, matching the
      IqraSpace Flutter app's own AyahRichText, which only gates its
      audio icon on Reader Mode). Defaults to true so PageReader (no
      Reader Mode concept) is unaffected. */
  audioEnabled?: boolean;
  registerRef: (el: HTMLElement | null) => void;
  /** Rendered as a heading directly above this ayah — used by Page
      views to mark where a new Surah begins mid-list (a Surah reader
      already shows its name in the page header, so passes nothing). */
  surahHeading?: string;
};

/**
 * One ayah: Arabic text, verse-number badge, optional translation(s),
 * bookmark toggle. Bookmarking works with no account (Readme.md §15) —
 * see lib/preferences/storage.ts.
 */
export function AyahBlock({
  verse,
  enabledTranslations,
  showBookmarks,
  audioEnabled = true,
  registerRef,
  surahHeading,
}: Props) {
  const bookmarkKey = verse.verse_key;
  const [bookmarked, setBookmarked] = useState(false);
  const { preferences } = useReaderPreferences();
  const audio = useAudio();
  const isPlaying = audio.isActive(verse.surahId, verse.verse_number);
  const isLoading = isPlaying && audio.state.isLoading;
  const readMode = preferences.readModeEnabled;
  const tajweedSpans = useTajweedSpans(verse.surahId, verse.verse_number, preferences.tajweedEnabled);

  function togglePlay() {
    if (isPlaying) {
      audio.stop();
    } else {
      audio.playAyah(verse.surahId, verse.verse_number, ayahAudioUrl(preferences.reciter, verse.id));
    }
  }

  // Hydration-safe, same pattern as ReaderPreferencesProvider: default to
  // "not bookmarked" during SSR, correct it after mount.
  useEffect(() => {
    async function hydrate() {
      const isBookmarked = loadBookmarks().includes(bookmarkKey);
      await Promise.resolve(); // satisfies react-hooks/set-state-in-effect
      setBookmarked(isBookmarked);
    }
    hydrate();
  }, [bookmarkKey]);

  return (
    <li
      ref={registerRef}
      id={ayahElementId(verse.verse_key)}
      data-verse-key={verse.verse_key}
      tabIndex={-1}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        padding: isPlaying ? "1.25rem 0.75rem" : "1.25rem 0",
        borderBottom: "1px solid var(--color-border)",
        // "Now playing" highlight (Focus mode while listening) — an
        // outline, not a border, so it doesn't reflow surrounding Ayahs;
        // matches the IqraSpace Flutter app's teal now-playing outline.
        ...(isPlaying
          ? {
              outline: "2px solid var(--color-primary)",
              outlineOffset: "-2px",
              borderRadius: "0.5rem",
              background: "var(--color-bg)",
            }
          : {}),
      }}
    >
      {surahHeading && (
        <h2
          style={{
            margin: "0 0 0.5rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "var(--color-primary)",
          }}
        >
          {surahHeading}
        </h2>
      )}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        {!readMode && (
          <span
            aria-hidden="true"
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "1.75rem",
              height: "1.75rem",
              borderRadius: "9999px",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              fontSize: "0.75rem",
              marginTop: "0.25rem",
            }}
          >
            {verse.verse_number}
          </span>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            dir="rtl"
            lang="ar"
            style={{
              fontFamily: "var(--font-arabic)",
              // 26px base — matches the IqraSpace Flutter app's default
              // Arabic ayah size exactly (fontSizeProvider's initial 26).
              fontSize: "calc(1.625rem * var(--reader-arabic-scale))",
              lineHeight: "calc(2 * var(--reader-line-spacing))",
              margin: 0,
              color: "var(--color-text)",
              // Explicit, not left to the initial/inherited default:
              // WebKit (Safari/iPadOS) resolves an unset text-align to a
              // literal "left" regardless of `direction: rtl` — only
              // `direction` itself (glyph/character order) follows `dir`
              // there, not paragraph alignment — while Chromium/Firefox
              // correctly default it to "right" for an RTL block.
              // Confirmed live in WebKit: computed direction was "rtl"
              // but computed textAlign was "left", visually left-aligning
              // every Ayah against its number badge instead of the
              // reading surface's right edge. Hardcoding "right" (rather
              // than the logical "start" keyword) sidesteps relying on
              // any engine's start/direction resolution at all.
              textAlign: "right",
            }}
          >
            {tajweedSpans
              ? tajweedSpans.map((span, i) => (
                  <span key={i} style={span.ruleKey ? { color: colorForTajweedCode(span.ruleKey) } : undefined}>
                    {span.text}
                  </span>
                ))
              : verse.text_uthmani}
            {readMode && <> ﴿{verse.verse_number}﴾</>}
          </p>

          {!readMode && enabledTranslations.map((languageId) => {
            const language = TRANSLATION_LANGUAGES.find((l) => l.id === languageId);
            const translation = verse.translations.find((t) => t.resource_id === language?.resourceId);
            if (!translation) return null;
            // Urdu (Arabic-script) is the only translation language that's
            // RTL — Roman Urdu is Latin-script (LTR) despite the language,
            // and Telugu/English are both LTR too. Font-family follows the
            // same pattern as apps/site's Duas page: Telugu/Urdu need their
            // embedded Noto faces, everything else inherits the body font.
            const dir = languageId === "urdu" ? "rtl" : "ltr";
            const lang =
              languageId === "roman-urdu"
                ? "ur-Latn"
                : languageId === "urdu"
                  ? "ur"
                  : languageId === "telugu"
                    ? "te"
                    : "en";
            const fontFamily =
              languageId === "telugu"
                ? "var(--font-transliteration-telugu)"
                : languageId === "urdu"
                  ? "var(--font-transliteration-urdu)"
                  : undefined;
            return (
              <p
                key={languageId}
                dir={dir}
                lang={lang}
                style={{
                  fontSize: "calc(1rem * var(--reader-translation-scale))",
                  lineHeight: "calc(1.6 * var(--reader-line-spacing))",
                  color: "var(--color-text-muted)",
                  marginTop: "0.5rem",
                  marginBottom: 0,
                  ...(fontFamily ? { fontFamily } : {}),
                }}
              >
                {enabledTranslations.length > 1 && (
                  // Logical property, not `marginRight` — this label
                  // precedes the translation text in source order, and
                  // needs its gap on whichever side that text actually
                  // continues towards, which flips for the RTL (Urdu)
                  // paragraph above.
                  <span style={{ fontWeight: 600, marginInlineEnd: "0.4em" }}>{language?.label}:</span>
                )}
                {translation.text}
              </p>
            );
          })}

          {!readMode && (audioEnabled || showBookmarks) && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
            {audioEnabled && (
            <button
              type="button"
              onClick={togglePlay}
              aria-pressed={isPlaying}
              aria-label={
                isLoading
                  ? `Loading recitation for ayah ${verse.verse_key}`
                  : isPlaying
                    ? `Pause recitation for ayah ${verse.verse_key}`
                    : `Play recitation for ayah ${verse.verse_key}`
              }
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: "0.8rem",
                color: isPlaying ? "var(--color-primary)" : "var(--color-text-muted)",
                cursor: "pointer",
              }}
            >
              {isLoading ? "⏳ Loading…" : isPlaying ? "⏸ Playing" : "▶ Play"}
            </button>
            )}

            {showBookmarks && (
              <button
                type="button"
                onClick={() => setBookmarked(toggleBookmark(bookmarkKey).includes(bookmarkKey))}
                aria-pressed={bookmarked}
                aria-label={
                  bookmarked ? `Remove bookmark for ayah ${verse.verse_key}` : `Bookmark ayah ${verse.verse_key}`
                }
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: "0.8rem",
                  color: bookmarked ? "var(--color-accent-text)" : "var(--color-text-muted)",
                  cursor: "pointer",
                }}
              >
                {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
              </button>
            )}
          </div>
          )}
        </div>
      </div>
    </li>
  );
}
