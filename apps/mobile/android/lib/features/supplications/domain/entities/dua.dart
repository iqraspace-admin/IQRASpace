import 'package:quran_flutter/core/constants/transliteration_script.dart';

/// One supplication (dua/dhikr) within a category. [transliterationUrdu]
/// is Arabic-script text, not Roman/Latin Urdu — see
/// SupplicationsMeta.sourcesNote.
class Dua {
  final String occasion;
  final String reference;
  final String arabic;
  final String transliterationLatin;
  final String transliterationTelugu;
  final String transliterationUrdu;
  final String translationEnglish;

  const Dua({
    required this.occasion,
    required this.reference,
    required this.arabic,
    required this.transliterationLatin,
    required this.transliterationTelugu,
    required this.transliterationUrdu,
    required this.translationEnglish,
  });

  /// The transliteration line for the app's currently-selected reading
  /// script — see [TransliterationScript].
  String transliterationFor(TransliterationScript script) {
    switch (script) {
      case TransliterationScript.latin:
        return transliterationLatin;
      case TransliterationScript.telugu:
        return transliterationTelugu;
      case TransliterationScript.urdu:
        return transliterationUrdu;
    }
  }
}
