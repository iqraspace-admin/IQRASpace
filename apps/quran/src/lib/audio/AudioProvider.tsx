"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type AudioPlaybackState = {
  surahNumber: number | null;
  ayahNumber: number | null;
  isLoading: boolean;
  /** True only while playing Listening Mode's whole-Surah file (see
      playListeningSurah) — mirrors the IqraSpace Flutter app's own
      distinction between its per-ayah "in-app" session and its
      OS-facing Listening Mode session (see AUDIO.md's "Lock screen:
      Listening Mode only"). Listening Mode never highlights a specific
      Ayah (no per-ayah timing data for a local whole-Surah file), so
      `ayahNumber` stays null the whole time this is true — the same
      shape `isActive()` already treats as "not this Ayah", so every
      AyahBlock correctly shows no highlight during Listening playback
      with no changes needed there. */
  isListening: boolean;
};

export type AudioQueueItem = { ayahNumber: number; url: string };

type AudioContextValue = {
  state: AudioPlaybackState;
  /** True only when this exact (surahNumber, ayahNumber) is the one
      Ayah currently loading/playing anywhere in the app. */
  isActive: (surahNumber: number, ayahNumber: number) => boolean;
  /** True while Listening Mode's whole-Surah file is loading/playing for
      this Surah — see AudioPlaybackState.isListening. */
  isListeningActive: (surahNumber: number) => boolean;
  playAyah: (surahNumber: number, ayahNumber: number, url: string) => void;
  playSurah: (surahNumber: number, items: AudioQueueItem[]) => void;
  /** Listening Mode's whole-Surah playback — streams `parts` (almost
      always exactly one URL; more than one only for the handful of
      Surahs split as a storage-size workaround, played back-to-back in
      order) directly from Cloudflare R2, never from the per-ayah Quran
      API. Mutually exclusive with playAyah/playSurah — starting either
      kind of playback stops the other, matching the IqraSpace Flutter
      app's single shared player (see lib/content/listeningAudio.ts and
      AUDIO.md). */
  playListeningSurah: (surahNumber: number, parts: { url: string }[]) => void;
  stop: () => void;
};

const IDLE_STATE: AudioPlaybackState = { surahNumber: null, ayahNumber: null, isLoading: false, isListening: false };

const AudioContext = createContext<AudioContextValue | null>(null);

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within an AudioProvider");
  return ctx;
}

/** Current playback position, 0-1 — split into its own context (rather
    than a field on AudioContextValue.state) so only a consumer that
    actually renders a progress bar (MiniPlayerBar) re-renders on every
    'timeupdate' tick; every AyahBlock in a long Surah's list calls
    useAudio() too, and none of them need this. */
const AudioProgressContext = createContext<number>(0);

export function useAudioProgress(): number {
  return useContext(AudioProgressContext);
}

/**
 * One global "now playing" Ayah for the whole app — mirrors the IqraSpace
 * Flutter app's single shared AudioController (one just_audio
 * `AudioPlayer` instance, reused for every play action): at most one
 * Ayah is ever "active" anywhere, whether a reader tapped a single
 * Ayah's play button or a whole-Surah queue is auto-advancing through
 * it. Mounted once in the root layout so it survives navigation between
 * Surah/Page routes uninterrupted, same as Flutter's app-wide
 * controller.
 *
 * "Pause" here is a full stop, not a true pause/resume — matching
 * Flutter's own AudioController, which has no pause()/seek() either
 * (tapping "pause" there calls stop()). Whole-Surah playback is a queue
 * of individual Ayah audio files auto-advancing on each one's `ended`
 * event, not one continuous Surah-length file — again matching Flutter
 * exactly (see AudioController.playSurah/_advanceQueueOrStop). A failed
 * Ayah is silently skipped to the next queued one, same as Flutter — no
 * error is surfaced to the reader.
 *
 * The functions below are plain (not useCallback-memoized) and the
 * `useEffect` that wires the <audio> element's events runs once on
 * mount: every one of them only ever touches refs (stable `.current`)
 * and the `setState` setter (stable identity from useState), so an
 * "older" closure captured at mount behaves identically to a fresh one —
 * there's nothing here that goes stale across renders.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const queueRef = useRef<{ surahNumber: number; items: AudioQueueItem[]; index: number } | null>(null);
  const listeningQueueRef = useRef<{ surahNumber: number; urls: string[]; index: number } | null>(null);
  const [state, setState] = useState<AudioPlaybackState>(IDLE_STATE);
  const [progress, setProgress] = useState(0);

  function playTrack(surahNumber: number, ayahNumber: number, url: string) {
    const audio = audioRef.current;
    if (!audio) return;
    setState({ surahNumber, ayahNumber, isLoading: true, isListening: false });
    setProgress(0);
    audio.src = url;
    audio.play().catch(advance);
  }

  /** Listening Mode's per-part playback — same underlying <audio>
      element as playTrack, but `ayahNumber` stays null the whole time
      (see AudioPlaybackState.isListening's doc comment). */
  function playListeningTrack(surahNumber: number, url: string) {
    const audio = audioRef.current;
    if (!audio) return;
    setState({ surahNumber, ayahNumber: null, isLoading: true, isListening: true });
    setProgress(0);
    audio.src = url;
    audio.play().catch(advance);
  }

  /** Advances an in-progress Surah/Listening queue to its next item, or
      goes idle (whether there was no queue, or the queue just
      finished). Listening's part queue is checked first — the two
      queues are mutually exclusive (see playAyah/playSurah/
      playListeningSurah), never both populated at once. */
  function advance() {
    const listeningQueue = listeningQueueRef.current;
    if (listeningQueue) {
      const nextIndex = listeningQueue.index + 1;
      const nextUrl = listeningQueue.urls[nextIndex];
      if (!nextUrl) {
        listeningQueueRef.current = null;
        setState(IDLE_STATE);
        return;
      }
      listeningQueueRef.current = { ...listeningQueue, index: nextIndex };
      playListeningTrack(listeningQueue.surahNumber, nextUrl);
      return;
    }

    const queue = queueRef.current;
    if (!queue) {
      setState(IDLE_STATE);
      return;
    }
    const nextIndex = queue.index + 1;
    const next = queue.items[nextIndex];
    if (!next) {
      queueRef.current = null;
      setState(IDLE_STATE);
      return;
    }
    queueRef.current = { ...queue, index: nextIndex };
    playTrack(queue.surahNumber, next.ayahNumber, next.url);
  }

  function playAyah(surahNumber: number, ayahNumber: number, url: string) {
    // A direct tap always takes over, queue or not — matches Flutter's
    // playAyah, which unconditionally clears any in-progress Surah queue
    // (and, here, any Listening Mode session — the two share one
    // underlying player, same as Flutter's single AudioPlayer) rather
    // than inserting into or resuming after it.
    queueRef.current = null;
    listeningQueueRef.current = null;
    playTrack(surahNumber, ayahNumber, url);
  }

  function playSurah(surahNumber: number, items: AudioQueueItem[]) {
    if (items.length === 0) return;
    listeningQueueRef.current = null;
    queueRef.current = { surahNumber, items, index: 0 };
    playTrack(surahNumber, items[0].ayahNumber, items[0].url);
  }

  function playListeningSurah(surahNumber: number, parts: { url: string }[]) {
    if (parts.length === 0) return;
    queueRef.current = null;
    listeningQueueRef.current = { surahNumber, urls: parts.map((p) => p.url), index: 0 };
    playListeningTrack(surahNumber, parts[0].url);
  }

  function stop() {
    // Clear both queues first so a synchronous 'error'/'ended' fired by
    // the pause()/load() below (if any) can't try to advance a queue
    // that's about to be gone anyway — it'll just see no queue and go
    // idle.
    queueRef.current = null;
    listeningQueueRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setState(IDLE_STATE);
    setProgress(0);
  }

  function isActive(surahNumber: number, ayahNumber: number) {
    return state.surahNumber === surahNumber && state.ayahNumber === ayahNumber;
  }

  function isListeningActive(surahNumber: number) {
    return state.surahNumber === surahNumber && state.isListening;
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function onPlaying() {
      setState((s) => (s.isLoading ? { ...s, isLoading: false } : s));
    }
    function onEnded() {
      advance();
    }
    function onError() {
      advance();
    }
    function onTimeUpdate() {
      const el = audioRef.current;
      if (!el) return;
      setProgress(el.duration > 0 ? el.currentTime / el.duration : 0);
    }
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AudioContextValue = {
    state,
    isActive,
    isListeningActive,
    playAyah,
    playSurah,
    playListeningSurah,
    stop,
  };

  return (
    <AudioContext.Provider value={value}>
      <AudioProgressContext.Provider value={progress}>
        {children}
        {/* No native controls — every reader-facing control is the app's
            own play/pause icon buttons, which already carry their own
            accessible labels; this element is just the playback engine. */}
        <audio ref={audioRef} preload="none" aria-hidden="true" style={{ display: "none" }} />
      </AudioProgressContext.Provider>
    </AudioContext.Provider>
  );
}
