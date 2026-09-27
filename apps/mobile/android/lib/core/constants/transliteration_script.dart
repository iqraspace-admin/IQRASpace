import 'package:flutter/material.dart' show TextDirection;
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Which reading script the Supplications feature renders each dua's
/// transliteration line in — Latin, Telugu, or (Arabic-script) Urdu. A
/// single app-wide choice, not per-card: the point of this switch is
/// reading every dua comfortably in one script, not mixing scripts card
/// to card. See SupplicationScriptNotifier for persistence.
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

/// Display metadata for the Supplications feature's script switch.
class TransliterationScriptOption {
  final TransliterationScript script;
  final String displayName;

  const TransliterationScriptOption({required this.script, required this.displayName});
}

/// Built from [l10n] (not a top-level `const` list) so the labels follow
/// the app's UI language — this is menu chrome, unrelated to which
/// script the dua text itself renders in.
List<TransliterationScriptOption> transliterationScriptOptions(AppLocalizations l10n) => [
      TransliterationScriptOption(script: TransliterationScript.latin, displayName: l10n.scriptLatin),
      TransliterationScriptOption(script: TransliterationScript.telugu, displayName: l10n.scriptTelugu),
      TransliterationScriptOption(script: TransliterationScript.urdu, displayName: l10n.scriptUrdu),
    ];

const defaultTransliterationScript = TransliterationScript.latin;
