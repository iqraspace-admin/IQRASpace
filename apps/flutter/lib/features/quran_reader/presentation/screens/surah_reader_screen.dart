import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/audio_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/widgets/ayah_rich_text.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

/// Reads one surah. [initialAyahNumber], when given (from a search result
/// or a bookmark), scrolls straight to that ayah on open — a plain
/// ListView's jumpTo only estimates an offset, which drifts badly on
/// long surahs (e.g. Al-Baqarah's 286 ayat), so this uses
/// ScrollablePositionedList for a real scroll-to-index.
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
  Timer? _autoScrollTimer;
  double? _autoScrollSpeedApplied;

  static const _autoScrollTick = Duration(milliseconds: 100);

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

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reciterEdition = ref.watch(reciterEditionProvider);
    final surahRequest = (surahNumber: widget.surahNumber, reciterEdition: reciterEdition);
    final ayahsAsync = ref.watch(surahProvider(surahRequest));
    final surahListAsync = ref.watch(surahListProvider);
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final fontSize = ref.watch(fontSizeProvider);
    final audioState = ref.watch(audioControllerProvider);
    final readMode = ref.watch(readModeProvider);
    final autoScrollOn = ref.watch(autoScrollEnabledProvider);
    final autoScrollSpeed = ref.watch(autoScrollSpeedProvider);

    // Keep the currently-playing ayah in view as playback (single-ayah or
    // whole-surah sequential) advances, so the reader can follow along
    // without manually scrolling.
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
    if (autoScrollOn) {
      if (_autoScrollTimer == null || _autoScrollSpeedApplied != autoScrollSpeed) {
        _startAutoScroll(autoScrollSpeed);
        _autoScrollSpeedApplied = autoScrollSpeed;
      }
    } else if (_autoScrollTimer != null) {
      _stopAutoScroll();
      _autoScrollSpeedApplied = null;
    }

    final surahEnglishName = surahListAsync.maybeWhen(
      data: (list) {
        for (final s in list) {
          if (s.number == widget.surahNumber) return s.englishName;
        }
        return 'Surah ${widget.surahNumber}';
      },
      orElse: () => 'Surah ${widget.surahNumber}',
    );

    final isPlayingThisSurah =
        audioState.surahNumber == widget.surahNumber && audioState.ayahNumber != null;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Text(surahEnglishName),
        actions: [
          if (!readMode)
            ayahsAsync.maybeWhen(
              data: (ayahs) => IconButton(
                icon: Icon(isPlayingThisSurah ? Icons.stop_circle : Icons.play_circle_outline),
                tooltip: isPlayingThisSurah ? 'Stop' : 'Play whole surah',
                onPressed: () {
                  final controller = ref.read(audioControllerProvider.notifier);
                  if (isPlayingThisSurah) {
                    controller.stop();
                  } else {
                    controller.playSurah(widget.surahNumber, ayahs);
                  }
                },
              ),
              orElse: () => const SizedBox.shrink(),
            ),
          IconButton(
            icon: Icon(autoScrollOn ? Icons.pause : Icons.play_arrow),
            tooltip: autoScrollOn ? 'Stop auto-scroll' : 'Start auto-scroll',
            onPressed: () => ref.read(autoScrollEnabledProvider.notifier).state = !autoScrollOn,
          ),
          IconButton(
            icon: Icon(readMode ? Icons.menu_book : Icons.menu_book_outlined),
            tooltip: readMode ? 'Exit Read Mode' : 'Read Mode (Arabic only)',
            onPressed: () => ref.read(readModeProvider.notifier).setEnabled(!readMode),
          ),
          IconButton(
            icon: const Icon(Icons.text_decrease),
            tooltip: 'Smaller text',
            onPressed: () => ref.read(fontSizeProvider.notifier).setSize(fontSize - 2),
          ),
          IconButton(
            icon: const Icon(Icons.text_increase),
            tooltip: 'Larger text',
            onPressed: () => ref.read(fontSizeProvider.notifier).setSize(fontSize + 2),
          ),
        ],
      ),
      body: ayahsAsync.when(
        data: (ayahs) {
          final initialIndex = widget.initialAyahNumber != null
              ? (widget.initialAyahNumber! - 1).clamp(0, ayahs.length - 1)
              : 0;
          return ScrollablePositionedList.builder(
            itemScrollController: _itemScrollController,
            scrollOffsetController: _scrollOffsetController,
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
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Could not load this surah.\n$error', textAlign: TextAlign.center),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.refresh(surahProvider(surahRequest)),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
