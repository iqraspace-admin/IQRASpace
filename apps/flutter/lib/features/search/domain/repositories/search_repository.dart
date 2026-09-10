import 'package:quran_flutter/features/search/domain/entities/search_result.dart';

abstract class SearchRepository {
  /// Searches the English translation text for [keyword] across the
  /// whole Quran. Always hits the network — search results aren't
  /// cached, since the query space is unbounded and results are cheap
  /// to refetch.
  Future<List<SearchResult>> search(String keyword);
}
