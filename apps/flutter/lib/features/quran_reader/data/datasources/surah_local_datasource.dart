import 'dart:convert';

import 'package:hive/hive.dart';
import 'package:quran_flutter/features/quran_reader/data/models/ayah_model.dart';
import 'package:quran_flutter/features/quran_reader/data/models/surah_summary_model.dart';

/// Offline cache for surah ayahs (keyed `"surah_{n}_{reciter}"` — the
/// reciter is part of the key because cached ayahs carry that reciter's
/// audio URLs; switching reciters without this would silently keep
/// serving the old reciter's audio from cache) and the surah list
/// (fixed key `"surah_list"`). Stores plain JSON-encoded strings rather
/// than Hive-generated objects — this app deliberately avoids
/// build_runner/hive_generator in this pass.
class SurahLocalDataSource {
  final Box<String> _box;

  SurahLocalDataSource(this._box);

  static const _surahListKey = 'surah_list';
  static String _ayahsKeyFor(int surahNumber, String reciterEdition) =>
      'surah_${surahNumber}_$reciterEdition';

  List<AyahModel>? getSurah(int surahNumber, String reciterEdition) {
    final raw = _box.get(_ayahsKeyFor(surahNumber, reciterEdition));
    if (raw == null) return null;

    final decoded = jsonDecode(raw) as List;
    return decoded
        .map((e) => AyahModel.fromCacheJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> cacheSurah(
    int surahNumber,
    String reciterEdition,
    List<AyahModel> ayahs,
  ) async {
    final encoded = jsonEncode(ayahs.map((a) => a.toCacheJson()).toList());
    await _box.put(_ayahsKeyFor(surahNumber, reciterEdition), encoded);
  }

  List<SurahSummaryModel>? getSurahList() {
    final raw = _box.get(_surahListKey);
    if (raw == null) return null;

    final decoded = jsonDecode(raw) as List;
    return decoded
        .map((e) => SurahSummaryModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> cacheSurahList(List<SurahSummaryModel> surahs) async {
    final encoded = jsonEncode(surahs.map((s) => s.toJson()).toList());
    await _box.put(_surahListKey, encoded);
  }
}
