import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/reciters.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/theme/arabic_fonts.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final fontSize = ref.watch(fontSizeProvider);
    final showTranslation = ref.watch(showTranslationProvider);
    final showBookmarkIcons = ref.watch(showBookmarkIconsProvider);
    final readMode = ref.watch(readModeProvider);
    final arabicFontFamily = ref.watch(arabicFontFamilyProvider);
    final reciterEdition = ref.watch(reciterEditionProvider);
    final autoScrollSpeed = ref.watch(autoScrollSpeedProvider);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Text('Appearance', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          // RadioGroup (Flutter 3.32+) replaces each tile's own
          // groupValue/onChanged — one group manages all three.
          RadioGroup<ReaderThemeMode>(
            groupValue: themeMode,
            onChanged: (mode) => ref.read(readerThemeModeProvider.notifier).setMode(mode!),
            child: const Column(
              children: [
                RadioListTile<ReaderThemeMode>(
                  title: Text('Light'),
                  value: ReaderThemeMode.light,
                ),
                RadioListTile<ReaderThemeMode>(
                  title: Text('True Black Dark'),
                  value: ReaderThemeMode.trueBlackDark,
                ),
                RadioListTile<ReaderThemeMode>(
                  title: Text('Sepia'),
                  value: ReaderThemeMode.sepia,
                ),
              ],
            ),
          ),
          const Divider(),
          ListTile(
            title: const Text('Arabic text size'),
            subtitle: Slider(
              value: fontSize,
              min: FontSizeNotifier.min,
              max: FontSizeNotifier.max,
              divisions: ((FontSizeNotifier.max - FontSizeNotifier.min) / 2).round(),
              label: fontSize.round().toString(),
              onChanged: (size) => ref.read(fontSizeProvider.notifier).setSize(size),
            ),
          ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Text('Arabic font', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          RadioGroup<String>(
            groupValue: arabicFontFamily,
            onChanged: (family) => ref.read(arabicFontFamilyProvider.notifier).setFamily(family!),
            child: Column(
              children: [
                for (final option in arabicFontOptions)
                  RadioListTile<String>(
                    title: Text(option.displayName),
                    subtitle: option.caveat != null ? Text(option.caveat!) : null,
                    value: option.familyName,
                  ),
              ],
            ),
          ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Text('Reciter', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          RadioGroup<String>(
            groupValue: reciterEdition,
            onChanged: (id) => ref.read(reciterEditionProvider.notifier).setReciter(id!),
            child: Column(
              children: [
                for (final option in reciterOptions)
                  RadioListTile<String>(
                    title: Text(option.displayName),
                    value: option.identifier,
                  ),
              ],
            ),
          ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Text('Reading', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          SwitchListTile(
            title: const Text('Read Mode'),
            subtitle: const Text(
              'Hides bookmark, audio, and translation controls — Arabic text only.',
            ),
            value: readMode,
            onChanged: (enabled) => ref.read(readModeProvider.notifier).setEnabled(enabled),
          ),
          SwitchListTile(
            title: const Text('Show translation'),
            subtitle: const Text('English (Sahih International)'),
            value: showTranslation,
            secondary: readMode ? const Icon(Icons.info_outline) : null,
            onChanged:
                readMode ? null : (shown) => ref.read(showTranslationProvider.notifier).setShown(shown),
          ),
          SwitchListTile(
            title: const Text('Show bookmark icons'),
            value: showBookmarkIcons,
            onChanged: readMode
                ? null
                : (shown) => ref.read(showBookmarkIconsProvider.notifier).setShown(shown),
          ),
          ListTile(
            title: const Text('Auto-scroll speed'),
            subtitle: Slider(
              value: autoScrollSpeed,
              min: AutoScrollSpeedNotifier.min,
              max: AutoScrollSpeedNotifier.max,
              divisions: 11,
              label: '${autoScrollSpeed.round()} px/s',
              onChanged: (speed) => ref.read(autoScrollSpeedProvider.notifier).setSpeed(speed),
            ),
          ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Text('About', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          const ListTile(
            title: Text('Data sources'),
            subtitle: Text(
              'Text, Tajweed, translation, and audio: Al Quran Cloud '
              '(alquran.cloud). Translation: Sahih International. Fonts: '
              'the Amiri family (SIL OFL 1.1).',
            ),
          ),
        ],
      ),
    );
  }
}
