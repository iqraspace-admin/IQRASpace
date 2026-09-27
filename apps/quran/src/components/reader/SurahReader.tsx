"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReaderPreferences } from "@/lib/preferences/ReaderPreferencesProvider";
import { useAudio } from "@/lib/audio/AudioProvider";
import { ayahAudioUrl } from "@/lib/content/reciters";
import { getListeningParts } from "@/lib/content/listeningAudio";
import { ReaderNavBar } from "./ReaderNavBar";
import { ReaderModeSwitch } from "./ReaderModeSwitch";
import { AyahList } from "./AyahList";
import { JumpToSurah } from "./JumpToSurah";
import type { Chapter, Verse } from "@/lib/content/types";
import type { SurahPdfInfo } from "@/lib/content/pdf";

// pdfjs-dist's browser build touches browser-only globals (DOMMatrix,
// Path2D, …) at module scope, which crashes if evaluated during Next's
// server-side prerender of this "use client" component's initial HTML —
// `ssr: false` defers loading PdfViewer's whole module graph to the
// browser only. See PDF-CONTENT.md.
const PdfViewer = dynamic(() => import("./PdfViewer").then((m) => m.PdfViewer), { ssr: false });

type Props = {
  chapter: Chapter;
  verses: Verse[];
  previous: Chapter | undefined;
  next: Chapter | undefined;
  /** undefined if this Surah's PDF hasn't been generated yet — PDF Mode
      then silently falls back to the normal text view below, never a
      broken page (see lib/content/pdf.ts). */
  pdfInfo: SurahPdfInfo | undefined;
  /** Every synced Surah — powers the "Jump to Surah" dialog's search. */
  allChapters: Chapter[];
};

/**
 * The reader itself (Readme.md §11) — the most important component in the
 * app. Peaceful, minimal: chapter heading, optional Bismillah, ayah list,
 * prev/next Surah navigation. Ayah-list rendering and Continue Reading
 * tracking live in the shared AyahList (also used by the Page reader).
 */
export function SurahReader({ chapter, verses, previous, next, pdfInfo, allChapters }: Props) {
  const { preferences, autoScrollEnabled, setAutoScrollEnabled } = useReaderPreferences();
  const showPdf = preferences.pdfMode && pdfInfo !== undefined;
  // Reading Mode has no audio at all (matches the IqraSpace Flutter app
  // exactly) — gates both the whole-Surah play button below and each
  // Ayah's own play button (AyahBlock, via AyahList's readerMode prop).
  const audioEnabled = preferences.readerMode !== "reading";
  const [jumpOpen, setJumpOpen] = useState(false);
  const audio = useAudio();

  // Switching to a DIFFERENT Reader Mode stops any in-progress audio —
  // each mode has its own audio semantics (Reading: none; Listening: one
  // R2 file, no highlight; Reading+Listening: a per-Ayah queue with
  // highlight), so silently leaving one mode's playback running under
  // another mode's UI would be confusing (e.g. Listening's R2 file still
  // playing in the background while Reading+Listening's UI shows
  // nothing active). Skipped on this reader's very first mount — a
  // reader arriving here after starting playback elsewhere (the
  // MiniPlayerBar's own now-playing Surah, from before this navigation)
  // must NOT have that stopped out from under them just for opening a
  // new Surah at whatever mode was last selected.
  const previousModeRef = useRef(preferences.readerMode);
  useEffect(() => {
    if (previousModeRef.current !== preferences.readerMode) {
      previousModeRef.current = preferences.readerMode;
      audio.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.readerMode]);

  // Auto-scroll while reading (matches the IqraSpace Flutter app's own
  // feature) — a constant-speed nudge every 100ms, same tick rate. Off
  // entirely under prefers-reduced-motion, matching this app's existing
  // sitewide reduced-motion posture. Distinct from AyahList's audio-
  // follow-scroll (which jumps to whichever Ayah is playing) — this one
  // runs independent of audio, and stops itself at the bottom of the page.
  useEffect(() => {
    if (!autoScrollEnabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pixelsPerTick = preferences.autoScrollSpeed * 0.1;
    const interval = setInterval(() => {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;
      if (atBottom) {
        setAutoScrollEnabled(false);
        return;
      }
      window.scrollBy({ top: pixelsPerTick });
    }, 100);
    return () => clearInterval(interval);
  }, [autoScrollEnabled, preferences.autoScrollSpeed, setAutoScrollEnabled]);

  const versesWithSurah = useMemo(
    () => verses.map((v) => ({ ...v, surahId: chapter.id, surahName: chapter.name_simple })),
    [verses, chapter.id, chapter.name_simple]
  );

  const isListeningMode = preferences.readerMode === "listening";

  // Listening Mode: the whole-Surah Play button streams one continuous
  // file straight from Cloudflare R2 (never the per-ayah Quran API) —
  // matches Flutter's `IqraAudioHandler.playSurahLocal` exactly, and is
  // why AudioProvider tracks it as a distinct `isListening` state (no
  // per-ayah highlight — see that state's own doc comment).
  //
  // Reading + Listening Mode: unchanged from this app's original
  // behavior — a queue of per-Ayah Quran-API audio, which is what
  // drives the now-playing highlight/auto-scroll.
  const surahPlaying = isListeningMode
    ? audio.isListeningActive(chapter.id)
    : audio.state.surahNumber === chapter.id && audio.state.ayahNumber !== null;
  const surahLoading = surahPlaying && audio.state.isLoading;

  function togglePlaySurah() {
    if (surahPlaying) {
      audio.stop();
      return;
    }
    if (isListeningMode) {
      const parts = getListeningParts(chapter.id, preferences.listeningTrack);
      if (parts.length === 0) return;
      audio.playListeningSurah(chapter.id, parts);
      return;
    }
    const items = versesWithSurah.map((v) => ({
      ayahNumber: v.verse_number,
      url: ayahAudioUrl(preferences.reciter, v.id),
    }));
    audio.playSurah(chapter.id, items);
  }

  const navPrevious = previous ? { href: `/surah/${previous.id}`, label: previous.name_simple } : undefined;
  const navNext = next ? { href: `/surah/${next.id}`, label: next.name_simple } : undefined;

  // PDF Mode gets its own, wider container (--pdf-reader-max-width) — a
  // scanned page image benefits from the available viewport width in a
  // way prose text at --reader-max-width deliberately doesn't (see
  // globals.css's comment). Header/nav stay put; only how much of the
  // viewport the reader column claims changes.
  return (
    <div
      style={{
        maxWidth: showPdf ? "var(--pdf-reader-max-width)" : "var(--reader-max-width)",
        margin: "0 auto",
        padding: "1.5rem 1rem",
        // border-box only matters here in PDF mode: --pdf-reader-max-width
        // is vw-based (globals.css), so content-box's default of adding
        // padding ON TOP of that max-width could push the outer box a few
        // px past the true viewport width on narrower/tablet screens —
        // exactly the unwanted horizontal-scrollbar bug being fixed here,
        // just at a different width than the one it was first noticed at.
        ...(showPdf ? { boxSizing: "border-box" as const } : {}),
      }}
    >
      <ReaderNavBar
        previous={navPrevious}
        next={navNext}
        variant="top"
        current={chapter.name_simple}
        currentArabic={chapter.name_arabic}
        onCurrentClick={() => setJumpOpen(true)}
        previousBoundaryLabel={!previous ? "First Surah" : undefined}
        nextBoundaryLabel={!next ? "Last Surah" : undefined}
        onPlayClick={showPdf || !audioEnabled ? undefined : togglePlaySurah}
        isPlaying={showPdf || !audioEnabled ? undefined : surahPlaying}
        isLoading={showPdf || !audioEnabled ? undefined : surahLoading}
        onAutoScrollClick={showPdf ? undefined : () => setAutoScrollEnabled(!autoScrollEnabled)}
        isAutoScrolling={showPdf ? undefined : autoScrollEnabled}
        goToAyah={showPdf ? undefined : { surahId: chapter.id, versesCount: chapter.verses_count }}
      />

      {!showPdf && <ReaderModeSwitch />}

      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.85rem" }}>
          Surah {chapter.id} · {chapter.verses_count} Ayahs ·{" "}
          {chapter.revelation_place === "makkah" ? "Makkah" : "Madinah"}
        </p>
        <h1
          dir="rtl"
          lang="ar"
          style={{
            fontFamily: "var(--font-arabic)",
            fontSize: "2.25rem",
            margin: "0.5rem 0",
            color: "var(--color-primary)",
            // Explicit, not left to inherit "center" from <header>: the
            // globals.css `[dir="rtl"]` safety net (see AyahBlock.tsx's
            // comment) matches this element directly and would otherwise
            // override the inherited centering with "right".
            textAlign: "center",
          }}
        >
          {chapter.name_arabic}
        </h1>
        <p style={{ margin: 0, fontWeight: 600 }}>{chapter.name_simple}</p>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>{chapter.translated_name.name}</p>
      </header>

      {chapter.bismillah_pre && (
        <p
          dir="rtl"
          lang="ar"
          style={{
            textAlign: "center",
            fontFamily: "var(--font-arabic)",
            fontSize: "calc(1.5rem * var(--reader-arabic-scale))",
            color: "var(--color-primary)",
            marginBottom: "2rem",
          }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      )}

      {showPdf ? (
        <PdfViewer file={pdfInfo.file} />
      ) : (
        <AyahList
          verses={versesWithSurah}
          enabledTranslations={preferences.enabledTranslations}
          showBookmarks={preferences.showBookmarks}
          audioEnabled={audioEnabled}
          showSurahHeadings={false}
          ariaLabel={`Ayahs of ${chapter.name_simple}`}
        />
      )}

      <ReaderNavBar
        previous={navPrevious}
        next={navNext}
        variant="bottom"
        previousBoundaryLabel={!previous ? "First Surah" : undefined}
        nextBoundaryLabel={!next ? "Last Surah" : undefined}
      />

      <JumpToSurah open={jumpOpen} onClose={() => setJumpOpen(false)} chapters={allChapters} currentSurahId={chapter.id} />
    </div>
  );
}
