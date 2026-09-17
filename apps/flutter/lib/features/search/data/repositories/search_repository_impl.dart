import 'package:quran_flutter/features/search/data/datasources/search_remote_datasource.dart';
import 'package:quran_flutter/features/search/domain/entities/search_result.dart';
import 'package:quran_flutter/features/search/domain/repositories/search_repository.dart';

class SearchRepositoryImpl implements SearchRepository {
  final SearchRemoteDataSource remote;

  const SearchRepositoryImpl(this.remote);

  @override
  Future<List<SearchResult>> search(String keyword) => remote.search(keyword);
}
