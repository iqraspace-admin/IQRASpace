import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:mocktail/mocktail.dart';
import 'package:quran_flutter/features/bookmarks/data/datasources/bookmarks_local_datasource.dart';
import 'package:quran_flutter/features/bookmarks/data/models/bookmark_model.dart';

class MockBox extends Mock implements Box<String> {}

void main() {
  late MockBox box;
  late BookmarksLocalDataSource dataSource;

  final bookmark = BookmarkModel(
    surahNumber: 1,
    ayahNumber: 1,
    surahEnglishName: 'Al-Faatiha',
    snippet: 'In the name of Allah, the Entirely Merciful.',
    createdAt: DateTime(2026, 1, 1),
  );

  setUp(() {
    box = MockBox();
    dataSource = BookmarksLocalDataSource(box);
  });

  test('isBookmarked checks the composite "{surah}_{ayah}" key', () {
    when(() => box.containsKey('1_1')).thenReturn(true);
    expect(dataSource.isBookmarked(1, 1), isTrue);
  });

  test('add stores the bookmark JSON under the composite key', () async {
    when(() => box.put(any(), any())).thenAnswer((_) async {});

    await dataSource.add(bookmark);

    final captured = verify(() => box.put('1_1', captureAny())).captured.single as String;
    expect(jsonDecode(captured)['surahEnglishName'], 'Al-Faatiha');
  });

  test('remove deletes the composite key', () async {
    when(() => box.delete(any())).thenAnswer((_) async {});

    await dataSource.remove(1, 1);

    verify(() => box.delete('1_1')).called(1);
  });

  test('getAll decodes every entry and sorts newest first', () {
    final older = BookmarkModel(
      surahNumber: 1,
      ayahNumber: 1,
      surahEnglishName: 'A',
      snippet: 'older',
      createdAt: DateTime(2026, 1, 1),
    );
    final newer = BookmarkModel(
      surahNumber: 2,
      ayahNumber: 5,
      surahEnglishName: 'B',
      snippet: 'newer',
      createdAt: DateTime(2026, 2, 1),
    );
    when(() => box.values).thenReturn([jsonEncode(older.toJson()), jsonEncode(newer.toJson())]);

    final result = dataSource.getAll();

    expect(result.map((b) => b.snippet), ['newer', 'older']);
  });
}
