import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_local_datasource.dart';
import 'package:quran_flutter/features/supplications/data/repositories/supplications_repository_impl.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/screens/dua_reading_screen.dart';
import 'package:quran_flutter/features/supplications/presentation/screens/supplications_categories_screen.dart';
import 'package:quran_flutter/features/supplications/presentation/widgets/dua_font_size_control.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

import '../../../../test_helpers/hive_test_env.dart';

/// Pumps [home] against the REAL bundled Duas content (the longest category
/// names live there, not in the small test fixture) on a narrow phone
/// screen with a raised system text scale — the worst case for clipping.
Future<ProviderContainer> pumpReal(
  WidgetTester tester,
  Widget home, {
  double scale = 1.0,
  bool list = false,
  double systemTextScale = 1.0,
  Size size = const Size(320, 640),
  bool memoryScale = false,
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  await tester.runAsync(() async {
    await HiveBoxes.settingsBox.put('supplicationsFontScale', scale);
    if (list) {
      await HiveBoxes.settingsBox.put('supplicationsCategoryViewMode', 'list');
    }
  });
  final container = ProviderContainer(overrides: [
    // Widget tests must not leave a Hive disk write pending in the fake-async
    // zone (it deadlocks tearDown); persistence has its own test below.
    if (memoryScale)
      duaFontScaleProvider.overrideWith((ref) => _MemoryScaleNotifier()),
    supplicationsRepositoryProvider.overrideWithValue(
      SupplicationsRepositoryImpl(bundled: SupplicationsLocalDataSource()),
    ),
  ]);
  addTearDown(container.dispose);
  await tester
      .runAsync(() => container.read(supplicationsContentProvider.future));

  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context)
              .copyWith(textScaler: TextScaler.linear(systemTextScale)),
          child: child!,
        ),
        home: home,
      ),
    ),
  );
  await tester.pumpAndSettle();
  return container;
}

class _MemoryScaleNotifier extends DuaFontScaleNotifier {
  @override
  void setScale(double scale) => state =
      (scale.clamp(DuaFontScaleNotifier.min, DuaFontScaleNotifier.max) * 10)
              .round() /
          10;
}

void main() {
  setUp(setUpTestHive);
  tearDown(tearDownTestHive);

  for (final list in [false, true]) {
    for (final scale in [0.8, 1.0, 1.4, 1.8]) {
      testWidgets(
          'categories ${list ? 'list' : 'grid'} at ${(scale * 100).round()}% lays out without overflow',
          (tester) async {
        await pumpReal(tester, const SupplicationsCategoriesScreen(),
            scale: scale, list: list);
        expect(tester.takeException(), isNull);

        // Scroll the whole way down: every category row/tile must lay out.
        final scrollable = find.byType(Scrollable).first;
        for (var i = 0; i < 40; i++) {
          await tester.drag(scrollable, const Offset(0, -500));
          await tester.pump();
          expect(tester.takeException(), isNull,
              reason: 'overflow after scrolling $i pages');
        }
      });
    }
  }

  testWidgets(
      'categories grid also holds up with a large system text scale on top',
      (tester) async {
    await pumpReal(tester, const SupplicationsCategoriesScreen(),
        scale: 1.8, systemTextScale: 1.3);
    final scrollable = find.byType(Scrollable).first;
    for (var i = 0; i < 40; i++) {
      await tester.drag(scrollable, const Offset(0, -500));
      await tester.pump();
    }
    expect(tester.takeException(), isNull);
  });

  testWidgets('category label text really grows with the setting',
      (tester) async {
    await pumpReal(tester, const SupplicationsCategoriesScreen(), scale: 1.0);
    final firstLabel = find
        .descendant(of: find.byType(GridView), matching: find.byType(Text))
        .at(0);
    final small = tester.widget<Text>(firstLabel).style!.fontSize!;

    await tester.pumpWidget(const SizedBox.shrink());
    await pumpReal(tester, const SupplicationsCategoriesScreen(), scale: 1.8);
    final big = tester
        .widget<Text>(
          find
              .descendant(
                  of: find.byType(GridView), matching: find.byType(Text))
              .at(0),
        )
        .style!
        .fontSize!;
    expect(big, closeTo(small * 1.8, 0.01));
  });

  for (final scale in [0.8, 1.0, 1.8]) {
    testWidgets(
        'reading screen at ${(scale * 100).round()}% lays out without overflow, every dua',
        (tester) async {
      final container = await pumpReal(
        tester,
        const DuaReadingScreen(categoryId: 'waking', initialIndex: 0),
        scale: scale,
      );
      final category = container.read(supplicationCategoryProvider('waking'));
      expect(category, isNotNull,
          reason:
              'category id used by this test must exist in the bundled asset');
      for (var i = 0; i < category!.duas.length; i++) {
        expect(tester.takeException(), isNull, reason: 'dua $i');
        await tester.fling(find.byType(PageView), const Offset(-400, 0), 1500);
        await tester.pumpAndSettle();
      }
    });
  }

  testWidgets('the font size survives leaving and re-entering a category',
      (tester) async {
    final container = await pumpReal(
        tester, const SupplicationsCategoriesScreen(),
        scale: 1.0, memoryScale: true);
    container.read(duaFontScaleProvider.notifier).setScale(1.5);
    await tester.pumpAndSettle();

    final firstTile = find
        .descendant(of: find.byType(GridView), matching: find.byType(Text))
        .first;
    await tester.tap(firstTile);
    await tester.pumpAndSettle();
    expect(find.byType(DuaReadingScreen), findsOneWidget);
    expect(container.read(duaFontScaleProvider), 1.5);

    await tester.pageBack();
    await tester.pumpAndSettle();
    expect(container.read(duaFontScaleProvider), 1.5);
  });

  testWidgets(
      'the slider updates the live preview while dragging and persists on release',
      (tester) async {
    final container = await pumpReal(
        tester, const SupplicationsCategoriesScreen(),
        size: const Size(390, 1400), memoryScale: true);
    await tester.tap(find.byIcon(Icons.text_fields));
    await tester.pumpAndSettle();
    expect(find.byType(DuaFontSizeControl), findsOneWidget);

    double previewSize() => tester
        .widget<Text>(find.text('Alhamdu lillahi rabbil-alamin'))
        .style!
        .fontSize!;
    expect(previewSize(), closeTo(14.5, 0.01));

    // Press "larger" twice via the A+ button: 100% -> 120%.
    final larger = find.byTooltip('Larger text');
    // pump(), not pumpAndSettle(): the Hive write behind each commit needs
    // the real event loop, which pumpAndSettle would wait on forever.
    await tester.tap(larger);
    await tester.pump(const Duration(milliseconds: 300));
    await tester.tap(larger);
    await tester.pump(const Duration(milliseconds: 300));
    expect(container.read(duaFontScaleProvider), closeTo(1.2, 0.001));
    expect(previewSize(), closeTo(14.5 * 1.2, 0.01));
    expect(find.text('120%'), findsWidgets);

    // Dragging the slider moves the preview before anything is committed.
    await tester.drag(find.byType(Slider), const Offset(300, 0));
    await tester.pump();
    expect(previewSize(), greaterThan(14.5 * 1.2));

    await tester.ensureVisible(find.text('Reset'));
    await tester.pump();
    await tester.tap(find.text('Reset'));
    await tester.pump(const Duration(milliseconds: 300));
    expect(container.read(duaFontScaleProvider), 1.0);
    expect(tester.takeException(), isNull);
  });

  test('the font scale is clamped, stepped to 0.1 and persisted', () async {
    final notifier = DuaFontScaleNotifier();
    expect(notifier.state, 1.0);
    notifier.setScale(1.54);
    expect(notifier.state, 1.5);
    expect(HiveBoxes.settingsBox.get('supplicationsFontScale'), 1.5);
    notifier.setScale(9);
    expect(notifier.state, 1.8);
    notifier.setScale(0.1);
    expect(notifier.state, 0.8);
    expect(DuaFontScaleNotifier().state, 0.8,
        reason: 'a fresh notifier reads the saved value');
    await Future<void>.delayed(const Duration(milliseconds: 100));
  });
}
