import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/ayah.dart';

/// Which ayah (if any) is currently playing/loading. `null` fields mean
/// nothing is active.
class AudioPlaybackState {
  final int? surahNumber;
  final int? ayahNumber;
  final bool isLoading;

  const AudioPlaybackState({this.surahNumber, this.ayahNumber, this.isLoading = false});

  bool isActive(int surahNumber, int ayahNumber) =>
      this.surahNumber == surahNumber && this.ayahNumber == ayahNumber;
}

/// Wraps a single `just_audio` `AudioPlayer` for both one-off per-ayah
/// playback and a "play whole surah" sequential queue that auto-advances
/// on each track's completion.
class AudioController extends StateNotifier<AudioPlaybackState> {
  final AudioPlayer _player = AudioPlayer();
  StreamSubscription<PlayerState>? _stateSub;

  List<Ayah>? _queue;
  int? _queueSurahNumber;
  int _queueIndex = 0;

  AudioController() : super(const AudioPlaybackState()) {
    _stateSub = _player.playerStateStream.listen((playerState) {
      if (playerState.processingState == ProcessingState.completed) {
        _advanceQueueOrStop();
      }
    });
  }

  /// Plays a single ayah. Cancels any in-progress "play whole surah"
  /// queue — a direct tap always wins over sequential auto-play.
  Future<void> playAyah({
    required int surahNumber,
    required int ayahNumber,
    required String url,
  }) async {
    _queue = null;
    await _playUrl(surahNumber: surahNumber, ayahNumber: ayahNumber, url: url);
  }

  /// Plays every ayah in [ayahs] that has audio, in order, advancing
  /// automatically as each one finishes.
  Future<void> playSurah(int surahNumber, List<Ayah> ayahs) async {
    _queue = ayahs.where((a) => a.audioUrl != null).toList(growable: false);
    _queueSurahNumber = surahNumber;
    _queueIndex = 0;
    if (_queue!.isEmpty) return;
    await _playQueueAt(0);
  }

  Future<void> _playQueueAt(int index) async {
    final queue = _queue;
    if (queue == null || index >= queue.length) {
      _queue = null;
      state = const AudioPlaybackState();
      return;
    }
    _queueIndex = index;
    final ayah = queue[index];
    await _playUrl(
      surahNumber: _queueSurahNumber!,
      ayahNumber: ayah.numberInSurah,
      url: ayah.audioUrl!,
    );
  }

  Future<void> _playUrl({
    required int surahNumber,
    required int ayahNumber,
    required String url,
  }) async {
    state = AudioPlaybackState(surahNumber: surahNumber, ayahNumber: ayahNumber, isLoading: true);
    try {
      await _player.setUrl(url);
      state = AudioPlaybackState(surahNumber: surahNumber, ayahNumber: ayahNumber);
      await _player.play();
    } catch (_) {
      // Skip a track that fails to load rather than stalling the queue.
      if (_queue != null) {
        await _playQueueAt(_queueIndex + 1);
      } else {
        state = const AudioPlaybackState();
      }
    }
  }

  void _advanceQueueOrStop() {
    if (_queue != null) {
      _playQueueAt(_queueIndex + 1);
    } else {
      state = const AudioPlaybackState();
    }
  }

  Future<void> stop() async {
    _queue = null;
    await _player.stop();
    state = const AudioPlaybackState();
  }

  Future<void> disposeController() async {
    await _stateSub?.cancel();
    await _player.dispose();
  }
}

final audioControllerProvider = StateNotifierProvider<AudioController, AudioPlaybackState>((ref) {
  final controller = AudioController();
  ref.onDispose(controller.disposeController);
  return controller;
});
