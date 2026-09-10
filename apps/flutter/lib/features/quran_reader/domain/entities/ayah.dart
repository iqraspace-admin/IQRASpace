import 'package:quran_flutter/features/quran_reader/domain/entities/tajweed_span.dart';

/// One ayah, pre-parsed into Tajweed spans. Parsing happens once at fetch
/// time (see TajweedParser) — nothing in the presentation layer re-parses
/// tagged text on every rebuild.
///
/// [translationText] and [audioUrl] are optional: the app also fetches
/// an English translation edition (en.sahih) and a recitation-audio
/// edition (ar.alafasy) alongside the Tajweed edition in one combined
/// API call (see SurahRemoteDataSource) — both are null only if that
/// part of the response was ever missing, which the live API hasn't
/// shown so far.
class Ayah {
  final int numberInSurah;
  final String plainText;
  final List<TajweedSpan> tajweedSpans;
  final String? translationText;
  final String? audioUrl;

  const Ayah({
    required this.numberInSurah,
    required this.plainText,
    required this.tajweedSpans,
    this.translationText,
    this.audioUrl,
  });
}
