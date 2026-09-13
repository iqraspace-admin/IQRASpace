import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/constants/reader_mode.dart';
import 'package:quran_flutter/core/constants/reciters.dart';
import 'package:quran_flutter/core/constants/translation_languages.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/theme/arabic_fonts.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/screens/tajweed_rules_screen.dart';
import 'package:quran_flutter/features/settings/presentation/screens/about_screen.dart';
import 'package:quran_flutter/features/settings/presentation/screens/user_guide_screen.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Reader Settings, as a bottom sheet rather than a full page — per the
/// approved design, this stays out of the way and closes once the
/// reader is done adjusting it, instead of permanently occupying the
/// reading screen. Every control applies live (Riverpod), so there's
/// nothing to "save" — Close/Done and swipe-down both just dismiss it.
Future<void> showReaderSettingsSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: false,
    backgroundColor: Colors.transparent,
    builder: (_) => const _ReaderSettingsSheet(),
  );
}

class _ReaderSettingsSheet extends ConsumerWidget {
  const _ReaderSettingsSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final fontSize = ref.watch(fontSizeProvider);
    final translationLanguage = ref.watch(translationLanguageProvider);
    final tajweedEnabled = ref.watch(tajweedEnabledProvider);
    final showBookmarkIcons = ref.watch(showBookmarkIconsProvider);
    final readMode = ref.watch(readModeProvider);
    final arabicFontFamily = ref.watch(arabicFontFamilyProvider);
    final reciterEdition = ref.watch(reciterEditionProvider);
    final autoScrollSpeed = ref.watch(autoScrollSpeedProvider);
    final appLanguage = ref.watch(appLanguageProvider);
    final listeningTrack = ref.watch(listeningTrackProvider);
    final l10n = AppLocalizations.of(context)!;

    return DraggableScrollableSheet(
      initialChildSize: 0.72,
      minChildSize: 0.4,
      maxChildSize: 0.94,
      expand: false,
      builder: (context, scrollController) {
        // A Material widget, not a plain Container+BoxDecoration — the
        // ListTile/RadioListTile/SwitchListTile rows below paint their
        // ink/selection effects on the nearest Material ancestor, and a
        // DecoratedBox in between (an earlier version of this) hides
        // that painting entirely (Flutter's own debug assertion catches
        // this: "ListTile background color or ink splashes may be
        // invisible"). Material paints the background color and clips
        // the rounded top corners just as well, so nothing else changes.
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
                  Text(l10n.settingsReadingSettings, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    tooltip: l10n.settingsClose,
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              _SectionLabel(l10n.settingsTheme),
              RadioGroup<ReaderThemeMode>(
                groupValue: themeMode,
                onChanged: (mode) => ref.read(readerThemeModeProvider.notifier).setMode(mode!),
                child: Row(
                  children: [
                    Expanded(child: RadioListTile<ReaderThemeMode>(title: Text(l10n.settingsLight), value: ReaderThemeMode.light)),
                    Expanded(
                      child: RadioListTile<ReaderThemeMode>(title: Text(l10n.settingsDark), value: ReaderThemeMode.trueBlackDark),
                    ),
                    Expanded(child: RadioListTile<ReaderThemeMode>(title: Text(l10n.settingsSepia), value: ReaderThemeMode.sepia)),
                  ],
                ),
              ),
              const Divider(),
              _SectionLabel(l10n.settingsLanguage),
              RadioGroup<AppLanguage>(
                groupValue: appLanguage,
                onChanged: (language) => ref.read(appLanguageProvider.notifier).setLanguage(language!),
                child: Column(
                  children: [
                    for (final option in appLanguageOptions)
                      RadioListTile<AppLanguage>(
                        title: Text(option.nativeName(l10n)),
                        value: option.language,
                      ),
                  ],
                ),
              ),
              const Divider(),
              _SectionLabel(l10n.settingsArabicFont),
              RadioGroup<String>(
                groupValue: arabicFontFamily,
                onChanged: (family) => ref.read(arabicFontFamilyProvider.notifier).setFamily(family!),
                child: Column(
                  children: [
                    for (final option in arabicFontOptions(l10n))
                      RadioListTile<String>(
                        title: Text(option.displayName),
                        subtitle: option.caveat != null ? Text(option.caveat!) : null,
                        value: option.familyName,
                      ),
                  ],
                ),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.settingsArabicTextSize),
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
              _SectionLabel(l10n.settingsTranslation),
              RadioGroup<TranslationLanguage>(
                groupValue: translationLanguage,
                onChanged: (language) =>
                    ref.read(translationLanguageProvider.notifier).setLanguage(language!),
                child: Column(
                  children: [
                    for (final option in translationLanguageOptions(l10n))
                      RadioListTile<TranslationLanguage>(
                        title: Text(option.displayName),
                        value: option.language,
                      ),
                  ],
                ),
              ),
              const Divider(),
              _SectionLabel(l10n.settingsTajweed),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.settingsTajweedColoring),
                subtitle: Text(l10n.settingsTajweedColoringDesc),
                value: tajweedEnabled,
                onChanged: (enabled) => ref.read(tajweedEnabledProvider.notifier).setEnabled(enabled),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.palette_outlined),
                title: Text(l10n.settingsTajweedRules),
                subtitle: Text(l10n.settingsTajweedRulesDesc),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const TajweedRulesScreen()),
                ),
              ),
              const Divider(),
              _SectionLabel(l10n.settingsReciter),
              RadioGroup<String>(
                groupValue: reciterEdition,
                onChanged: (id) => ref.read(reciterEditionProvider.notifier).setReciter(id!),
                child: Column(
                  children: [
                    for (final option in reciterOptions)
                      RadioListTile<String>(title: Text(option.displayName), value: option.identifier),
                  ],
                ),
              ),
              const Divider(),
              _SectionLabel(l10n.modeListening),
              RadioGroup<ListeningTrack>(
                groupValue: listeningTrack,
                onChanged: (track) => ref.read(listeningTrackProvider.notifier).setTrack(track!),
                child: Column(
                  children: [
                    RadioListTile<ListeningTrack>(
                      title: Text(l10n.listeningTrackArabicOnly),
                      value: ListeningTrack.arabicOnly,
                    ),
                    RadioListTile<ListeningTrack>(
                      title: Text(l10n.listeningTrackArabicPlusUrdu),
                      value: ListeningTrack.arabicPlusUrdu,
                    ),
                  ],
                ),
              ),
              const Divider(),
              _SectionLabel(l10n.settingsReading),
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
              const Divider(),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.help_outline),
                title: Text(l10n.settingsUserGuide),
                subtitle: Text(l10n.settingsUserGuideDesc),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const UserGuideScreen()),
                ),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.info_outline),
                title: Text(l10n.settingsAboutIqraSpace),
                subtitle: Text(l10n.settingsAboutIqraSpaceDesc),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const AboutScreen()),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  l10n.settingsAttribution,
                  style: const TextStyle(fontSize: 12),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text(l10n.commonDone),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;

  const _SectionLabel(this.label);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 14, 0, 4),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
    );
  }
}
