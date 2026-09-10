import 'package:dio/dio.dart';
import 'package:quran_flutter/features/quran_reader/data/models/ayah_model.dart';
import 'package:quran_flutter/features/quran_reader/data/models/surah_summary_model.dart';

/// English translation edition. Sahih International is a commonly used,
/// freely licensed translation available on Al Quran Cloud.
const _translationEdition = 'en.sahih';

/// Hits Al Quran Cloud's public API — no auth required.
class SurahRemoteDataSource {
  final Dio _dio;

  SurahRemoteDataSource(this._dio);

  /// Fetches one surah's ayahs with Tajweed markup, English translation,
  /// and per-ayah audio URLs for [reciterEdition] in a single combined-
  /// editions call. The three editions' ayah arrays are returned in the
  /// same per-ayah order, so they're zipped together by index (not by
  /// any shared id field — the API doesn't provide one that lines up
  /// across editions).
  Future<List<AyahModel>> fetchSurah(int surahNumber, {required String reciterEdition}) async {
    final response = await _dio.get(
      '/surah/$surahNumber/editions/quran-tajweed,$_translationEdition,$reciterEdition',
    );
    final editions = response.data['data'] as List;

    List<dynamic> ayahsFor(String identifier) {
      final edition = editions.firstWhere(
        (e) => e['edition']['identifier'] == identifier,
      );
      return edition['ayahs'] as List;
    }

    final tajweedAyahs = ayahsFor('quran-tajweed');
    final translationAyahs = ayahsFor(_translationEdition);
    final audioAyahs = ayahsFor(reciterEdition);

    return List.generate(tajweedAyahs.length, (i) {
      return AyahModel.fromApiJson(
        tajweedJson: tajweedAyahs[i] as Map<String, dynamic>,
        translationJson: i < translationAyahs.length
            ? translationAyahs[i] as Map<String, dynamic>
            : null,
        audioJson: i < audioAyahs.length ? audioAyahs[i] as Map<String, dynamic> : null,
      );
    });
  }

  /// Fetches the 114-surah metadata list for the navigation screen.
  Future<List<SurahSummaryModel>> fetchSurahList() async {
    final response = await _dio.get('/surah');
    final list = response.data['data'] as List;
    return list
        .map((json) => SurahSummaryModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}
