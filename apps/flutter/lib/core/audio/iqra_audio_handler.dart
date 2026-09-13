import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:just_audio/just_audio.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/constants/reciters.dart';
import 'package:quran_flutter/core/constants/surah_transliterations.dart';
import 'package:quran_flutter/core/network/dio_client.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/features/quran_reader/data/datasources/surah_local_datasource.dart';
import 'package:quran_flutter/features/quran_reader/data/datasources/surah_remote_datasource.dart';
import 'package:quran_flutter/features/quran_reader/data/repositories/surah_repository_impl.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/ayah.dart';
import 'package:quran_flutter/features/quran_reader/domain/repositories/surah_repository.dart';

/// Keys into each [MediaItem.extras] map — how the Riverpod-facing
/// `AudioController` (audio_providers.dart) recovers which Surah/Ayah is
/// playing from this handler's `mediaItem` stream, without a separate
/// side channel.
class MediaItemExtra {
  static const surahNumber = 'surahNumber';
  static const ayahNumber = 'ayahNumber';
}

/// Background/lock-screen-capable audio handler (Android — see
/// `main.dart`'s `AudioService.init`, `!kIsWeb`-guarded). Wraps one
/// `just_audio` `AudioPlayer` and keeps this app's existing "manual
/// ayah-to-ayah `setUrl` chaining" whole-Surah playback approach (proven
/// already; no need for a `ConcatenatingAudioSource`) — this class adds
/// the missing `pause()`, `MediaItem` tagging (so the lock screen shows
/// the right Surah/Ayah), and lock-screen Previous/Next mapped onto
/// **Surah** navigation, not Ayah (there is no dedicated Ayah-skip
/// button; Ayah-to-ayah advance within a Surah is automatic).
///
/// Constructed once via `AudioService.init(builder: () =>
/// IqraAudioHandler())`, independent of the Riverpod widget tree — it
/// fetches Surahs it wasn't handed directly (Previous/Next Surah,
/// possibly triggered from the lock screen while the app is backgrounded)
/// through its own `SurahRepository` instance, built from the same
/// datasource/Dio-client constructors `surah_providers.dart` uses, so
/// there's exactly one offline-first caching implementation, just two
/// lightweight instances of it.
class IqraAudioHandler extends BaseAudioHandler with SeekHandler {
  final AudioPlayer _player = AudioPlayer();
  late final SurahRepository _repository = SurahRepositoryImpl(
    remote: SurahRemoteDataSource(buildDioClient(), buildQuranComDioClient()),
    local: SurahLocalDataSource(HiveBoxes.surahBox),
  );

  List<Ayah>? _queue;
  int? _queueSurahNumber;
  int _queueIndex = 0;

  IqraAudioHandler() {
    _player.playbackEventStream.listen(_broadcastState, onError: (Object e, StackTrace st) {
      // A stream error here would otherwise crash the isolate silently
      // (no UI to surface it to) — swallow and let the next track/user
      // action recover, matching AudioController's old per-track
      // try/catch philosophy.
    });
    _player.processingStateStream.listen((s) {
      if (s == ProcessingState.completed) _advanceQueueOrStop();
    });
  }

  void _broadcastState(PlaybackEvent event) {
    playbackState.add(
      playbackState.value.copyWith(
        controls: [
          MediaControl.skipToPrevious,
          _player.playing ? MediaControl.pause : MediaControl.play,
          MediaControl.stop,
          MediaControl.skipToNext,
        ],
        systemActions: const {MediaAction.seek},
        androidCompactActionIndices: const [0, 1, 3],
        processingState: const {
          ProcessingState.idle: AudioProcessingState.idle,
          ProcessingState.loading: AudioProcessingState.loading,
          ProcessingState.buffering: AudioProcessingState.buffering,
          ProcessingState.ready: AudioProcessingState.ready,
          ProcessingState.completed: AudioProcessingState.completed,
        }[_player.processingState]!,
        playing: _player.playing,
        updatePosition: _player.position,
        bufferedPosition: _player.bufferedPosition,
        speed: _player.speed,
      ),
    );
  }

  /// Plays a single ayah. Cancels any in-progress "play whole surah"
  /// queue — a direct tap always wins over sequential auto-play.
  Future<void> playAyah({required int surahNumber, required int ayahNumber, required String url}) async {
    _queue = null;
    _queueSurahNumber = surahNumber;
    await _playUrl(surahNumber: surahNumber, ayahNumber: ayahNumber, url: url);
  }

  /// Plays every ayah in [ayahs] that has audio, in order, advancing
  /// automatically as each one finishes.
  Future<void> playSurahAyahs(int surahNumber, List<Ayah> ayahs) async {
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
      await _clear();
      return;
    }
    _queueIndex = index;
    final ayah = queue[index];
    await _playUrl(surahNumber: _queueSurahNumber!, ayahNumber: ayah.numberInSurah, url: ayah.audioUrl!);
  }

  Future<void> _playUrl({required int surahNumber, required int ayahNumber, required String url}) async {
    mediaItem.add(_mediaItemFor(surahNumber, ayahNumber, url));
    try {
      await _player.setUrl(url);
      await _player.play();
    } catch (_) {
      // Skip a track that fails to load rather than stalling the queue.
      if (_queue != null) {
        await _playQueueAt(_queueIndex + 1);
      } else {
        await _clear();
      }
    }
  }

  /// Plays a single supplementary, whole-Surah track that isn't itself
  /// an ayah — today, a Surah's Urdu-translation audio (Listening Mode's
  /// "Recitation + Urdu Translation" track, played after the Arabic
  /// queue finishes; see `urdu_surah_audio.dart`). Tagged with
  /// `ayahNumber: -1` so `AudioPlaybackState.isActive(surah, ayah)` (ayah
  /// &gt;= 1 always) never matches it — the ayah-highlight border in
  /// `surah_reader_screen.dart` correctly shows nothing highlighted
  /// while this plays.
  Future<void> playSupplementaryTrack({required int surahNumber, required String url, required String title}) async {
    _queue = null;
    _queueSurahNumber = surahNumber;
    mediaItem.add(
      MediaItem(
        id: url,
        title: title,
        artist: 'IqraSpace',
        extras: {MediaItemExtra.surahNumber: surahNumber, MediaItemExtra.ayahNumber: -1},
      ),
    );
    try {
      await _player.setUrl(url);
      await _player.play();
    } catch (_) {
      await _clear();
    }
  }

  MediaItem _mediaItemFor(int surahNumber, int ayahNumber, String url) {
    final surahName = surahTransliterationFor(surahNumber, currentAppLanguageFromHive());
    return MediaItem(
      id: url,
      title: '$surahName — Ayah $ayahNumber',
      artist: 'IqraSpace',
      extras: {MediaItemExtra.surahNumber: surahNumber, MediaItemExtra.ayahNumber: ayahNumber},
    );
  }

  void _advanceQueueOrStop() {
    if (_queue != null) {
      _playQueueAt(_queueIndex + 1);
    } else {
      _clear();
    }
  }

  Future<void> _clear() async {
    mediaItem.add(null);
    playbackState.add(playbackState.value.copyWith(playing: false, processingState: AudioProcessingState.idle));
  }

  @override
  Future<void> play() => _player.play();

  @override
  Future<void> pause() => _player.pause();

  @override
  Future<void> stop() async {
    _queue = null;
    await _player.stop();
    await _clear();
    return super.stop();
  }

  @override
  Future<void> seek(Duration position) => _player.seek(position);

  /// Lock-screen/notification "Previous" — the previous **Surah**, not
  /// ayah (there is no ayah-level lock-screen control; ayah-to-ayah
  /// advance within a Surah is automatic).
  @override
  Future<void> skipToPrevious() => _jumpToSurah(_currentSurahNumber() - 1);

  /// Lock-screen/notification "Next" — the next **Surah** (see
  /// [skipToPrevious]).
  @override
  Future<void> skipToNext() => _jumpToSurah(_currentSurahNumber() + 1);

  int _currentSurahNumber() =>
      _queueSurahNumber ?? (mediaItem.value?.extras?[MediaItemExtra.surahNumber] as int?) ?? 1;

  Future<void> _jumpToSurah(int surahNumber) async {
    if (surahNumber < 1 || surahNumber > 114) return;
    final reciterEdition = (HiveBoxes.settingsBox.get('reciterEdition') as String?) ?? defaultReciterIdentifier;
    final ayahs = await _repository.getSurah(surahNumber, reciterEdition: reciterEdition);
    await playSurahAyahs(surahNumber, ayahs);
  }

  Future<void> disposeHandler() async {
    await _player.dispose();
  }
}

/// The app's one audio handler — a plain, synchronously-constructed Dart
/// object usable immediately (by `audioControllerProvider` and tests
/// alike) whether or not [registerAudioService] below has run or even
/// exists on the current platform.
final IqraAudioHandler audioHandler = IqraAudioHandler();

bool _registered = false;

/// Registers [audioHandler] with the OS's media-session APIs — the
/// piece that actually shows lock-screen/notification transport
/// controls and lets audio survive backgrounding. Call once from
/// `main()` before `runApp`, mirroring `HiveBoxes.init()`. Best-effort:
/// swallowed if `AudioService.init` throws on a platform it doesn't
/// support (this app's shipped targets are Android + Web only, but
/// local dev may run `flutter run -d windows`, which isn't) —
/// [audioHandler] keeps working as a plain in-app audio/playback-state
/// manager regardless, which is all `audioControllerProvider` (and
/// widget tests, which never call this at all) actually needs.
Future<void> registerAudioService() async {
  if (_registered) return;
  _registered = true;
  try {
    await AudioService.init(
      builder: () => audioHandler,
      config: const AudioServiceConfig(
        androidNotificationChannelId: 'org.iqraspace.app.audio',
        androidNotificationChannelName: 'IqraSpace playback',
        // Ongoing (can't be swiped away) only while actually playing —
        // stopping the foreground service on pause (the default) lets
        // the notification be dismissed then, which is what
        // `androidNotificationOngoing` requires (see its own assert).
        androidNotificationOngoing: true,
      ),
    );
  } catch (e) {
    // No OS integration on this platform/environment — see doc comment.
    // Logged (not silently swallowed) since a genuine misconfiguration
    // here — as opposed to an expected "this platform isn't supported"
    // — would otherwise be invisible: background playback would quietly
    // degrade to foreground-only with no error surfaced anywhere.
    debugPrint('registerAudioService: AudioService.init failed — background/lock-screen audio will not work: $e');
  }
}
