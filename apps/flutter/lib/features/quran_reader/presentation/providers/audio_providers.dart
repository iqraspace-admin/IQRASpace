import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/audio/iqra_audio_handler.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/ayah.dart';

/// Which ayah (if any) is currently playing/loading, plus basic
/// transport state — the Riverpod-facing mirror of the app's one
/// [IqraAudioHandler] (`lib/core/audio/iqra_audio_handler.dart`), which
/// does the actual `just_audio` + background/lock-screen work. `null`
/// surah/ayah fields mean nothing is active.
class AudioPlaybackState {
  final int? surahNumber;
  final int? ayahNumber;
  final bool isLoading;
  final bool isPlaying;
  final bool hasError;
  final Duration position;
  final Duration? duration;

  const AudioPlaybackState({
    this.surahNumber,
    this.ayahNumber,
    this.isLoading = false,
    this.isPlaying = false,
    this.hasError = false,
    this.position = Duration.zero,
    this.duration,
  });

  bool isActive(int surahNumber, int ayahNumber) =>
      this.surahNumber == surahNumber && this.ayahNumber == ayahNumber;
}

/// Thin Riverpod adapter over the app's one [IqraAudioHandler] (built in
/// `main.dart` via `initAudioHandler()` before `runApp`). Keeps the same
/// call sites (`playAyah`/`playSurah`/`stop`) the rest of the app already
/// used before background-audio support was added, plus new
/// `pause`/`resume`/Surah-level skip.
class AudioController extends StateNotifier<AudioPlaybackState> {
  final IqraAudioHandler _handler;
  StreamSubscription<MediaItem?>? _mediaItemSub;
  StreamSubscription<PlaybackState>? _playbackStateSub;
  StreamSubscription<MediaItem?>? _inAppMediaItemSub;
  StreamSubscription<PlaybackState>? _inAppPlaybackStateSub;

  /// Listens to both the OS-facing pair (Listening Mode — `mediaItem`/
  /// `playbackState`, what the Android lock screen reads) and the
  /// in-app-only pair (Reading + Listening Mode — `inAppMediaItem`/
  /// `inAppPlaybackState`), feeding both into the same two handlers
  /// below. Only one of the two is ever actually active at a time (see
  /// `IqraAudioHandler`'s `_enterPerAyahSession`/`_enterOsFacingSession`,
  /// which clear whichever pair *isn't* current whenever playback
  /// switches modes), so this UI-facing state is correct regardless of
  /// which pair the update came from.
  AudioController(this._handler) : super(const AudioPlaybackState()) {
    _mediaItemSub = _handler.mediaItem.listen(_onMediaItemChanged);
    _playbackStateSub = _handler.playbackState.listen(_onPlaybackStateChanged);
    _inAppMediaItemSub = _handler.inAppMediaItem.listen(_onMediaItemChanged);
    _inAppPlaybackStateSub = _handler.inAppPlaybackState.listen(_onPlaybackStateChanged);
  }

  void _onMediaItemChanged(MediaItem? item) {
    if (item == null) {
      state = const AudioPlaybackState();
      return;
    }
    state = AudioPlaybackState(
      surahNumber: item.extras?[MediaItemExtra.surahNumber] as int?,
      ayahNumber: item.extras?[MediaItemExtra.ayahNumber] as int?,
      isLoading: state.isLoading,
      isPlaying: state.isPlaying,
      hasError: state.hasError,
      position: Duration.zero,
      duration: item.duration,
    );
  }

  void _onPlaybackStateChanged(PlaybackState playback) {
    state = AudioPlaybackState(
      surahNumber: state.surahNumber,
      ayahNumber: state.ayahNumber,
      isLoading: playback.processingState == AudioProcessingState.loading ||
          playback.processingState == AudioProcessingState.buffering,
      isPlaying: playback.playing,
      hasError: playback.processingState == AudioProcessingState.error,
      position: playback.updatePosition,
      duration: state.duration,
    );
  }

  /// Plays a single ayah. Cancels any in-progress "play whole surah"
  /// queue — a direct tap always wins over sequential auto-play.
  Future<void> playAyah({required int surahNumber, required int ayahNumber, required String url}) =>
      _handler.playAyah(surahNumber: surahNumber, ayahNumber: ayahNumber, url: url);

  /// Plays every ayah in [ayahs] that has audio, in order, advancing
  /// automatically as each one finishes. Reading + Listening Mode only —
  /// see [playSurahLocal] for Listening Mode.
  Future<void> playSurah(int surahNumber, List<Ayah> ayahs) => _handler.playSurahAyahs(surahNumber, ayahs);

  /// Listening Mode's whole-Surah Al-Afasy recitation — a single
  /// local/cached file, not a per-ayah queue. See
  /// `IqraAudioHandler.playSurahLocal`. Its Urdu-translation follow-up
  /// (when selected) is armed automatically by the handler itself once
  /// the Arabic portion finishes — see
  /// `IqraAudioHandler._advanceQueueOrStop` — rather than by a call from
  /// here, since that decision needs to re-check the live setting at the
  /// moment the Arabic portion actually ends, not once at Play-time.
  Future<void> playSurahLocal(int surahNumber) => _handler.playSurahLocal(surahNumber);

  /// Pauses in place — playback resumes from here via [resume], unlike
  /// [stop] which forgets the current position entirely. Reading +
  /// Listening Mode calls this (not `stop`) on any manual navigation.
  Future<void> pause() => _handler.pause();

  Future<void> resume() => _handler.play();

  Future<void> stop() => _handler.stop();

  /// Lock-screen-equivalent Previous/Next **Surah** — also used by the
  /// Home mini-player's transport buttons.
  Future<void> skipToPreviousSurah() => _handler.skipToPrevious();

  Future<void> skipToNextSurah() => _handler.skipToNext();

  @override
  void dispose() {
    _mediaItemSub?.cancel();
    _playbackStateSub?.cancel();
    _inAppMediaItemSub?.cancel();
    _inAppPlaybackStateSub?.cancel();
    super.dispose();
  }
}

final audioControllerProvider = StateNotifierProvider<AudioController, AudioPlaybackState>((ref) {
  return AudioController(audioHandler);
});
