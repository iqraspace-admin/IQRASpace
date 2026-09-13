import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/reader_mode.dart';
import 'package:quran_flutter/core/constants/surah_transliterations.dart';
import 'package:quran_flutter/core/constants/urdu_surah_audio.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/widgets/brand_mark.dart';
import 'package:quran_flutter/core/widgets/surah_name_label.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/surah_summary.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/audio_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/widgets/ayah_rich_text.dart';
import 'package:quran_flutter/features/quran_reader/presentation/widgets/jump_to_surah_sheet.dart';
import 'package:quran_flutter/features/settings/presentation/widgets/reader_settings_sheet.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

/// Reads one surah. [initialAyahNumber], when given (from a search result
/// or a bookmark), scrolls straight to that ayah on open — a plain
/// ListView's jumpTo only estimates an offset, which drifts badly on
/// long surahs (e.g. Al-Baqarah's 286 ayat), so this uses
/// ScrollablePositionedList for a real scroll-to-index.
///
/// Deliberately has NO bottom navigation bar — the design brief calls
/// for a distraction-free reading screen; Home/Quran/Learn/Bookmarks/
/// Settings navigation resumes once the reader leaves this screen.
class SurahReaderScreen extends ConsumerStatefulWidget {
  final int surahNumber;
  final int? initialAyahNumber;

  const SurahReaderScreen({required this.surahNumber, this.initialAyahNumber, super.key});

  @override
  ConsumerState<SurahReaderScreen> createState() => _SurahReaderScreenState();
}

class _SurahReaderScreenState extends ConsumerState<SurahReaderScreen> {
  final _itemScrollController = ItemScrollController();
  final _scrollOffsetController = ScrollOffsetController();
  final _itemPositionsListener = ItemPositionsListener.create();
  Timer? _autoScrollTimer;
  double? _autoScrollSpeedApplied;

  // Captured as the reader scrolls (see _onPositionsChanged) and written
  // to lastReadProvider on dispose — "where they left off" only needs to
  // be durable once the reader actually leaves, not on every frame.
  int? _visibleAyahNumber;
  String _surahEnglishName = '';
  int _totalAyahs = 0;

  // Captured fresh on every build (see build()) so dispose() can call it
  // directly — flutter_riverpod's ConsumerStatefulElement has already
  // marked itself disposed by the time State.dispose() runs, so
  // `ref.read(...)` inside dispose() throws "Cannot use ref after the
  // widget was disposed" even though this reads as the natural place
  // to persist "where the reader left off". Holding the notifier
  // instance itself sidesteps that — calling a method on a plain Dart
  // object needs no `ref` lookup.
  LastReadNotifier? _lastReadNotifier;

  static const _autoScrollTick = Duration(milliseconds: 100);

  @override
  void initState() {
    super.initState();
    _surahEnglishName = 'Surah ${widget.surahNumber}';
    _itemPositionsListener.itemPositions.addListener(_onPositionsChanged);
    _pauseAudioIfReadingListeningElsewhere();
  }

  /// Reading + Listening Mode's "manual navigation pauses (not stops)
  /// playback" rule. Every navigation into a Surah screen — Jump-to-
  /// Surah, the Previous/Next Surah row, a bookmark/search deep link —
  /// creates a fresh [SurahReaderScreen] instance (see `_goToSurah`'s
  /// `pushReplacement`), so checking once here on construction covers
  /// all of them without instrumenting each call site individually. Does
  /// nothing if the audio already matches where this screen is opening
  /// (nothing to pause), or if the mode isn't readingListening (Listening
  /// Mode audio is meant to keep playing across navigation/background).
  void _pauseAudioIfReadingListeningElsewhere() {
    if (ref.read(readerModeProvider) != ReaderMode.readingListening) return;
    final audio = ref.read(audioControllerProvider);
    if (!audio.isPlaying) return;
    final targetAyah = widget.initialAyahNumber ?? 1;
    final samePosition = audio.surahNumber == widget.surahNumber && audio.ayahNumber == targetAyah;
    if (!samePosition) {
      ref.read(audioControllerProvider.notifier).pause();
    }
  }

  /// Listening Mode's "Recitation + Urdu Translation" track: once the
  /// Arabic ayah queue for [surahNumber] finishes on its own (audio
  /// state resets to inactive), play that Surah's Urdu-translation audio
  /// (see `lib/core/constants/urdu_surah_audio.dart`) right after — never
  /// interleaved with the Arabic ayahs. A no-op today until Urdu audio
  /// URLs are filled in (see that file).
  void _armUrduFollowUp(int surahNumber) {
    final url = urduSurahAudioUrl(surahNumber);
    if (url == null) return;
    late final ProviderSubscription<AudioPlaybackState> sub;
    sub = ref.listenManual<AudioPlaybackState>(audioControllerProvider, (previous, next) {
      final arabicQueueJustFinished = previous?.surahNumber == surahNumber && next.surahNumber == null;
      if (!arabicQueueJustFinished) return;
      sub.close();
      ref.read(audioControllerProvider.notifier).playUrduTranslation(surahNumber, url);
    });
  }

  void _onPositionsChanged() {
    final positions = _itemPositionsListener.itemPositions.value;
    if (positions.isEmpty) return;
    // The top-most item still (at least partially) on screen.
    final topIndex = positions
        .where((p) => p.itemLeadingEdge < 1 && p.itemTrailingEdge > 0)
        .reduce((a, b) => a.itemLeadingEdge < b.itemLeadingEdge ? a : b)
        .index;
    _visibleAyahNumber = topIndex + 1;
  }

  void _startAutoScroll(double pixelsPerSecond) {
    _autoScrollTimer?.cancel();
    _autoScrollTimer = Timer.periodic(_autoScrollTick, (_) {
      // ScrollOffsetController has no public "isAttached" guard (unlike
      // ItemScrollController) — it throws if the list hasn't built yet.
      // A tick or two lost while that settles is harmless; swallow it.
      try {
        _scrollOffsetController.animateScroll(
          offset: pixelsPerSecond * (_autoScrollTick.inMilliseconds / 1000),
          duration: _autoScrollTick,
          curve: Curves.linear,
        );
      } catch (_) {
        // Not attached yet, or already at the end of the list.
      }
    });
  }

  void _stopAutoScroll() {
    _autoScrollTimer?.cancel();
    _autoScrollTimer = null;
  }

  void _goToSurah(int surahNumber, {int? ayahNumber}) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => SurahReaderScreen(surahNumber: surahNumber, initialAyahNumber: ayahNumber),
      ),
    );
  }

  Future<void> _openJumpToSurah() async {
    final target = await showJumpToSurahSheet(
      context,
      currentSurah: widget.surahNumber,
      currentAyah: _visibleAyahNumber ?? widget.initialAyahNumber ?? 1,
    );
    if (target == null || !mounted) return;
    _goToSurah(target.surahNumber, ayahNumber: target.ayahNumber);
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _itemPositionsListener.itemPositions.removeListener(_onPositionsChanged);
    final ayahNumber = _visibleAyahNumber;
    if (ayahNumber != null && _totalAyahs > 0) {
      final notifier = _lastReadNotifier;
      final surahNumber = widget.surahNumber;
      final surahEnglishName = _surahEnglishName;
      final totalAyahs = _totalAyahs;
      // Riverpod refuses to let a provider's state change synchronously
      // during ANY widget life-cycle method — dispose() included, even
      // once the ref-inside-dispose problem above is worked around by
      // capturing the notifier ahead of time — so the actual mutation
      // has to be deferred a tick past this teardown, per Riverpod's own
      // suggested fix for "Tried to modify a provider while the widget
      // tree was building.".
      Future(() {
        notifier?.update(
          surahNumber: surahNumber,
          ayahNumber: ayahNumber,
          surahEnglishName: surahEnglishName,
          surahTotalAyahs: totalAyahs,
        );
      });
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    _lastReadNotifier = ref.read(lastReadProvider.notifier);
    final reciterEdition = ref.watch(reciterEditionProvider);
    final surahRequest = (surahNumber: widget.surahNumber, reciterEdition: reciterEdition);
    final ayahsAsync = ref.watch(surahProvider(surahRequest));
    final surahListAsync = ref.watch(surahListProvider);
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final audioState = ref.watch(audioControllerProvider);
    final readMode = ref.watch(readModeProvider);
    final autoScrollOn = ref.watch(autoScrollEnabledProvider);
    final autoScrollSpeed = ref.watch(autoScrollSpeedProvider);
    final readerMode = ref.watch(readerModeProvider);
    final listeningTrack = ref.watch(listeningTrackProvider);

    // Keep the currently-playing ayah in view as playback (single-ayah or
    // whole-surah sequential) advances, so the reader can follow along
    // without manually scrolling. This is the ONE auto-scroll mechanism
    // for Listening/Reading+Listening Modes — see the manual-auto-scroll
    // reconciliation below.
    ref.listen<AudioPlaybackState>(audioControllerProvider, (previous, next) {
      if (next.surahNumber != widget.surahNumber || next.ayahNumber == null) return;
      final samePosition =
          previous?.surahNumber == next.surahNumber && previous?.ayahNumber == next.ayahNumber;
      if (samePosition || !_itemScrollController.isAttached) return;
      _itemScrollController.scrollTo(
        index: next.ayahNumber! - 1,
        alignment: 0.3,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    });

    // Auto-scroll on/off and its speed both live in Riverpod (so Settings
    // can adjust speed live, and the toggle carries over when navigating
    // to another surah). Checked directly here rather than via
    // ref.listen, which only fires on change — a screen that mounts
    // while auto-scroll is already on needs to start it too, not wait
    // for the next toggle.
    //
    // Only runs in Reading Mode: Listening/Reading+Listening already have
    // the audio-follow-scroll above, and running both at once was an
    // unreconciled pre-existing gap (they'd visually fight) — Reading
    // Mode has no audio at all, so it's the only mode this manual,
    // timer-driven scroll actually applies to.
    if (autoScrollOn && readerMode == ReaderMode.reading) {
      if (_autoScrollTimer == null || _autoScrollSpeedApplied != autoScrollSpeed) {
        _startAutoScroll(autoScrollSpeed);
        _autoScrollSpeedApplied = autoScrollSpeed;
      }
    } else if (_autoScrollTimer != null) {
      _stopAutoScroll();
      _autoScrollSpeedApplied = null;
    }

    // Entering Reading Mode: no continuous audio playback (per spec) —
    // pause anything in progress. Entering Listening/Reading+Listening
    // doesn't auto-start audio; the reader still chooses Play.
    ref.listen<ReaderMode>(readerModeProvider, (previous, next) {
      if (next == ReaderMode.reading && audioState.isPlaying) {
        ref.read(audioControllerProvider.notifier).pause();
      }
    });

    final l10n = AppLocalizations.of(context)!;
    final language = ref.watch(appLanguageProvider);
    final surahList = surahListAsync.maybeWhen(data: (list) => list, orElse: () => null);
    final currentSurah = _lookupSurah(surahList, widget.surahNumber);
    final surahEnglishName = currentSurah?.englishName ?? _surahEnglishName;
    final surahArabicName = currentSurah?.name;
    _surahEnglishName = surahEnglishName;
    final previousSurahNumber = widget.surahNumber - 1;
    final nextSurahNumber = widget.surahNumber + 1;
    final hasPrevious = _lookupSurah(surahList, previousSurahNumber) != null;
    final hasNext = _lookupSurah(surahList, nextSurahNumber) != null;

    final isPlayingThisSurah =
        audioState.surahNumber == widget.surahNumber && audioState.ayahNumber != null;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        toolbarHeight: 64,
        title: InkWell(
          onTap: _openJumpToSurah,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Flexible(
                      child: SurahNameLabel(
                        surahNumber: widget.surahNumber,
                        arabicName: surahArabicName,
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                        arabicStyle: const TextStyle(fontSize: 19, fontWeight: FontWeight.w600),
                        translitStyle: TextStyle(fontSize: 13, color: colors.textColor.withValues(alpha: 0.75)),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(Icons.unfold_more, size: 15, color: colors.textColor.withValues(alpha: 0.5)),
                  ],
                ),
              ],
            ),
          ),
        ),
        actions: [
          if (!readMode && readerMode != ReaderMode.reading)
            ayahsAsync.maybeWhen(
              data: (ayahs) => IconButton(
                icon: Icon(isPlayingThisSurah ? Icons.stop_circle : Icons.play_circle_outline),
                tooltip: isPlayingThisSurah ? l10n.readerStop : l10n.readerPlayWholeSurah,
                onPressed: () {
                  final controller = ref.read(audioControllerProvider.notifier);
                  if (isPlayingThisSurah) {
                    controller.stop();
                  } else {
                    controller.playSurah(widget.surahNumber, ayahs);
                    if (readerMode == ReaderMode.listening && listeningTrack == ListeningTrack.arabicPlusUrdu) {
                      _armUrduFollowUp(widget.surahNumber);
                    }
                  }
                },
              ),
              orElse: () => const SizedBox.shrink(),
            ),
          IconButton(
            icon: const Icon(Icons.tune),
            tooltip: l10n.readerReadingSettings,
            onPressed: () => showReaderSettingsSheet(context),
          ),
          PopupMenuButton<String>(
            tooltip: l10n.readerMore,
            onSelected: (value) {
              switch (value) {
                case 'autoscroll':
                  ref.read(autoScrollEnabledProvider.notifier).state = !autoScrollOn;
                case 'readmode':
                  ref.read(readModeProvider.notifier).setEnabled(!readMode);
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'autoscroll',
                child: Row(
                  children: [
                    Icon(autoScrollOn ? Icons.pause : Icons.play_arrow, size: 20),
                    const SizedBox(width: 10),
                    Text(autoScrollOn ? l10n.readerStopAutoScroll : l10n.readerStartAutoScroll),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'readmode',
                child: Row(
                  children: [
                    Icon(readMode ? Icons.menu_book : Icons.menu_book_outlined, size: 20),
                    const SizedBox(width: 10),
                    Text(readMode ? l10n.readerExitReadMode : l10n.readerReadModeArabicOnly),
                  ],
                ),
              ),
            ],
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(80),
          child: Column(
            children: [
              _ReaderModeRow(
                mode: readerMode,
                onChanged: (mode) => ref.read(readerModeProvider.notifier).setMode(mode),
                l10n: l10n,
                textColor: colors.textColor,
                brand: IqraSpaceBrand.teal(themeMode),
              ),
              _SurahNavRow(
                previousLabel: hasPrevious ? surahTransliterationFor(previousSurahNumber, language) : null,
                nextLabel: hasNext ? surahTransliterationFor(nextSurahNumber, language) : null,
                onPrevious: hasPrevious ? () => _goToSurah(previousSurahNumber) : null,
                onNext: hasNext ? () => _goToSurah(nextSurahNumber) : null,
                firstSurahLabel: l10n.readerFirstSurah,
                lastSurahLabel: l10n.readerLastSurah,
                textColor: colors.textColor,
              ),
            ],
          ),
        ),
      ),
      body: ayahsAsync.when(
        data: (ayahs) {
          _totalAyahs = ayahs.length;
          final initialIndex = widget.initialAyahNumber != null
              ? (widget.initialAyahNumber! - 1).clamp(0, ayahs.length - 1)
              : 0;
          return ScrollablePositionedList.builder(
            itemScrollController: _itemScrollController,
            scrollOffsetController: _scrollOffsetController,
            itemPositionsListener: _itemPositionsListener,
            initialScrollIndex: initialIndex,
            padding: const EdgeInsets.all(20),
            itemCount: ayahs.length,
            itemBuilder: (context, index) {
              final ayah = ayahs[index];
              // "Now playing" (from either per-ayah or whole-surah audio)
              // takes priority over the search/bookmark deep-link target
              // highlight — both are rare to coincide, but a listener
              // following along by ear cares more about the former. Both
              // are skipped entirely in Read Mode, which has no audio.
              final isPlaying =
                  !readMode && audioState.isActive(widget.surahNumber, ayah.numberInSurah);
              final isTarget = !readMode && widget.initialAyahNumber == ayah.numberInSurah;
              // Brand teal for "now playing", brand gold for a search/
              // bookmark deep-link target — same two accent colors used
              // everywhere else in the app, not ad hoc Material colors.
              //
              // A full OUTLINE, not a filled background tint: an earlier
              // version tinted the whole ayah's background, which sat
              // directly behind the Tajweed-colored glyphs and visually
              // blended with them (e.g. a blue madd letter over a
              // translucent gold fill reads as a third, muddy color) —
              // reported as "script colors getting mixed up". A plain
              // left border fixed that but was reported too subtle to
              // read as "highlighted". An outline (stroke only, no fill)
              // stays clearly visible while still never painting behind
              // the text itself, so Tajweed colors stay exactly as
              // rendered either way.
              final accentColor = isPlaying
                  ? IqraSpaceBrand.teal(themeMode)
                  : isTarget
                      ? IqraSpaceBrand.gold(themeMode)
                      : null;

              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: accentColor != null
                    ? const EdgeInsets.all(10)
                    : EdgeInsets.zero,
                decoration: accentColor != null
                    ? BoxDecoration(
                        border: Border.all(color: accentColor, width: 2),
                        borderRadius: BorderRadius.circular(10),
                      )
                    : null,
                child: AyahRichText(
                  ayah: ayah,
                  surahNumber: widget.surahNumber,
                  surahEnglishName: surahEnglishName,
                ),
              );
            },
          );
        },
        loading: () => const BrandedLoadingIndicator(),
        error: (error, stackTrace) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const BrandMark(size: 40),
                const SizedBox(height: 14),
                Text(
                  l10n.commonCouldNotReachReader,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  '$error',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.refresh(surahProvider(surahRequest)),
                  child: Text(l10n.commonRetry),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  SurahSummary? _lookupSurah(List<SurahSummary>? list, int surahNumber) {
    if (list == null || surahNumber < 1 || surahNumber > 114) return null;
    for (final s in list) {
      if (s.number == surahNumber) return s;
    }
    return null;
  }
}

/// The Listening / Reading / Reading+Listening switcher — "clearly
/// accessible and easy to switch between", pinned directly under the
/// AppBar title so it never needs the settings sheet.
class _ReaderModeRow extends StatelessWidget {
  final ReaderMode mode;
  final ValueChanged<ReaderMode> onChanged;
  final AppLocalizations l10n;
  final Color textColor;
  final Color brand;

  const _ReaderModeRow({
    required this.mode,
    required this.onChanged,
    required this.l10n,
    required this.textColor,
    required this.brand,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      child: SegmentedButton<ReaderMode>(
        segments: [
          for (final m in ReaderMode.values)
            ButtonSegment(value: m, icon: Icon(m.icon, size: 16), label: Text(m.label(l10n))),
        ],
        selected: {mode},
        showSelectedIcon: false,
        onSelectionChanged: (selected) => onChanged(selected.first),
        style: SegmentedButton.styleFrom(
          visualDensity: VisualDensity.compact,
          selectedForegroundColor: Colors.white,
          selectedBackgroundColor: brand,
          foregroundColor: textColor.withValues(alpha: 0.7),
          textStyle: const TextStyle(fontSize: 11),
        ),
      ),
    );
  }
}

/// The Previous Surah / Next Surah row, pinned directly under the AppBar
/// title (via AppBar's `bottom:`) so it stays reachable without
/// scrolling, matching the approved design's surah-navigation row.
class _SurahNavRow extends StatelessWidget {
  final String? previousLabel;
  final String? nextLabel;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;
  final String firstSurahLabel;
  final String lastSurahLabel;
  final Color textColor;

  const _SurahNavRow({
    required this.previousLabel,
    required this.nextLabel,
    required this.onPrevious,
    required this.onNext,
    required this.firstSurahLabel,
    required this.lastSurahLabel,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final mutedColor = textColor.withValues(alpha: 0.55);
    final activeColor = textColor.withValues(alpha: 0.85);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: TextButton.icon(
              onPressed: onPrevious,
              icon: const Icon(Icons.chevron_left, size: 18),
              label: Text(previousLabel ?? firstSurahLabel, overflow: TextOverflow.ellipsis),
              style: TextButton.styleFrom(
                foregroundColor: onPrevious != null ? activeColor : mutedColor,
                alignment: Alignment.centerLeft,
              ),
            ),
          ),
          Expanded(
            child: TextButton.icon(
              onPressed: onNext,
              icon: const Icon(Icons.chevron_right, size: 18),
              label: Text(nextLabel ?? lastSurahLabel, overflow: TextOverflow.ellipsis),
              iconAlignment: IconAlignment.end,
              style: TextButton.styleFrom(
                foregroundColor: onNext != null ? activeColor : mutedColor,
                alignment: Alignment.centerRight,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
