import 'dart:ui';

import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// The app's UI language — drives [AppLocalizations] + [MaterialApp.locale]
/// (see main.dart) and, for [urdu], RTL layout. This is entirely separate
/// from [TranslationLanguage] (core/constants/translation_languages.dart),
/// which only controls the ayah-translation line under the Arabic text —
/// changing this never touches Quran text, translations, or audio.
enum AppLanguage { english, telugu, urdu }

extension AppLanguageX on AppLanguage {
  Locale get locale {
    switch (this) {
      case AppLanguage.english:
        return const Locale('en');
      case AppLanguage.telugu:
        return const Locale('te');
      case AppLanguage.urdu:
        return const Locale('ur');
    }
  }

  /// UI chrome direction for this language. Urdu is the only
  /// right-to-left one of the three — this never affects Quran Arabic
  /// (always RTL) or translation text (always LTR), which set their own
  /// explicit `textDirection` regardless of app locale (see
  /// ayah_rich_text.dart).
  TextDirection get textDirection =>
      this == AppLanguage.urdu ? TextDirection.rtl : TextDirection.ltr;
}

/// Display metadata for the Settings sheet's Language picker.
class AppLanguageOption {
  final AppLanguage language;
  final String Function(AppLocalizations l10n) nativeName;

  const AppLanguageOption({required this.language, required this.nativeName});
}

final appLanguageOptions = [
  AppLanguageOption(language: AppLanguage.english, nativeName: (l10n) => l10n.languageEnglish),
  AppLanguageOption(language: AppLanguage.telugu, nativeName: (l10n) => l10n.languageTelugu),
  AppLanguageOption(language: AppLanguage.urdu, nativeName: (l10n) => l10n.languageUrdu),
];

const defaultAppLanguage = AppLanguage.english;

/// Reads the persisted language choice directly from Hive — for code
/// that runs outside the Riverpod widget tree (e.g.
/// `lib/core/audio/iqra_audio_handler.dart`'s background audio handler,
/// which needs a Surah's transliterated name for the lock-screen/
/// notification `MediaItem` title but isn't itself a `ConsumerWidget`).
/// Prefer `appLanguageProvider` everywhere else — this is the one-off
/// escape hatch, not a replacement for it.
AppLanguage currentAppLanguageFromHive() {
  const key = 'appLanguage';
  final stored = HiveBoxes.settingsBox.get(key) as String?;
  if (stored != null) {
    return AppLanguage.values.firstWhere((l) => l.name == stored, orElse: () => defaultAppLanguage);
  }
  return appLanguageForLocale(PlatformDispatcher.instance.locale) ?? defaultAppLanguage;
}

/// Maps a device locale to one of the three supported UI languages, or
/// `null` if unsupported — used only to pick a first-run default (see
/// AppLanguageNotifier); a stored choice always wins afterwards.
AppLanguage? appLanguageForLocale(Locale locale) {
  switch (locale.languageCode) {
    case 'te':
      return AppLanguage.telugu;
    case 'ur':
      return AppLanguage.urdu;
    case 'en':
      return AppLanguage.english;
    default:
      return null;
  }
}
