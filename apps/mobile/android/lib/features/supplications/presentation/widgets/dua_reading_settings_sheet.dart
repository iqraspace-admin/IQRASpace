import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/constants/dua_translation_language.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/settings/presentation/widgets/language_picker_sheet.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// The Duas reading screen's settings sheet — opened from its `tune`
/// AppBar action. Structurally mirrors
/// features/settings/presentation/widgets/reader_settings_sheet.dart
/// (DraggableScrollableSheet, section labels, a Done button) so Duas
/// gets an in-context settings surface consistent with the rest of the
/// app, rather than a one-off design.
///
/// No separate transliteration-script switch here anymore — the script
/// always follows the app's own language setting (see
/// dua_reading_screen.dart's _scriptForAppLanguage), so this just shows
/// the current language with a shortcut to the real picker, plus the
/// tasbeeh-counter on/off toggle.
Future<void> showDuaReadingSettingsSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: false,
    backgroundColor: Colors.transparent,
    builder: (_) => const _DuaReadingSettingsSheet(),
  );
}

class _DuaReadingSettingsSheet extends ConsumerWidget {
  const _DuaReadingSettingsSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final tasbeehEnabled = ref.watch(duaTasbeehEnabledProvider);
    final appLanguage = ref.watch(appLanguageProvider);
    final translationLanguage = ref.watch(duaTranslationLanguageProvider);
    final transliterationEnabled = ref.watch(duaTransliterationEnabledProvider);
    final l10n = AppLocalizations.of(context)!;
    final languageLabel =
        appLanguageOptions.firstWhere((o) => o.language == appLanguage).nativeName(l10n);

    return DraggableScrollableSheet(
      initialChildSize: 0.5,
      minChildSize: 0.3,
      maxChildSize: 0.85,
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
                  Text(
                    l10n.supplicationsReadingSettingsTitle,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    tooltip: l10n.settingsClose,
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              _SectionLabel(l10n.supplicationsTranslationLabel),
              SizedBox(
                width: double.infinity,
                child: SegmentedButton<DuaTranslationLanguage>(
                  showSelectedIcon: false,
                  segments: [
                    ButtonSegment(
                      value: DuaTranslationLanguage.english,
                      label: Text(l10n.supplicationsTranslationEnglish),
                    ),
                    ButtonSegment(
                      value: DuaTranslationLanguage.urdu,
                      label: Text(l10n.supplicationsTranslationUrdu),
                    ),
                  ],
                  selected: {translationLanguage},
                  onSelectionChanged: (s) =>
                      ref.read(duaTranslationLanguageProvider.notifier).setLanguage(s.first),
                ),
              ),
              const Divider(),
              _SectionLabel(l10n.supplicationsTransliterationLabel),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.supplicationsTransliterationLabel),
                subtitle: Text(l10n.supplicationsTransliterationToggleDesc),
                value: transliterationEnabled,
                onChanged: (enabled) =>
                    ref.read(duaTransliterationEnabledProvider.notifier).setEnabled(enabled),
              ),
              _SectionLabel(l10n.supplicationsTransliterationScriptLabel),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.settingsLanguage),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(languageLabel, style: TextStyle(color: Theme.of(context).hintColor, fontSize: 13)),
                    const Icon(Icons.chevron_right),
                  ],
                ),
                onTap: () => showLanguagePickerSheet(context),
              ),
              const Divider(),
              _SectionLabel(l10n.supplicationsTasbeehCounterLabel),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.supplicationsTasbeehCounterLabel),
                subtitle: Text(l10n.supplicationsTasbeehCounterDesc),
                value: tasbeehEnabled,
                onChanged: (enabled) => ref.read(duaTasbeehEnabledProvider.notifier).setEnabled(enabled),
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
