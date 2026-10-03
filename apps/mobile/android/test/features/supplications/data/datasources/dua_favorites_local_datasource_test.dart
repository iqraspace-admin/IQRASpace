import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:mocktail/mocktail.dart';
import 'package:quran_flutter/features/supplications/data/datasources/dua_favorites_local_datasource.dart';
import 'package:quran_flutter/features/supplications/data/models/dua_favorite_model.dart';

class MockBox extends Mock implements Box<String> {}

void main() {
  late MockBox box;
  late DuaFavoritesLocalDataSource dataSource;

  final favorite = DuaFavoriteModel(
    categoryId: 'waking',
    duaIndex: 0,
    categoryLabel: 'Waking up',
    snippet: 'Upon waking',
    createdAt: DateTime(2026, 1, 1),
  );

  setUp(() {
    box = MockBox();
    dataSource = DuaFavoritesLocalDataSource(box);
  });

  test('isFavorited checks the composite "{categoryId}_{duaIndex}" key', () {
    when(() => box.containsKey('waking_0')).thenReturn(true);
    expect(dataSource.isFavorited('waking', 0), isTrue);
  });

  test('add stores the favorite JSON under the composite key', () async {
    when(() => box.put(any(), any())).thenAnswer((_) async {});

    await dataSource.add(favorite);

    final captured = verify(() => box.put('waking_0', captureAny())).captured.single as String;
    expect(jsonDecode(captured)['categoryLabel'], 'Waking up');
  });

  test('remove deletes the composite key', () async {
    when(() => box.delete(any())).thenAnswer((_) async {});

    await dataSource.remove('waking', 0);

    verify(() => box.delete('waking_0')).called(1);
  });

  test('clearAll clears the whole box', () async {
    when(() => box.clear()).thenAnswer((_) async => 0);

    await dataSource.clearAll();

    verify(() => box.clear()).called(1);
  });

  test('getAll decodes every entry and sorts newest first', () {
    final older = DuaFavoriteModel(
      categoryId: 'waking',
      duaIndex: 0,
      categoryLabel: 'Waking up',
      snippet: 'older',
      createdAt: DateTime(2026, 1, 1),
    );
    final newer = DuaFavoriteModel(
      categoryId: 'morning',
      duaIndex: 2,
      categoryLabel: 'Morning athkar',
      snippet: 'newer',
      createdAt: DateTime(2026, 2, 1),
    );
    when(() => box.values).thenReturn([jsonEncode(older.toJson()), jsonEncode(newer.toJson())]);

    final result = dataSource.getAll();

    expect(result.map((f) => f.snippet), ['newer', 'older']);
  });
}
