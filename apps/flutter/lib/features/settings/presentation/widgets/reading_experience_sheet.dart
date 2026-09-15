import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Reading Experience — Read Mode, Show Bookmark Icons, Auto-scroll
/// speed — split out of the main Reader Settings sheet so that sheet
/// stays short. Every control here applies live via Riverpod just like
/// its parent, so there's nothing to Save.
Future<void> showReadingExperienceSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: false,
    backgroundColor: Colors.transparent,
    builder: (_) => const _ReadingExperienceSheet(),
  );
}

class _ReadingExperienceSheet extends ConsumerWidget {
  const _ReadingExperienceSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final readMode = ref.watch(readModeProvider);
    final showBookmarkIcons = ref.watch(showBookmarkIconsProvider);
    final autoScrollSpeed = ref.watch(autoScrollSpeedProvider);
    final l10n = AppLocalizations.of(context)!;

    return DraggableScrollableSheet(
      initialChildSize: 0.45,
      minChildSize: 0.3,
      maxChildSize: 0.75,
      expand: false,
      builder: (context, scrollController) {
        return Material(
          color: colors.background,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          clipBehavior: Clip.antiAlias,
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 14),
                  decoration: BoxDecoration(
                    color: colors.textColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(l10n.settingsReadingExperience, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    tooltip: l10n.settingsClose,
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.settingsReadMode),
                subtitle: Text(l10n.settingsReadModeDesc),
                value: readMode,
                onChanged: (enabled) => ref.read(readModeProvider.notifier).setEnabled(enabled),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.settingsShowBookmarkIcons),
                value: showBookmarkIcons,
                onChanged: readMode
                    ? null
                    : (shown) => ref.read(showBookmarkIconsProvider.notifier).setShown(shown),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.settingsAutoScrollSpeed),
                subtitle: Slider(
                  value: autoScrollSpeed,
                  min: AutoScrollSpeedNotifier.min,
                  max: AutoScrollSpeedNotifier.max,
                  divisions: 11,
                  label: '${autoScrollSpeed.round()} px/s',
                  onChanged: (speed) => ref.read(autoScrollSpeedProvider.notifier).setSpeed(speed),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
