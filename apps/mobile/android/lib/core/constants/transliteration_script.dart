import 'package:flutter/material.dart' show TextDirection;

/// Which script a Duas transliteration line renders in — Latin, Telugu,
/// or (Arabic-script) Urdu. Derived from the app's own language setting
/// ([AppLanguage] via dua_reading_screen.dart's _scriptForAppLanguage),
/// not a separate Duas-only choice.
enum TransliterationScript { latin, telugu, urdu }

extension TransliterationScriptX on TransliterationScript {
  /// [urdu] reuses the Arabic script (RTL, same as the "arabic" field
  /// itself — see the JSON's sources_note); [latin]/[telugu] are LTR.
  TextDirection get textDirection =>
      this == TransliterationScript.urdu ? TextDirection.rtl : TextDirection.ltr;

  /// Font family for this script's transliteration text — must match a
  /// `family:` entry in pubspec.yaml's `flutter.fonts` list. `null` for
  /// [latin] deliberately falls back to the default UI font: plain Latin
  /// text needs no embedded font the way Telugu/Urdu-script text does.
  String? get fontFamily {
    switch (this) {
      case TransliterationScript.latin:
        return null;
      case TransliterationScript.telugu:
        return 'NotoSansTelugu';
      case TransliterationScript.urdu:
        return 'NotoNastaliqUrdu';
    }
  }
}
