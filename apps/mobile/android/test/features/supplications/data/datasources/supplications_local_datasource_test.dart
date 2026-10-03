import 'package:flutter_test/flutter_test.dart';

import '../../test_support.dart';

/// Tests the bundled data source against the fixture (injected loader),
/// not the real asset, which is regenerated independently.
void main() {
  test('parses the bundled snapshot; meta text from "meta", counts computed', () async {
    final content = await fixtureBundled().load();

    expect(content.meta.title, 'Fixture Duas');
    expect(content.meta.coverageNote, 'Fixture coverage note.');
    expect(content.meta.categoryCount, content.categories.length);
    final distinct = <String>{for (final c in content.categories) for (final d in c.duas) d.slug};
    expect(content.meta.duaCount, distinct.length);
  });

  test('every category has an id, label and at least one dua with core fields', () async {
    final content = await fixtureBundled().load();

    for (final category in content.categories) {
      expect(category.id, isNotEmpty);
      expect(category.label, isNotEmpty);
      expect(category.duas, isNotEmpty);
      for (final dua in category.duas) {
        expect(dua.slug, isNotEmpty);
        expect(dua.title, isNotEmpty);
        expect(dua.arabic, isNotEmpty);
      }
    }
  });

  test('a snapshot without "meta" still loads (empty meta text)', () async {
    final content = await fixtureBundledWithoutMeta().load();
    expect(content.categories, isNotEmpty);
    expect(content.meta.sourcesNote, isEmpty);
  });

  test('repeated load() calls return the same cached future', () {
    final dataSource = fixtureBundled();
    expect(dataSource.load(), same(dataSource.load()));
  });
}
