import 'package:quran_flutter/core/constants/translation_languages.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/tajweed_span.dart';

/// One ayah, pre-parsed into Tajweed spans. Parsing happens once at fetch
/// time (see TajweedParser) — nothing in the presentation layer re-parses
/// tagged text on every rebuild.
///
/// Two translations are fetched alongside the Tajweed edition: English
/// (Sahih International, via Al Quran Cloud) and Roman Urdu (Abul Ala
/// Maududi, via the Quran.com v4 API — see SurahRemoteDataSource for why
/// two different hosts). Either can be null if that part of a response
/// was ever missing.
class Ayah {
  final int numberInSurah;
  final String plainText;
  final List<TajweedSpan> tajweedSpans;
  final String? translationTextEn;
  final String? translationTextRomanUrdu;
  final String? audioUrl;

  const Ayah({
    required this.numberInSurah,
    required this.plainText,
    required this.tajweedSpans,
    this.translationTextEn,
    this.translationTextRomanUrdu,
    this.audioUrl,
  });

  /// The translation text for [language], or null if that language has
  /// none (missing from the response) or [language] is [TranslationLanguage.off].
  String? translationFor(TranslationLanguage language) {
    switch (language) {
      case TranslationLanguage.off:
        return null;
      case TranslationLanguage.english:
        return translationTextEn;
      case TranslationLanguage.romanUrdu:
        return translationTextRomanUrdu;
    }
  }
}
