import 'dart:async';

import 'package:audio_service/audio_service.dart';
import 'package:flutter/foundation.dart' show debugPrint, kIsWeb;
import 'package:just_audio/just_audio.dart';
import 'package:quran_flutter/core/audio/audio_cache_manager.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/constants/arabic_surah_audio.dart';
import 'package:quran_flutter/core/constants/reader_mode.dart';
import 'package:quran_flutter/core/constants/reciters.dart';
import 'package:quran_flutter/core/constants/surah_transliterations.dart';
import 'package:quran_flutter/core/constants/urdu_surah_audio.dart';
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
/// `just_audio` `AudioPlayer` behind two playback styles:
/// [playAyah]/[playSurahAyahs] keep this app's original manual
/// ayah-to-ayah `setUrl` chaining (Reading + Listening Mode's per-ayah
/// sync); [playSurahLocal]/[playSupplementaryTrack] instead load one
/// continuous whole-Surah audio source (Listening Mode) — for the
/// handful of Surahs split into several files as a Storage
/// size workaround, that's a `ConcatenatingAudioSource`, gapless on
/// Android (see its own doc comment), with the resulting
/// current-part-relative `position`/`duration` reassembled into one
/// continuous timeline by [_priorPartsDuration]/[seek]. This class also
/// adds `pause()`, `MediaItem` tagging (so the lock screen shows the
/// right Surah/Ayah), and lock-screen Previous/Next mapped onto
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

  /// Whether the most recent top-level `play*` call was [playSurahLocal]
  /// — lets lock-screen/notification Previous/Next ([_jumpToSurah])
  /// continue in the same mode instead of always falling back to the
  /// per-ayah queue. `false` after [playAyah]/[playSurahAyahs].
  bool _lastPlayWasLocalSurah = false;

  /// True only while [playSurahLocal]'s *Arabic* portion is the active
  /// source — as opposed to its Urdu follow-up ([playSupplementaryTrack])
  /// or a per-ayah queue. [_advanceQueueOrStop] checks this, at the
  /// moment the Arabic portion actually finishes, against the live
  /// `listeningTrack` preference in Hive to decide whether to chain into
  /// the Urdu track — reading the preference fresh right then (not
  /// captured once when Play was tapped) is what makes this correct even
  /// if the reader screen that started playback was long since closed,
  /// or the preference changed mid-playback. This replaces a previous
  /// design where the calling widget armed a one-shot `ref.listenManual`
  /// subscription tied to its own lifetime — which silently never fired
  /// if the reader navigated away (Next/Previous/Jump-to-Surah) before
  /// the Arabic portion finished, since that subscription died with the
  /// widget. That was the actual cause of "Recitation + Urdu Translation"
  /// silently behaving like "Recitation Only" for a Surah, despite the
  /// setting still showing Urdu Translation selected.
  bool _isPlayingLocalSurahArabic = false;

  /// True during a per-ayah queue session ([playAyah]/[playSurahAyahs] —
  /// Reading + Listening Mode). Routes every broadcast this class would
  /// otherwise publish through the OS-facing [mediaItem]/[playbackState]
  /// (which is what puts a player on the Android lock screen) through
  /// [inAppMediaItem]/[inAppPlaybackState] instead — a same-shape,
  /// same-underlying-player pair of plain broadcast streams that never
  /// reach `audio_service`, so Reading + Listening Mode never shows a
  /// lock-screen/notification player, while `AudioController` still gets
  /// every field it needs for ayah-highlighting by listening to both
  /// pairs. Only [playSurahLocal]/[playSupplementaryTrack] (Listening
  /// Mode) are allowed to reach the real, OS-facing fields — see
  /// [_enterPerAyahSession]/[_enterOsFacingSession].
  bool _perAyahSession = false;

  final _inAppMediaItemController = StreamController<MediaItem?>.broadcast();
  final _inAppPlaybackStateController = StreamController<PlaybackState>.broadcast();

  /// Reading + Listening Mode's mirror of [mediaItem] — see
  /// [_perAyahSession].
  Stream<MediaItem?> get inAppMediaItem => _inAppMediaItemController.stream;

  /// Reading + Listening Mode's mirror of [playbackState] — see
  /// [_perAyahSession].
  Stream<PlaybackState> get inAppPlaybackState => _inAppPlaybackStateController.stream;

  /// Per-part durations for whichever whole-Surah track is currently
  /// loaded via [playSurahLocal]/[playSupplementaryTrack] — empty
  /// (`[]`) whenever a per-ayah queue ([playAyah]/[playSurahAyahs]) is
  /// playing instead, which is what makes [_priorPartsDuration] and
  /// [seek] no-ops (correctly unchanged behavior) for that case. A
  /// single-entry list (whether or not its duration happens to be known
  /// yet) covers the ordinary un-split case exactly the same way a
  /// multi-entry list covers a Storage-size-workaround split Surah (see
  /// `arabic_surah_audio.dart`) — one mechanism, no special-casing.
  List<Duration?> _partDurations = [];

  /// Which entry of [_partDurations] `just_audio` is currently playing —
  /// mirrors `_player.currentIndexStream`. Only meaningful (and only
  /// updated) while [_partDurations] is non-empty.
  int _currentPartIndex = 0;

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
    // Together, these two keep [_currentPartIndex]/[_partDurations] in
    // sync with whichever part of a multi-part `ConcatenatingAudioSource`
    // (see [playSurahLocal]) is actually playing, so [_broadcastState]
    // and [seek] can treat the whole Surah as one continuous timeline —
    // just_audio's own `position`/`duration` are per-*current-part*, not
    // global across a concatenated sequence (confirmed against its
    // source: `PlaybackEvent` carries `currentIndex` alongside
    // `updatePosition`/`duration` as siblings, not a pre-summed total).
    _player.currentIndexStream.listen((index) {
      if (_partDurations.isEmpty) return;
      _currentPartIndex = (index ?? 0).clamp(0, _partDurations.length - 1);
    });
    _player.durationStream.listen((duration) {
      if (duration == null || _partDurations.isEmpty) return;
      if (_currentPartIndex >= _partDurations.length) return;
      if (_partDurations[_currentPartIndex] == duration) return;
      _partDurations[_currentPartIndex] = duration;
      _maybeUpdateMediaItemDuration();
    });
  }

  void _broadcastState(PlaybackEvent event) {
    final offset = _priorPartsDuration();
    _publishPlaybackState(
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
        // Global position across every part of a split Surah — see the
        // constructor's stream listeners and [_priorPartsDuration]. A
        // no-op offset (0) whenever [_partDurations] is empty, i.e. for
        // the per-ayah queue, which is why this is safe to always apply.
        updatePosition: offset + _player.position,
        bufferedPosition: offset + _player.bufferedPosition,
        speed: _player.speed,
      ),
    );
  }

  /// Routes a [PlaybackState] update to the OS-facing [playbackState]
  /// (Listening Mode — the only mode allowed to reach the Android
  /// lock screen) or the in-app-only [inAppPlaybackState] (Reading +
  /// Listening Mode's per-ayah queue), depending on [_perAyahSession].
  void _publishPlaybackState(PlaybackState state) {
    if (_perAyahSession) {
      _inAppPlaybackStateController.add(state);
    } else {
      playbackState.add(state);
    }
  }

  /// Same routing as [_publishPlaybackState], for [MediaItem] updates.
  void _setMediaItem(MediaItem? item) {
    if (_perAyahSession) {
      _inAppMediaItemController.add(item);
    } else {
      mediaItem.add(item);
    }
  }

  /// Broadcasts "loading" immediately — called synchronously the instant
  /// a `play*` method starts, *before* any network/cache work, so the UI
  /// never has a window with no feedback at all. `just_audio`'s own
  /// `processingState` only starts reflecting reality once
  /// `setUrl`/`setAudioSource` is actually called, which for
  /// [playSurahLocal] is *after* a potentially slow first-time
  /// `AudioCacheManager` download — without this, tapping Play on an
  /// uncached Surah over a slow connection showed no loading indication
  /// at all for however long that download took, reported as the app
  /// appearing to freeze/hang on tap.
  void _publishLoading() {
    _publishPlaybackState(
      playbackState.value.copyWith(processingState: AudioProcessingState.loading, playing: false),
    );
  }

  /// Broadcasts a load failure (including a genuine network stall — see
  /// [AudioCacheManager]'s `connectTimeout`/`receiveTimeout`) so the UI
  /// can show a retry action instead of silently going back to "nothing
  /// playing" with no explanation.
  void _publishError() {
    _publishPlaybackState(
      playbackState.value.copyWith(processingState: AudioProcessingState.error, playing: false),
    );
  }

  /// Enters a per-ayah queue session (Reading + Listening Mode). If a
  /// Listening Mode session was active, its lock-screen/notification
  /// player is dismissed immediately — Reading + Listening Mode must
  /// never show one (it's foreground-only by design; see
  /// `surah_reader_screen.dart`'s pause-on-leave handling).
  void _enterPerAyahSession() {
    if (_perAyahSession) return;
    _perAyahSession = true;
    mediaItem.add(null);
    playbackState.add(playbackState.value.copyWith(playing: false, processingState: AudioProcessingState.idle));
  }

  /// Enters a Listening Mode session ([playSurahLocal]/
  /// [playSupplementaryTrack]). If a per-ayah queue session was active,
  /// its in-app-only state is cleared so no stale "now playing" ayah
  /// lingers once Listening Mode's own state takes over.
  void _enterOsFacingSession() {
    if (!_perAyahSession) return;
    _perAyahSession = false;
    _inAppMediaItemController.add(null);
    _inAppPlaybackStateController.add(
      playbackState.value.copyWith(playing: false, processingState: AudioProcessingState.idle),
    );
  }

  /// Sum of every *already-finished* part's duration (parts before
  /// [_currentPartIndex]) — the offset that turns just_audio's
  /// current-part-relative position into this Surah's true, continuous
  /// position. `Duration.zero` whenever [_partDurations] is empty (the
  /// per-ayah queue) or has only one entry (the ordinary, un-split case)
  /// — both correctly reduce to "no offset".
  Duration _priorPartsDuration() {
    var total = Duration.zero;
    for (var i = 0; i < _currentPartIndex && i < _partDurations.length; i++) {
      total += _partDurations[i] ?? Duration.zero;
    }
    return total;
  }

  /// Once every part's duration is known, publishes their sum as the
  /// current [MediaItem]'s duration (lock-screen scrubber/mini-player
  /// progress — see `mini_player_bar.dart`). Until then (typically only
  /// a brief moment after [playSurahLocal] starts) it's left unset,
  /// matching how a plain single-file duration is unknown until
  /// `just_audio` reports it.
  void _maybeUpdateMediaItemDuration() {
    final current = mediaItem.value;
    if (current == null || _partDurations.any((d) => d == null)) return;
    final total = _partDurations.fold<Duration>(Duration.zero, (sum, d) => sum + d!);
    if (current.duration == total) return;
    mediaItem.add(current.copyWith(duration: total));
  }

  /// Plays a single ayah. Cancels any in-progress "play whole surah"
  /// queue — a direct tap always wins over sequential auto-play.
  Future<void> playAyah({required int surahNumber, required int ayahNumber, required String url}) async {
    _queue = null;
    _queueSurahNumber = surahNumber;
    _lastPlayWasLocalSurah = false;
    _isPlayingLocalSurahArabic = false;
    _partDurations = [];
    _currentPartIndex = 0;
    _enterPerAyahSession();
    await _playUrl(surahNumber: surahNumber, ayahNumber: ayahNumber, url: url);
  }

  /// Plays every ayah in [ayahs] that has audio, in order, advancing
  /// automatically as each one finishes. Reading + Listening Mode's
  /// per-ayah-synced playback — see [playSurahLocal] for Listening
  /// Mode's whole-Surah-file playback instead. Foreground-only by
  /// design — see [_enterPerAyahSession] and
  /// `surah_reader_screen.dart`'s pause-on-leave handling; this method
  /// itself doesn't need to know about backgrounding, since it never
  /// puts anything on the lock screen to begin with.
  Future<void> playSurahAyahs(int surahNumber, List<Ayah> ayahs) async {
    _queue = ayahs.where((a) => a.audioUrl != null).toList(growable: false);
    _queueSurahNumber = surahNumber;
    _queueIndex = 0;
    _lastPlayWasLocalSurah = false;
    _isPlayingLocalSurahArabic = false;
    _partDurations = [];
    _currentPartIndex = 0;
    _enterPerAyahSession();
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
    _setMediaItem(_mediaItemFor(surahNumber, ayahNumber, url));
    _publishLoading();
    try {
      await _player.setUrl(url);
      await _player.play();
    } catch (_) {
      // Skip a track that fails to load rather than stalling the queue.
      if (_queue != null) {
        await _playQueueAt(_queueIndex + 1);
      } else {
        _publishError();
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
  /// while this plays. Cached on-device after first play, same as
  /// [playSurahLocal] — see [_audioSourceFor]. Never split (every Urdu
  /// track is under the 50MiB Storage limit), so this is always exactly
  /// one part — [_partDurations] here is really just "unlock the same
  /// duration-tracking machinery [playSurahLocal] uses", not multi-part
  /// handling.
  Future<void> playSupplementaryTrack({required int surahNumber, required String url, required String title}) async {
    _queue = null;
    _queueSurahNumber = surahNumber;
    _isPlayingLocalSurahArabic = false;
    _partDurations = [null];
    _currentPartIndex = 0;
    _enterOsFacingSession();
    _setMediaItem(
      MediaItem(
        id: url,
        title: title,
        artist: 'IqraSpace',
        extras: {MediaItemExtra.surahNumber: surahNumber, MediaItemExtra.ayahNumber: -1},
      ),
    );
    _publishLoading();
    try {
      await _player.setAudioSource(await _audioSourceFor(cacheKey: 'urdu_$surahNumber', remoteUrl: url));
      await _player.play();
    } catch (_) {
      _publishError();
    }
  }

  /// Plays Listening Mode's whole-Surah Al-Afasy recitation for
  /// [surahNumber] (see `arabic_surah_audio.dart`), replacing that
  /// mode's old per-ayah Quran-API-streamed queue. That old approach is
  /// the most likely cause of audio dropping when the phone locks: a
  /// mid-queue network fetch for the *next* ayah stalling once Android
  /// throttles a backgrounded/doze process silently broke the chain. One
  /// continuous audio source removes that failure mode entirely for this
  /// mode. No-ops if no part has been uploaded yet for this Surah.
  ///
  /// Almost every Surah is exactly one part; a handful were split into
  /// several purely as a since-migrated storage backend's size workaround (see
  /// `arabic_surah_audio.dart`'s doc comment) — those play back through
  /// one `ConcatenatingAudioSource`, which is gapless on Android (see
  /// that class's own `just_audio` doc comment), so it's inaudible as
  /// anything other than one continuous Surah; a single part skips the
  /// wrapper entirely, since a `ConcatenatingAudioSource` of one child
  /// would behave identically but isn't needed to.
  ///
  /// Tagged `ayahNumber: -1`, same as [playSupplementaryTrack] — Listening
  /// Mode doesn't highlight a per-ayah position (only Reading + Listening
  /// Mode does, via [playSurahAyahs]).
  Future<void> playSurahLocal(int surahNumber) async {
    final parts = arabicSurahAudioParts(surahNumber);
    if (parts.isEmpty) return;
    _queue = null;
    _queueSurahNumber = surahNumber;
    _lastPlayWasLocalSurah = true;
    _isPlayingLocalSurahArabic = true;
    _partDurations = [for (final part in parts) part.duration];
    _currentPartIndex = 0;
    _enterOsFacingSession();
    final surahName = surahTransliterationFor(surahNumber, currentAppLanguageFromHive());
    final knownTotal = _partDurations.any((d) => d == null)
        ? null
        : _partDurations.fold<Duration>(Duration.zero, (sum, d) => sum + d!);
    _setMediaItem(
      MediaItem(
        id: parts.first.url,
        title: surahName,
        artist: 'IqraSpace',
        duration: knownTotal,
        extras: {MediaItemExtra.surahNumber: surahNumber, MediaItemExtra.ayahNumber: -1},
      ),
    );
    // Immediate feedback the instant Play is tapped — see
    // [_publishLoading]'s doc comment for why this can't just wait for
    // `just_audio`'s own processing state.
    _publishLoading();
    try {
      final children = <AudioSource>[
        for (var i = 0; i < parts.length; i++)
          await _audioSourceFor(cacheKey: 'arabic_${surahNumber}_p$i', remoteUrl: parts[i].url),
      ];
      await _player.setAudioSource(
        children.length == 1
            ? children.first
            // Both children are already fully downloaded to disk (native)
            // by the time this runs — see [_audioSourceFor] — so eager
            // preparation costs nothing and guarantees the next part is
            // ready before the current one finishes, per just_audio's own
            // gapless-on-Android behavior for this class.
            : ConcatenatingAudioSource(children: children, useLazyPreparation: false),
      );
      await _player.play();
    } catch (_) {
      _isPlayingLocalSurahArabic = false;
      _publishError();
    }
  }

  /// Native: resolves [cacheKey] via [AudioCacheManager] (downloading
  /// [remoteUrl] on first play, reading the cached file on every later
  /// one) and returns a local-file source. Web: no persistent
  /// app-writable filesystem to cache into, so `just_audio` streams
  /// [remoteUrl] directly, same as before this cache layer existed.
  Future<AudioSource> _audioSourceFor({required String cacheKey, required String remoteUrl}) async {
    if (kIsWeb) return AudioSource.uri(Uri.parse(remoteUrl));
    final localPath = await AudioCacheManager.resolve(cacheKey, remoteUrl);
    return AudioSource.file(localPath);
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

  /// When a per-ayah queue finishes, just stops (unchanged). When
  /// [playSurahLocal]'s Arabic portion finishes, reads the *live*
  /// `listeningTrack` preference from Hive — not one captured back when
  /// Play was tapped — and chains into the Urdu-translation track if
  /// that's currently selected and available; see
  /// [_isPlayingLocalSurahArabic]'s doc comment for why this replaced a
  /// widget-owned listener that silently died on navigation.
  void _advanceQueueOrStop() {
    if (_queue != null) {
      _playQueueAt(_queueIndex + 1);
      return;
    }
    if (_isPlayingLocalSurahArabic) {
      _isPlayingLocalSurahArabic = false;
      final surahNumber = _queueSurahNumber;
      final trackName = HiveBoxes.settingsBox.get('listeningTrack') as String?;
      final url = (surahNumber != null && trackName == ListeningTrack.arabicPlusUrdu.name)
          ? urduSurahAudioUrl(surahNumber)
          : null;
      if (url != null) {
        playSupplementaryTrack(surahNumber: surahNumber!, url: url, title: 'Urdu Translation');
        return;
      }
    }
    _clear();
  }

  Future<void> _clear() async {
    _partDurations = [];
    _currentPartIndex = 0;
    _isPlayingLocalSurahArabic = false;
    _setMediaItem(null);
    _publishPlaybackState(playbackState.value.copyWith(playing: false, processingState: AudioProcessingState.idle));
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

  /// [position] is this Surah's true, continuous position — the same
  /// one [_broadcastState] publishes — not just_audio's own
  /// current-part-relative position. For the ordinary single-part case
  /// (including per-ayah playback, where [_partDurations] is empty) this
  /// is a plain passthrough; for a split Surah (see [playSurahLocal]) it
  /// walks [_partDurations] to find which part [position] actually falls
  /// in and seeks there with that part's own `index`, per just_audio's
  /// documented `seek(position, {index})` contract.
  @override
  Future<void> seek(Duration position) async {
    if (_partDurations.length <= 1) {
      return _player.seek(position);
    }
    var remaining = position;
    for (var i = 0; i < _partDurations.length; i++) {
      final partDuration = _partDurations[i];
      final isLastPart = i == _partDurations.length - 1;
      if (partDuration == null || remaining < partDuration || isLastPart) {
        await _player.seek(remaining, index: i);
        return;
      }
      remaining -= partDuration;
    }
  }

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

  /// Continues in whichever mode was actually playing — [playSurahLocal]
  /// (Listening Mode's whole-Surah file) if that's what triggered this
  /// skip, otherwise the per-ayah queue (Reading + Listening Mode) as
  /// before. Without this, lock-screen Next/Previous during Listening
  /// Mode would silently switch the Surah to per-ayah Quran-API
  /// streaming — reintroducing the very background-drop risk
  /// [playSurahLocal] exists to remove.
  Future<void> _jumpToSurah(int surahNumber) async {
    if (surahNumber < 1 || surahNumber > 114) return;
    if (_lastPlayWasLocalSurah) {
      await playSurahLocal(surahNumber);
      return;
    }
    final reciterEdition = (HiveBoxes.settingsBox.get('reciterEdition') as String?) ?? defaultReciterIdentifier;
    final ayahs = await _repository.getSurah(surahNumber, reciterEdition: reciterEdition);
    await playSurahAyahs(surahNumber, ayahs);
  }

  Future<void> disposeHandler() async {
    await _player.dispose();
    await _inAppMediaItemController.close();
    await _inAppPlaybackStateController.close();
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
