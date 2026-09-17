import 'package:quran_flutter/features/quran_reader/domain/entities/ayah.dart';
import 'package:quran_flutter/features/quran_reader/domain/repositories/surah_repository.dart';

class GetSurah {
  final SurahRepository repository;

  const GetSurah(this.repository);

  Future<List<Ayah>> call(int surahNumber, {required String reciterEdition}) =>
      repository.getSurah(surahNumber, reciterEdition: reciterEdition);
}
