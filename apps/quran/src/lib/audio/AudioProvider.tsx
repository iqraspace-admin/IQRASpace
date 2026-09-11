"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type AudioPlaybackState = {
  surahNumber: number | null;
  ayahNumber: number | null;
  isLoading: boolean;
};

export type AudioQueueItem = { ayahNumber: number; url: string };

type AudioContextValue = {
  state: AudioPlaybackState;
  /** True only when this exact (surahNumber, ayahNumber) is the one
      Ayah currently loading/playing anywhere in the app. */
  isActive: (surahNumber: number, ayahNumber: number) => boolean;
  playAyah: (surahNumber: number, ayahNumber: number, url: string) => void;
  playSurah: (surahNumber: number, items: AudioQueueItem[]) => void;
  stop: () => void;
};

const IDLE_STATE: AudioPlaybackState = { surahNumber: null, ayahNumber: null, isLoading: false };

const AudioContext = createContext<AudioContextValue | null>(null);

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within an AudioProvider");
  return ctx;
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
  const [state, setState] = useState<AudioPlaybackState>(IDLE_STATE);

  function playTrack(surahNumber: number, ayahNumber: number, url: string) {
    const audio = audioRef.current;
    if (!audio) return;
    setState({ surahNumber, ayahNumber, isLoading: true });
    audio.src = url;
    audio.play().catch(advance);
  }

  /** Advances an in-progress Surah queue to its next Ayah, or goes idle
      (whether there was no queue, or the queue just finished). */
  function advance() {
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
    // rather than inserting into or resuming after it.
    queueRef.current = null;
    playTrack(surahNumber, ayahNumber, url);
  }

  function playSurah(surahNumber: number, items: AudioQueueItem[]) {
    if (items.length === 0) return;
    queueRef.current = { surahNumber, items, index: 0 };
    playTrack(surahNumber, items[0].ayahNumber, items[0].url);
  }

  function stop() {
    // Clear the queue first so a synchronous 'error'/'ended' fired by the
    // pause()/load() below (if any) can't try to advance a queue that's
    // about to be gone anyway — it'll just see no queue and go idle.
    queueRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setState(IDLE_STATE);
  }

  function isActive(surahNumber: number, ayahNumber: number) {
    return state.surahNumber === surahNumber && state.ayahNumber === ayahNumber;
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
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AudioContextValue = { state, isActive, playAyah, playSurah, stop };

  return (
    <AudioContext.Provider value={value}>
      {children}
      {/* No native controls — every reader-facing control is the app's
          own play/pause icon buttons, which already carry their own
          accessible labels; this element is just the playback engine. */}
      <audio ref={audioRef} preload="none" aria-hidden="true" style={{ display: "none" }} />
    </AudioContext.Provider>
  );
}
