import 'package:dio/dio.dart';
import 'package:quran_flutter/features/quran_reader/data/models/ayah_model.dart';
import 'package:quran_flutter/features/quran_reader/data/models/surah_summary_model.dart';

/// English translation edition. Sahih International is a commonly used,
/// freely licensed translation available on Al Quran Cloud.
const _translationEdition = 'en.sahih';

/// Quran.com v4's resource id for "Abul Ala Maududi (Roman Urdu)" — see
/// dio_client.dart's buildQuranComDioClient for why this comes from a
/// second host instead of Al Quran Cloud.
const _romanUrduResourceId = 831;

/// Hits Al Quran Cloud's public API — no auth required — for Arabic
/// text/Tajweed, English translation, and reciter audio; and Quran.com's
/// public v4 API — also no auth required — for the Roman Urdu
/// translation.
class SurahRemoteDataSource {
  final Dio _dio;
  final Dio _quranComDio;

  SurahRemoteDataSource(this._dio, this._quranComDio);

  /// Fetches one surah's ayahs with Tajweed markup, English translation,
  /// Roman Urdu translation, and per-ayah audio URLs for [reciterEdition].
  /// The Tajweed/English/audio editions come back from one combined-
  /// editions Al Quran Cloud call; Roman Urdu comes from a separate
  /// Quran.com call. All are keyed by the same per-ayah array order (not
  /// any shared id field — neither API provides one that lines up across
  /// sources), so they're zipped together by index.
  Future<List<AyahModel>> fetchSurah(int surahNumber, {required String reciterEdition}) async {
    // Run the essential Al Quran Cloud call and the supplementary Roman
    // Urdu call CONCURRENTLY, not sequentially — awaiting them one after
    // the other used to add the second host's full round-trip (and, on
    // a network that can't reach it at all, its whole timeout) on top of
    // every single surah load, which read exactly like "the Quran Reader
    // has a connection error" even though the essential content was
    // ready long before.
    final results = await Future.wait([
      _dio.get('/surah/$surahNumber/editions/quran-tajweed,$_translationEdition,$reciterEdition'),
      _fetchRomanUrdu(surahNumber),
    ]);
    final response = results[0] as Response;
    final romanUrduAyahs = results[1] as List<dynamic>;
    final editions = response.data['data'] as List;

    List<dynamic> ayahsFor(String identifier) {
      // `orElse: () => null` rather than letting firstWhere throw: Al
      // Quran Cloud occasionally has data gaps for one edition on one
      // surah (e.g. a reciter missing audio for an obscure surah) —
      // treating that as "this facet has no data" degrades gracefully
      // (no audio icon / no translation line for this surah) instead of
      // crashing the entire surah load over one missing edition. Only
      // the Tajweed edition (the Arabic text itself) is load-bearing;
      // its absence still surfaces as a real error below.
      final edition = editions.firstWhere(
        (e) => e['edition']['identifier'] == identifier,
        orElse: () => null,
      );
      return (edition?['ayahs'] as List?) ?? const [];
    }

    final tajweedAyahs = ayahsFor('quran-tajweed');
    if (tajweedAyahs.isEmpty) {
      throw StateError('Al Quran Cloud response for surah $surahNumber had no Tajweed/Arabic text edition.');
    }
    final translationAyahs = ayahsFor(_translationEdition);
    final audioAyahs = ayahsFor(reciterEdition);

    return List.generate(tajweedAyahs.length, (i) {
      return AyahModel.fromApiJson(
        tajweedJson: tajweedAyahs[i] as Map<String, dynamic>,
        translationJson: i < translationAyahs.length
            ? translationAyahs[i] as Map<String, dynamic>
            : null,
        romanUrduJson:
            i < romanUrduAyahs.length ? romanUrduAyahs[i] as Map<String, dynamic> : null,
        audioJson: i < audioAyahs.length ? audioAyahs[i] as Map<String, dynamic> : null,
      );
    });
  }

  /// Roman Urdu is a secondary, "nice to have" translation from a second
  /// host — a hiccup fetching it shouldn't fail the whole surah load (the
  /// Arabic text and English translation are the essentials). Returns an
  /// empty list on any failure, so callers just see every ayah's Roman
  /// Urdu text come back null.
  Future<List<dynamic>> _fetchRomanUrdu(int surahNumber) async {
    try {
      final response = await _quranComDio.get(
        '/quran/translations/$_romanUrduResourceId',
        queryParameters: {'chapter_number': surahNumber},
      );
      return response.data['translations'] as List? ?? const [];
    } catch (_) {
      return const [];
    }
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
