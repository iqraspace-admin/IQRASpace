import 'package:quran_flutter/features/quran_reader/data/datasources/surah_local_datasource.dart';
import 'package:quran_flutter/features/quran_reader/data/datasources/surah_remote_datasource.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/ayah.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/surah_summary.dart';
import 'package:quran_flutter/features/quran_reader/domain/repositories/surah_repository.dart';

/// Offline-first: a cache hit returns instantly with no network call; a
/// cache miss fetches, parses (inside AyahModel.fromApiJson), caches, and
/// returns.
class SurahRepositoryImpl implements SurahRepository {
  final SurahRemoteDataSource remote;
  final SurahLocalDataSource local;

  SurahRepositoryImpl({required this.remote, required this.local});

  @override
  Future<List<Ayah>> getSurah(int surahNumber, {required String reciterEdition}) async {
    final cached = local.getSurah(surahNumber, reciterEdition);
    if (cached != null) return cached;

    final fresh = await _withRetry(() => remote.fetchSurah(surahNumber, reciterEdition: reciterEdition));
    await local.cacheSurah(surahNumber, reciterEdition, fresh);
    return fresh;
  }

  @override
  Future<List<SurahSummary>> getSurahList() async {
    final cached = local.getSurahList();
    if (cached != null) return cached;

    final fresh = await _withRetry(() => remote.fetchSurahList());
    await local.cacheSurahList(fresh);
    return fresh;
  }

  /// One retry after a short pause before giving up — a dropped packet
  /// or a momentary DNS/proxy hiccup (the kind that shows up as a single
  /// failed request, not a genuinely offline device) shouldn't need the
  /// reader to tap "Retry" by hand. A second real failure still surfaces
  /// to the UI's own error + Retry state as before; this only smooths
  /// over the transient case.
  Future<T> _withRetry<T>(Future<T> Function() attempt) async {
    try {
      return await attempt();
    } catch (_) {
      await Future<void>.delayed(const Duration(milliseconds: 800));
      return attempt();
    }
  }
}
