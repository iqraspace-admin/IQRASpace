import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/constants/dua_translation_language.dart';
import 'package:quran_flutter/core/constants/transliteration_script.dart';

/// A Qur'anic reference attached to a dua (`quran_refs` in the content
/// snapshot): [surah] and an inclusive ayah range.
class QuranRef {
  final int surah;
  final int ayahFrom;
  final int ayahTo;

  const QuranRef({required this.surah, required this.ayahFrom, required this.ayahTo});
}

/// One supplication (dua/dhikr) within a category. [slug] is the dua's
/// stable canonical identifier — the same dua can appear in several
/// categories (with per-category title/description/repeat overrides
/// already applied by the backend), so favorites key on it, not on a
/// category + position.
///
/// Every field other than [slug], [title] and [arabic] may be absent in
/// the content snapshot; the display helpers below ([transliterationFor],
/// [translationFor], [displayReference]) own the fallbacks.
class Dua {
  final String slug;
  final String title;
  final String? titleUrdu;
  final String arabic;
  final String transliterationLatin;
  final String? transliterationTelugu;
  final String? transliterationUrdu;
  final String translationEnglish;
  final String? translationUrdu;
  final String? description;
  final int? repeatCount;
  final String sourceType;
  final String? sourceCollection;
  final String reference;
  final String? hadithNumber;
  final String? hadithGrade;
  final List<QuranRef> quranRefs;
  final String? audioUrl;

  /// Position key within the category. For the original bundled duas this
  /// equals their legacy list index (new duas are >= 1000) — see
  /// favorite_resolver.dart's legacyDuaIndex.
  final int? sortOrder;

  const Dua({
    required this.slug,
    required this.title,
    required this.arabic,
    this.titleUrdu,
    this.transliterationLatin = '',
    this.transliterationTelugu,
    this.transliterationUrdu,
    this.translationEnglish = '',
    this.translationUrdu,
    this.description,
    this.repeatCount,
    this.sourceType = 'other',
    this.sourceCollection,
    this.reference = '',
    this.hadithNumber,
    this.hadithGrade,
    this.quranRefs = const [],
    this.audioUrl,
    this.sortOrder,
  });

  /// Back-compat names for [title]/[titleUrdu].
  String get occasion => title;
  String? get occasionUrdu => titleUrdu;

  /// The transliteration line for the app's currently-selected reading
  /// script — see [TransliterationScript]. A missing Urdu-script
  /// transliteration shows the Arabic text (what the legacy data did); a
  /// missing Telugu one falls back to Latin.
  String transliterationFor(TransliterationScript script) {
    switch (script) {
      case TransliterationScript.latin:
        return transliterationLatin;
      case TransliterationScript.telugu:
        final t = transliterationTelugu;
        return (t == null || t.isEmpty) ? transliterationLatin : t;
      case TransliterationScript.urdu:
        final t = transliterationUrdu;
        return (t == null || t.isEmpty) ? arabic : t;
    }
  }

  /// The title caption for the app's current language. Urdu uses
  /// [titleUrdu] when available, English otherwise (Telugu has no title
  /// data).
  String occasionFor(AppLanguage language) {
    if (language == AppLanguage.urdu && titleUrdu != null) return titleUrdu!;
    return title;
  }

  /// The translation for the reader's chosen translation language. Urdu
  /// without a stored Urdu translation falls back to English (see
  /// [urduTranslationMissing] so the UI can say so) — never to blank.
  String translationFor(DuaTranslationLanguage language) {
    if (usesUrduTranslation(language)) return translationUrdu!;
    return translationEnglish;
  }

  /// Whether [translationFor] would pick the Urdu (RTL) text.
  bool usesUrduTranslation(DuaTranslationLanguage language) =>
      language == DuaTranslationLanguage.urdu && (translationUrdu?.trim().isNotEmpty ?? false);

  /// Urdu was requested but this dua has no Urdu translation yet.
  bool urduTranslationMissing(DuaTranslationLanguage language) =>
      language == DuaTranslationLanguage.urdu && !usesUrduTranslation(language);

  /// The reference line: [reference] with the hadith number/grade
  /// appended when present. Empty when the dua has none of them.
  String get displayReference {
    final parts = <String>[
      if (reference.isNotEmpty) reference,
      if (hadithNumber != null) '#$hadithNumber',
      if (hadithGrade != null) hadithGrade![0].toUpperCase() + hadithGrade!.substring(1),
    ];
    return parts.join(' · ');
  }
}
