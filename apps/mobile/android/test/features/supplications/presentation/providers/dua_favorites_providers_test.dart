import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/features/supplications/data/datasources/dua_favorites_local_datasource.dart';
import 'package:quran_flutter/features/supplications/data/repositories/dua_favorites_repository_impl.dart';
import 'package:quran_flutter/features/supplications/domain/entities/dua_favorite.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/dua_favorites_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/utils/favorite_resolver.dart';

import '../../../../test_helpers/hive_test_env.dart';
import '../../test_support.dart';

DuaFavorite legacy(String categoryId, int index, {String snippet = 's', DateTime? at}) => DuaFavorite(
      categoryId: categoryId,
      duaIndex: index,
      categoryLabel: categoryId,
      snippet: snippet,
      createdAt: at ?? DateTime(2026, 1, 1),
    );

void main() {
  late Box<String> box;

  setUp(() async {
    await setUpTestHive();
    box = Hive.box<String>(HiveBoxes.duasFavoritesBoxName);
  });
  tearDown(tearDownTestHive);

  Future<void> seedLegacy(DuaFavorite f) => box.put(
        '${f.categoryId}_${f.duaIndex}',
        jsonEncode({
          'categoryId': f.categoryId,
          'duaIndex': f.duaIndex,
          'categoryLabel': f.categoryLabel,
          'snippet': f.snippet,
          'createdAt': f.createdAt.toIso8601String(),
        }),
      );

  DuaFavoritesNotifier notifier() => DuaFavoritesNotifier(
        DuaFavoritesRepositoryImpl(DuaFavoritesLocalDataSource(box)),
        bundledCategories: () async => (await fixtureBundled().load()).categories,
      );

  test('legacy favorites are migrated to slugs through the bundled content', () async {
    await seedLegacy(legacy('waking', 1, snippet: 'second'));
    final n = notifier();
    expect(n.state.single.duaSlug, isNull);

    await n.migrationDone;

    expect(n.state.single.duaSlug, 'dua-dhikr-waking');
    expect(n.state.single.snippet, 'second');
    // Persisted: old positional key replaced by the slug key.
    expect(box.keys, ['slug:dua-dhikr-waking']);
    expect(notifier().state.single.duaSlug, 'dua-dhikr-waking');
  });

  test('an unresolvable legacy favorite is kept untouched', () async {
    await seedLegacy(legacy('retired-category', 0, snippet: 'old one'));
    await seedLegacy(legacy('waking', 99, snippet: 'out of range'));
    final n = notifier();
    await n.migrationDone;

    expect(n.state.map((f) => f.duaSlug), [null, null]);
    expect(box.length, 2);
  });

  test('legacy duplicate of an already slug-keyed favorite is merged', () async {
    final n0 = notifier();
    await n0.toggle(DuaFavorite(
      duaSlug: 'dua-upon-waking',
      categoryId: 'waking',
      duaIndex: 0,
      categoryLabel: 'Waking up',
      snippet: 'new',
      createdAt: DateTime(2026, 2, 1),
    ));
    await seedLegacy(legacy('waking', 0, snippet: 'old'));

    final n = notifier();
    await n.migrationDone;
    expect(n.state, hasLength(1));
    expect(n.state.single.snippet, 'new');
    expect(box.keys, ['slug:dua-upon-waking']);
  });

  test('toggle by slug adds then removes, independent of category/index', () async {
    final n = notifier();
    final fav = DuaFavorite(
      duaSlug: 'dua-new',
      categoryId: 'brand-new-category',
      duaIndex: 0,
      categoryLabel: 'x',
      snippet: 'New dua',
      createdAt: DateTime(2026, 3, 1),
    );
    await n.toggle(fav);
    expect(n.isFavoritedSlug('dua-new'), isTrue);
    expect(box.keys, ['slug:dua-new']);

    await n.toggle(DuaFavorite(
      duaSlug: 'dua-new',
      categoryId: 'elsewhere',
      duaIndex: 5,
      categoryLabel: 'y',
      snippet: 'New dua',
      createdAt: DateTime(2026, 3, 2),
    ));
    expect(n.state, isEmpty);
    expect(box, isEmpty);
  });

  group('resolveFavorite', () {
    test('prefers the recorded category, else the first containing it, else null', () async {
      final categories = (await fixtureBundled().load()).categories;
      DuaFavorite fav(String slug, String cat) => DuaFavorite(
            duaSlug: slug,
            categoryId: cat,
            duaIndex: 0,
            categoryLabel: '',
            snippet: '',
            createdAt: DateTime(2026),
          );

      expect(resolveFavorite(fav('dua-dhikr-waking', 'morning'), categories), (categoryId: 'morning', index: 0));
      expect(resolveFavorite(fav('dua-dhikr-waking', 'waking'), categories), (categoryId: 'waking', index: 1));
      // Recorded category gone/never contained it: first category that does.
      expect(resolveFavorite(fav('dua-dhikr-waking', 'retired'), categories), (categoryId: 'waking', index: 1));
      expect(resolveFavorite(fav('vanished', 'waking'), categories), isNull);
      // Legacy positional fallback.
      expect(resolveFavorite(legacy('waking', 1), categories), (categoryId: 'waking', index: 1));
      expect(resolveFavorite(legacy('waking', 9), categories), isNull);
    });
  });
}
