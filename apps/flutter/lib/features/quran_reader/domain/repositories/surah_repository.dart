import 'package:quran_flutter/features/quran_reader/domain/entities/ayah.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/surah_summary.dart';

/// Pure Dart contract — no Dio/Hive/Flutter imports here, so the domain
/// layer stays trivially unit-testable and independent of how data is
/// actually fetched or cached.
abstract class SurahRepository {
  /// Returns the ayahs of [surahNumber] (1-114) with audio from
  /// [reciterEdition], offline-first: a cached copy for that exact
  /// (surah, reciter) pair is returned immediately when present,
  /// otherwise this fetches from the network and caches the result.
  Future<List<Ayah>> getSurah(int surahNumber, {required String reciterEdition});

  /// Returns all 114 surahs' metadata for the navigation list,
  /// offline-first the same way as [getSurah].
  Future<List<SurahSummary>> getSurahList();
}
