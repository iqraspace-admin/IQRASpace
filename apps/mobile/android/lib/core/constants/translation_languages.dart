import 'package:quran_flutter/l10n/app_localizations.dart';

/// Which translation (if any) shows below each ayah's Arabic text.
/// [off] hides the translation line entirely — the reader's default, so
/// a fresh install shows Arabic-only until a reader opts in via Reader
/// Settings.
enum TranslationLanguage { off, english, romanUrdu }

/// Display metadata for the Reader Settings sheet's Translation picker.
class TranslationLanguageOption {
  final TranslationLanguage language;
  final String displayName;

  const TranslationLanguageOption({required this.language, required this.displayName});
}

/// Built from [l10n] (not a top-level `const` list) so the labels follow
/// the app's UI language — this is menu chrome, unrelated to the Quran
/// translation text itself.
List<TranslationLanguageOption> translationLanguageOptions(AppLocalizations l10n) => [
      TranslationLanguageOption(language: TranslationLanguage.off, displayName: l10n.translationLangOff),
      TranslationLanguageOption(
        language: TranslationLanguage.english,
        displayName: l10n.translationLangEnglish,
      ),
      TranslationLanguageOption(
        language: TranslationLanguage.romanUrdu,
        displayName: l10n.translationLangRomanUrdu,
      ),
    ];

const defaultTranslationLanguage = TranslationLanguage.off;
