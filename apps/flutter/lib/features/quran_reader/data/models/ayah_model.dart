import 'package:quran_flutter/core/utils/tajweed_parser.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/ayah.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/tajweed_span.dart';

/// Data-layer representation of an ayah, with JSON (de)serialization for
/// both the Al Quran Cloud API response shape and this app's own Hive
/// cache format.
///
/// No Hive TypeAdapter/codegen is used in this first pass — the local
/// datasource stores a plain JSON string in a `Box<String>`, so this
/// class only needs ordinary fromJson/toJson methods.
class AyahModel extends Ayah {
  const AyahModel({
    required super.numberInSurah,
    required super.plainText,
    required super.tajweedSpans,
    super.translationText,
    super.audioUrl,
  });

  /// Builds from one ayah of the combined
  /// `/v1/surah/{n}/editions/quran-tajweed,en.sahih,ar.alafasy` response.
  /// [tajweedJson] carries the `[code[text]` bracket markup;
  /// [translationJson] and [audioJson] are the same ayah from the other
  /// two editions in that call, matched by array index (all three
  /// editions return ayahs in the same order) — see
  /// SurahRemoteDataSource.fetchSurah for how these are zipped together.
  factory AyahModel.fromApiJson({
    required Map<String, dynamic> tajweedJson,
    Map<String, dynamic>? translationJson,
    Map<String, dynamic>? audioJson,
  }) {
    final spans = TajweedParser.parse(tajweedJson['text'] as String);
    return AyahModel(
      numberInSurah: tajweedJson['numberInSurah'] as int,
      plainText: spans.map((s) => s.text).join(),
      tajweedSpans: spans,
      translationText: translationJson?['text'] as String?,
      audioUrl: audioJson?['audio'] as String?,
    );
  }

  /// Round-trips through this app's own cache format (already-parsed
  /// spans, so a cache hit never re-parses Tajweed markup).
  factory AyahModel.fromCacheJson(Map<String, dynamic> json) => AyahModel(
        numberInSurah: json['numberInSurah'] as int,
        plainText: json['plainText'] as String,
        tajweedSpans: (json['tajweedSpans'] as List)
            .map((s) => TajweedSpan.fromJson(s as Map<String, dynamic>))
            .toList(),
        translationText: json['translationText'] as String?,
        audioUrl: json['audioUrl'] as String?,
      );

  Map<String, dynamic> toCacheJson() => {
        'numberInSurah': numberInSurah,
        'plainText': plainText,
        'tajweedSpans': tajweedSpans.map((s) => s.toJson()).toList(),
        'translationText': translationText,
        'audioUrl': audioUrl,
      };
}
