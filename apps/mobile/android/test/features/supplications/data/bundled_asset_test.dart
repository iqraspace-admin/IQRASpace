import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/features/supplications/data/datasources/dua_favorites_local_datasource.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_local_datasource.dart';
import 'package:quran_flutter/features/supplications/data/models/duas_snapshot.dart';
import 'package:quran_flutter/features/supplications/data/repositories/dua_favorites_repository_impl.dart';
import 'package:quran_flutter/features/supplications/domain/entities/dua.dart';
import 'package:quran_flutter/features/supplications/presentation/constants/dua_category_style.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/dua_favorites_providers.dart';

import '../../../test_helpers/hive_test_env.dart';

/// Runs against the REAL assets/supplications.json.
void main() {
  const path = 'assets/supplications.json';
  late DuasSnapshot snapshot;
  late List<Dua> all;

  setUpAll(() {
    snapshot = DuasSnapshot.parse(jsonDecode(File(path).readAsStringSync()));
    all = [for (final c in snapshot.categories) ...c.duas];
  });

  String strip(String s) => s.replaceAll(RegExp('[ً-ٰٟۖ-ۭـ\\s]'), '');

  test('the real bundled asset parses and passes validation', () {
    expect(snapshot.categories, isNotEmpty);
    expect(all.length, greaterThan(106));
  });

  test('content sanity: Istikhara ending, long Ayat al-Kursi, no truncated Arabic', () {
    final istikhara = all.firstWhere((d) => d.slug == 'knowledge-istikharah-seeking-guidance-in-a-decision');
    expect(strip(istikhara.arabic).endsWith(strip('أَرْضِنِي بِهِ')), isTrue);
    expect(all.firstWhere((d) => d.slug == 'ayat-al-kursi').arabic.length, greaterThan(300));
    for (final d in all) {
      final a = d.arabic.trim();
      expect(a.endsWith('...') || a.endsWith('…'), isFalse, reason: d.slug);
    }
  });

  test('the Quls keep their line breaks (rendered as separate lines)', () {
    final quls = all.firstWhere((d) => d.slug == 'three-quls');
    expect(quls.arabic, contains('\n'));
    expect(quls.transliterationLatin, contains('\n'));
  });

  test('the bundled data source loads it with computed counts', () async {
    final content = await SupplicationsLocalDataSource(loader: () => File(path).readAsString()).load();
    expect(content.meta.categoryCount, content.categories.length);
    expect(content.meta.duaCount, all.map((d) => d.slug).toSet().length);
  });

  test('every category slug, including the new ones, resolves to a style (default for unknown)', () {
    for (final c in snapshot.categories) {
      expect(DuaCategoryStyles.forId(c.id).accent, isNotNull);
    }
    for (final id in [
      'durood-sharif',
      'after-salah',
      'protection-and-safety',
      'jinn-and-shayateen',
      'istighfar',
      'maqbool-duain',
    ]) {
      final style = DuaCategoryStyles.forId(id);
      expect(style.icon, isNotNull, reason: id);
    }
  });

  group('legacy favorites resolve by sort_order through the real asset', () {
    late Box<String> box;
    setUp(() async {
      await setUpTestHive();
      box = Hive.box<String>(HiveBoxes.duasFavoritesBoxName);
    });
    tearDown(tearDownTestHive);

    test('evening#2, sleep#3 and knowledge#2', () async {
      Future<void> seed(String cat, int i) => box.put(
            '${cat}_$i',
            jsonEncode({
              'categoryId': cat,
              'duaIndex': i,
              'categoryLabel': cat,
              'snippet': 's',
              'createdAt': DateTime(2026, 1, 1).toIso8601String(),
            }),
          );
      await seed('evening', 2);
      await seed('sleep', 3);
      await seed('knowledge', 2);

      final n = DuaFavoritesNotifier(
        DuaFavoritesRepositoryImpl(DuaFavoritesLocalDataSource(box)),
        bundledCategories: () async => (await SupplicationsLocalDataSource(loader: () => File('assets/supplications.json').readAsString()).load()).categories,
      );
      await n.migrationDone;

      expect(n.state.map((f) => f.duaSlug).toSet(), {
        'ayat-al-kursi',
        'three-quls',
        'knowledge-istikharah-seeking-guidance-in-a-decision',
      });
    });
  });
}
