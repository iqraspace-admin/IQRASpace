import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/features/supplications/presentation/constants/dua_category_style.dart';

import '../../test_support.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('known category slugs resolve to an explicit style', () async {
    final fallbackIcon = DuaCategoryStyles.forId('__unmapped_probe__').icon.codePoint;
    for (final id in ['waking', 'morning']) {
      expect(DuaCategoryStyles.forId(id).icon.codePoint, isNot(fallbackIcon), reason: id);
    }
  });

  test('a brand-new remote slug falls back to a default style instead of crashing', () async {
    final content = await fixtureBundled().load();
    for (final category in content.categories) {
      final style = DuaCategoryStyles.forId(category.id);
      expect(style.icon, isNotNull);
      expect(style.accent, isNotNull);
    }
    expect(DuaCategoryStyles.forId('some-slug-added-next-year').icon, isNotNull);
  });
}
