import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/search/data/datasources/search_remote_datasource.dart';
import 'package:quran_flutter/features/search/data/repositories/search_repository_impl.dart';
import 'package:quran_flutter/features/search/domain/entities/search_result.dart';
import 'package:quran_flutter/features/search/domain/repositories/search_repository.dart';

final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  final dio = ref.watch(dioProvider); // shared Dio instance from quran_reader
  return SearchRepositoryImpl(SearchRemoteDataSource(dio));
});

/// Re-runs whenever [searchQueryProvider] changes. Empty query short-
/// circuits to an empty result list without hitting the network.
final searchQueryProvider = StateProvider<String>((ref) => '');

final searchResultsProvider = FutureProvider<List<SearchResult>>((ref) async {
  final query = ref.watch(searchQueryProvider).trim();
  if (query.isEmpty) return [];
  return ref.watch(searchRepositoryProvider).search(query);
});
