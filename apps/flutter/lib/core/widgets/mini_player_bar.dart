import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/widgets/surah_name_label.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/audio_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/screens/surah_reader_screen.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Home's "current playback progress" — a slim bar shown only while
/// audio is active (Listening or Reading + Listening Mode), so it never
/// takes up space otherwise. Its Play/Pause and Previous/Next-Surah
/// controls call the same [AudioController] methods the lock-screen
/// notification uses (see `iqra_audio_handler.dart`), so both stay in
/// sync. Tapping the bar itself (outside those controls) opens the
/// Surah currently playing, matching the "Continue Reading" card's own
/// navigation pattern.
class MiniPlayerBar extends ConsumerWidget {
  const MiniPlayerBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final audio = ref.watch(audioControllerProvider);
    if (audio.surahNumber == null || audio.ayahNumber == null) return const SizedBox.shrink();

    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final brand = IqraSpaceBrand.teal(themeMode);
    final l10n = AppLocalizations.of(context)!;
    final controller = ref.read(audioControllerProvider.notifier);
    final progress = audio.duration != null && audio.duration!.inMilliseconds > 0
        ? audio.position.inMilliseconds / audio.duration!.inMilliseconds
        : 0.0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: colors.chromeColor,
        borderRadius: BorderRadius.circular(14),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => SurahReaderScreen(surahNumber: audio.surahNumber!, initialAyahNumber: audio.ayahNumber),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Icon(Icons.graphic_eq, size: 18, color: brand),
                    const SizedBox(width: 8),
                    Expanded(
                      child: SurahNameLabel(
                        surahNumber: audio.surahNumber!,
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                        translitStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ),
                    IconButton(
                      iconSize: 20,
                      visualDensity: VisualDensity.compact,
                      icon: const Icon(Icons.skip_previous),
                      tooltip: l10n.playbackPreviousSurah,
                      onPressed: controller.skipToPreviousSurah,
                    ),
                    IconButton(
                      iconSize: 24,
                      visualDensity: VisualDensity.compact,
                      icon: Icon(audio.isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill, color: brand),
                      tooltip: audio.isPlaying ? l10n.playbackPause : l10n.playbackPlay,
                      onPressed: audio.isPlaying ? controller.pause : controller.resume,
                    ),
                    IconButton(
                      iconSize: 20,
                      visualDensity: VisualDensity.compact,
                      icon: const Icon(Icons.skip_next),
                      tooltip: l10n.playbackNextSurah,
                      onPressed: controller.skipToNextSurah,
                    ),
                  ],
                ),
                ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    value: progress.clamp(0, 1),
                    minHeight: 3,
                    backgroundColor: colors.textColor.withValues(alpha: 0.12),
                    valueColor: AlwaysStoppedAnimation(brand),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
