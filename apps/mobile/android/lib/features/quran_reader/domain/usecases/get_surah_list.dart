import 'package:quran_flutter/features/quran_reader/domain/entities/surah_summary.dart';
import 'package:quran_flutter/features/quran_reader/domain/repositories/surah_repository.dart';

class GetSurahList {
  final SurahRepository repository;

  const GetSurahList(this.repository);

  Future<List<SurahSummary>> call() => repository.getSurahList();
}
