/// One selectable Arabic font for the ayah text. [familyName] must match
/// a `family:` entry in pubspec.yaml's `flutter.fonts` list.
class ArabicFontOption {
  final String familyName;
  final String displayName;
  final String? caveat;

  const ArabicFontOption({required this.familyName, required this.displayName, this.caveat});
}

const arabicFontOptions = [
  ArabicFontOption(familyName: 'AmiriQuran', displayName: 'Amiri Quran (Uthmani)'),
  ArabicFontOption(familyName: 'Amiri', displayName: 'Amiri (general-purpose)'),
  ArabicFontOption(
    familyName: 'AmiriQuranColored',
    displayName: 'Amiri Quran Colored',
    caveat: 'Has its own built-in colors — this app\'s Tajweed coloring '
        'won\'t be visible on top of it.',
  ),
];

const defaultArabicFontFamily = 'AmiriQuran';
