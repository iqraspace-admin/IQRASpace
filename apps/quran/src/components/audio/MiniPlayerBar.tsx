"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { CSSProperties } from "react";
import { useAudio, useAudioProgress } from "@/lib/audio/AudioProvider";
import { useReaderPreferences } from "@/lib/preferences/ReaderPreferencesProvider";
import { useT } from "@/lib/i18n/useT";
import { ayahAudioUrl } from "@/lib/content/reciters";
import { getListeningParts } from "@/lib/content/listeningAudio";
import { getAdjacentChapterId, getChapterSummary, getGlobalAyahId } from "@/lib/content/chapterIndex";

/**
 * Persistent "now playing" bar — mounted once in the root layout (below
 * SiteHeader) so audio keeps playing, and stays controllable, while
 * navigating between pages, matching the IqraSpace Flutter app's own
 * MiniPlayerBar (core/widgets/mini_player_bar.dart). Renders nothing while
 * idle. Tapping the bar itself opens the Surah at the currently-playing
 * Ayah; Previous/Next Surah rebuild a fresh whole-Surah queue client-side
 * from the already-loaded chapters index (see chapterIndex.ts) — no extra
 * fetch needed, since a Surah's per-Ayah audio URLs are fully derivable
 * from its verse count and reciter alone.
 *
 * Also wires the browser's Media Session API — the web platform's
 * equivalent of the IqraSpace Flutter app's Android lock-screen/
 * notification transport controls (`iqra_audio_handler.dart`): once set,
 * a mobile browser's lock screen and a desktop's hardware media keys/OS
 * media widget show the current Surah and expose Play/Pause/Previous/
 * Next, controllable even while this tab isn't focused. There's no
 * "resume" in this app's playback engine (AudioProvider's own doc
 * comment — pause is always a full stop), so the 'pause' action is
 * wired to `stop()` too, same as this bar's own Stop button.
 */
export function MiniPlayerBar() {
  const audio = useAudio();
  const progress = useAudioProgress();
  const { preferences } = useReaderPreferences();
  const { t } = useT();
  const { surahNumber, ayahNumber, isLoading, isListening } = audio.state;
  const chapter = surahNumber !== null ? getChapterSummary(surahNumber) : undefined;

  /** Reading + Listening Mode's per-Ayah queue (Quran API) — used for
      Previous/Next Surah only while THAT'S what's currently playing. */
  function playWholeSurahApi(id: number) {
    const target = getChapterSummary(id);
    if (!target) return;
    const items = Array.from({ length: target.verses_count }, (_, i) => {
      const n = i + 1;
      return { ayahNumber: n, url: ayahAudioUrl(preferences.reciter, getGlobalAyahId(id, n)) };
    });
    audio.playSurah(id, items);
  }

  /** Listening Mode's whole-Surah R2 file — used for Previous/Next Surah
      while Listening Mode is what's currently playing, so a lock-screen/
      notification skip during Listening Mode stays on Listening Mode's
      own audio source instead of silently switching to the per-ayah
      Quran API (matching `IqraAudioHandler._jumpToSurah`'s own "continue
      in whichever mode was actually playing" contract). */
  function playWholeSurahListening(id: number) {
    const parts = getListeningParts(id, preferences.listeningTrack);
    if (parts.length === 0) return;
    audio.playListeningSurah(id, parts);
  }

  function skipToSurah(id: number) {
    if (isListening) playWholeSurahListening(id);
    else playWholeSurahApi(id);
  }

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!chapter || surahNumber === null) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      return;
    }

    // Listening Mode's lock-screen/notification title is the Surah name
    // ONLY (matches `IqraAudioHandler.playSurahLocal`'s own title —
    // no Ayah number, since Listening Mode never highlights a specific
    // Ayah). Reading + Listening Mode's per-Ayah queue still shows which
    // Ayah is currently playing.
    navigator.mediaSession.metadata = new MediaMetadata({
      title: chapter.name_simple,
      artist: "IqraSpace Quran",
      ...(ayahNumber !== null ? { album: `Ayah ${ayahNumber}` } : {}),
    });
    navigator.mediaSession.playbackState = isLoading ? "none" : "playing";

    const previousId = getAdjacentChapterId(surahNumber, "previous");
    const nextId = getAdjacentChapterId(surahNumber, "next");
    navigator.mediaSession.setActionHandler("pause", () => audio.stop());
    navigator.mediaSession.setActionHandler("stop", () => audio.stop());
    navigator.mediaSession.setActionHandler("previoustrack", previousId !== undefined ? () => skipToSurah(previousId) : null);
    navigator.mediaSession.setActionHandler("nexttrack", nextId !== undefined ? () => skipToSurah(nextId) : null);

    return () => {
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, surahNumber, ayahNumber, isLoading, isListening]);

  if (surahNumber === null || !chapter) return null;

  const previousId = getAdjacentChapterId(surahNumber, "previous");
  const nextId = getAdjacentChapterId(surahNumber, "next");

  return (
    <div style={wrapperStyle}>
      <div style={rowStyle}>
        <Link
          href={ayahNumber !== null ? `/surah/${surahNumber}?verse=${surahNumber}:${ayahNumber}` : `/surah/${surahNumber}`}
          style={linkStyle}
          aria-label={t("playerOpenNowPlaying", { name: chapter.name_simple })}
        >
          <span aria-hidden="true" style={{ fontSize: "1rem" }}>
            🔊
          </span>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {chapter.name_simple}
            {ayahNumber !== null && <> · {t("homeAyah", { n: ayahNumber })}</>}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => previousId !== undefined && skipToSurah(previousId)}
          disabled={previousId === undefined}
          aria-label={t("playerPreviousSurah")}
          style={iconButtonStyle}
        >
          <PreviousIcon />
        </button>
        <button
          type="button"
          onClick={audio.stop}
          aria-label={isLoading ? t("playerLoading") : t("playerStop")}
          style={iconButtonStyle}
        >
          {isLoading ? <LoadingIcon /> : <StopIcon />}
        </button>
        <button
          type="button"
          onClick={() => nextId !== undefined && skipToSurah(nextId)}
          disabled={nextId === undefined}
          aria-label={t("playerNextSurah")}
          style={iconButtonStyle}
        >
          <NextIcon />
        </button>
      </div>
      <div style={trackStyle}>
        <div style={{ ...fillStyle, width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }} />
      </div>
    </div>
  );
}

function PreviousIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 6h2v12H6zM20 6v12L9 12z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 6h2v12h-2zM4 6v12l11-6z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// Deliberately NOT sticky: the Surah reader's own nav row (ReaderNavBar's
// "top" variant) is already sticky at `top: var(--site-header-height)`,
// with no awareness of this bar's height — stacking a second sticky
// element at the same offset would overlap it. A plain, in-flow bar right
// below SiteHeader still gives global "audio survived navigation"
// visibility (this app's actual parity goal — the IqraSpace Flutter app
// only shows its own mini player on Home, relying on the OS lock-screen
// notification everywhere else, which the web has no equivalent of)
// without touching the reader's own sticky-offset math.
const wrapperStyle: CSSProperties = {
  background: "var(--color-surface)",
  borderBottom: "1px solid var(--color-border)",
};

const rowStyle: CSSProperties = {
  maxWidth: "var(--content-max-width)",
  margin: "0 auto",
  padding: "0.5rem 1rem",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const linkStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  color: "var(--color-text)",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "0.85rem",
};

const iconButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2rem",
  height: "2rem",
  flexShrink: 0,
  borderRadius: "9999px",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg)",
  color: "var(--color-text)",
  cursor: "pointer",
};

const trackStyle: CSSProperties = {
  height: "2px",
  background: "var(--color-border)",
};

const fillStyle: CSSProperties = {
  height: "100%",
  background: "var(--color-primary)",
};
