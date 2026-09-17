import 'package:dio/dio.dart';
import 'package:quran_flutter/features/search/domain/entities/search_result.dart';

/// Same translation edition used for the reader's translation text
/// (lib/features/quran_reader/data/datasources/surah_remote_datasource.dart)
/// so a search result's wording matches what's shown in the reader.
const _translationEdition = 'en.sahih';

class SearchRemoteDataSource {
  final Dio _dio;

  SearchRemoteDataSource(this._dio);

  Future<List<SearchResult>> search(String keyword) async {
    final encoded = Uri.encodeComponent(keyword);
    Response<dynamic> response;
    try {
      response = await _dio.get('/search/$encoded/all/$_translationEdition');
    } on DioException catch (e) {
      // A search with no matches returns an actual HTTP 404 with `data`
      // as a plain string ("Nothing matching your search was found.."),
      // not an object with `matches` — confirmed against the live API.
      // Treat that as zero results rather than an error.
      if (e.response?.statusCode == 404) return [];
      rethrow;
    }

    final matches = (response.data['data']['matches'] as List?) ?? [];

    return matches.map((m) {
      final json = m as Map<String, dynamic>;
      final surah = json['surah'] as Map<String, dynamic>;
      return SearchResult(
        surahNumber: surah['number'] as int,
        surahEnglishName: surah['englishName'] as String,
        numberInSurah: json['numberInSurah'] as int,
        matchedText: json['text'] as String,
      );
    }).toList();
  }
}
