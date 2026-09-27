import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/constants/reciters.dart';
import 'package:quran_flutter/core/constants/translation_languages.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/theme/arabic_fonts.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/screens/tajweed_rules_screen.dart';
import 'package:quran_flutter/features/settings/presentation/screens/about_screen.dart';
import 'package:quran_flutter/features/settings/presentation/screens/user_guide_screen.dart';
import 'package:quran_flutter/features/settings/presentation/widgets/arabic_font_picker_sheet.dart';
import 'package:quran_flutter/features/settings/presentation/widgets/audio_settings_sheet.dart';
import 'package:quran_flutter/features/settings/presentation/widgets/language_picker_sheet.dart';
import 'package:quran_flutter/features/settings/presentation/widgets/reading_experience_sheet.dart';
import 'package:quran_flutter/features/settings/presentation/widgets/translation_picker_sheet.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Reader Settings, as a bottom sheet rather than a full page — per the
/// approved design, this stays out of the way and closes once the
/// reader is done adjusting it, instead of permanently occupying the
/// reading screen. Every control applies live (Riverpod), so there's
/// nothing to "save" — Close/Done and swipe-down both just dismiss it.
///
/// Kept to essential, high-frequency controls only: detailed pickers
/// (Arabic Font, App Language, Translation, Reciter/Listening Track,
/// Reading Experience) live in their own popup sheets — see
/// arabic_font_picker_sheet.dart, language_picker_sheet.dart,
/// translation_picker_sheet.dart, audio_settings_sheet.dart and
/// reading_experience_sheet.dart — reached from a nav-row summarizing
/// the current choice, the same "drill down from a short list" pattern
/// the web app's ReaderSettingsPanel.tsx uses.
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
    final brand = IqraSpaceBrand.teal(themeMode);
    final fontSize = ref.watch(fontSizeProvider);
    final tajweedEnabled = ref.watch(tajweedEnabledProvider);
    final arabicFontFamily = ref.watch(arabicFontFamilyProvider);
    final reciterEdition = ref.watch(reciterEditionProvider);
    final appLanguage = ref.watch(appLanguageProvider);
    final translationLanguage = ref.watch(translationLanguageProvider);
    final l10n = AppLocalizations.of(context)!;

    final fontLabel = arabicFontOptions(l10n).firstWhere((o) => o.familyName == arabicFontFamily).displayName;
    final languageLabel = appLanguageOptions.firstWhere((o) => o.language == appLanguage).nativeName(l10n);
    final translationLabel =
        translationLanguageOptions(l10n).firstWhere((o) => o.language == translationLanguage).displayName;
    final reciterLabel = reciterOptions.firstWhere((o) => o.identifier == reciterEdition).displayName;

    return DraggableScrollableSheet(
      initialChildSize: 0.62,
      minChildSize: 0.4,
      maxChildSize: 0.92,
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
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: SizedBox(
                  width: double.infinity,
                  child: SegmentedButton<ReaderThemeMode>(
                    showSelectedIcon: false,
                    style: SegmentedButton.styleFrom(
                      selectedBackgroundColor: brand,
                      selectedForegroundColor: Colors.white,
                    ),
                    segments: [
                      ButtonSegment(
                        value: ReaderThemeMode.light,
                        icon: const Icon(Icons.wb_sunny_outlined, size: 16),
                        label: Text(l10n.settingsLight, maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                      ButtonSegment(
                        value: ReaderThemeMode.trueBlackDark,
                        icon: const Icon(Icons.dark_mode_outlined, size: 16),
                        label: Text(l10n.settingsDark, maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                      ButtonSegment(
                        value: ReaderThemeMode.sepia,
                        icon: const Icon(Icons.auto_stories_outlined, size: 16),
                        label: Text(l10n.settingsSepia, maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                    ],
                    selected: {themeMode},
                    onSelectionChanged: (selection) =>
                        ref.read(readerThemeModeProvider.notifier).setMode(selection.first),
                  ),
                ),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.settingsArabicFont),
                trailing: _TrailingValue(fontLabel),
                onTap: () => showArabicFontPickerSheet(context),
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
              _SectionLabel(l10n.settingsLanguage),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.settingsLanguage),
                trailing: _TrailingValue(languageLabel),
                onTap: () => showLanguagePickerSheet(context),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.settingsTranslation),
                trailing: _TrailingValue(translationLabel),
                onTap: () => showTranslationPickerSheet(context),
              ),

              const Divider(),
              _SectionLabel(l10n.settingsAudioRecitation),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.settingsReciter),
                trailing: _TrailingValue(reciterLabel),
                onTap: () => showAudioSettingsSheet(context),
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
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const TajweedRulesScreen()),
                ),
              ),

              const Divider(),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.tune),
                title: Text(l10n.settingsReadingExperience),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => showReadingExperienceSheet(context),
              ),

              const Divider(),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.help_outline),
                title: Text(l10n.settingsUserGuide),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const UserGuideScreen()),
                ),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.info_outline),
                title: Text(l10n.settingsAboutIqraSpace),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const AboutScreen()),
                ),
              ),

              const SizedBox(height: 12),
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

/// A nav row's current-value summary + chevron, matching the web app's
/// own `navRowValueStyle` pattern (ReaderSettingsPanel.tsx) so a reader
/// can see the current choice without opening the picker.
class _TrailingValue extends StatelessWidget {
  final String value;

  const _TrailingValue(this.value);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 120),
          child: Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: Theme.of(context).hintColor, fontSize: 13),
          ),
        ),
        const Icon(Icons.chevron_right),
      ],
    );
  }
}
