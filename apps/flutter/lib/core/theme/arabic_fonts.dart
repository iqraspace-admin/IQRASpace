import 'package:quran_flutter/l10n/app_localizations.dart';

/// One selectable Arabic font for the ayah text. [familyName] must match
/// a `family:` entry in pubspec.yaml's `flutter.fonts` list.
class ArabicFontOption {
  final String familyName;
  final String displayName;
  final String? caveat;

  const ArabicFontOption({required this.familyName, required this.displayName, this.caveat});
}

/// Built from [l10n] (not a top-level `const` list) so the labels follow
/// the app's UI language — this is menu chrome, never the Quran text
/// itself, which always renders in the selected [familyName] regardless.
List<ArabicFontOption> arabicFontOptions(AppLocalizations l10n) => [
      ArabicFontOption(familyName: 'AmiriQuran', displayName: l10n.arabicFontAmiriQuran),
      ArabicFontOption(familyName: 'Amiri', displayName: l10n.arabicFontAmiri),
      ArabicFontOption(
        familyName: 'AmiriQuranColored',
        displayName: l10n.arabicFontAmiriQuranColored,
        caveat: l10n.arabicFontColoredCaveat,
      ),
    ];

const defaultArabicFontFamily = 'AmiriQuran';
