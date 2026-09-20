import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_local_datasource.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('loads the bundled asset and its category/dua counts match meta', () async {
    final content = await SupplicationsLocalDataSource().load();

    expect(content.categories.length, content.meta.categoryCount);
    final totalDuas = content.categories.fold<int>(0, (sum, c) => sum + c.duas.length);
    expect(totalDuas, content.meta.duaCount);
  });

  test('every category has a non-empty id, label, description, and at least one dua', () async {
    final content = await SupplicationsLocalDataSource().load();

    for (final category in content.categories) {
      expect(category.id, isNotEmpty, reason: 'category with label "${category.label}" has no id');
      expect(category.label, isNotEmpty);
      expect(category.description, isNotEmpty);
      expect(category.duas, isNotEmpty, reason: 'category "${category.id}" has no duas');
    }
  });

  test('every dua has all five text fields populated', () async {
    final content = await SupplicationsLocalDataSource().load();

    for (final category in content.categories) {
      for (final dua in category.duas) {
        expect(dua.occasion, isNotEmpty);
        expect(dua.reference, isNotEmpty);
        expect(dua.arabic, isNotEmpty);
        expect(dua.transliterationLatin, isNotEmpty);
        expect(dua.transliterationTelugu, isNotEmpty);
        expect(dua.transliterationUrdu, isNotEmpty);
        expect(dua.translationEnglish, isNotEmpty);
      }
    }
  });

  test('repeated load() calls return the same cached future', () {
    final dataSource = SupplicationsLocalDataSource();
    expect(dataSource.load(), same(dataSource.load()));
  });
}
