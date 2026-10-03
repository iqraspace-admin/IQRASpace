import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/screens/supplications_categories_screen.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

import '../../../../test_helpers/hive_test_env.dart';
import '../../test_support.dart';

/// Builds the widget tree from a [ProviderContainer] that has already
/// resolved [supplicationsContentProvider], instead of pumping the
/// screen cold and waiting out its loading state (CircularProgressIndicator
/// never "settles" on its own; the asset read needs runAsync inside the
/// fake-async test zone).
Future<void> pumpScreen(WidgetTester tester) async {
  final container = ProviderContainer(overrides: [fixtureRepositoryOverride()]);
  addTearDown(container.dispose);
  await tester.runAsync(() => container.read(supplicationsContentProvider.future));

  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: const MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: SupplicationsCategoriesScreen(),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  setUp(setUpTestHive);
  tearDown(tearDownTestHive);

  testWidgets('shows the Duas title and every category, as a grid by default', (tester) async {
    await pumpScreen(tester);

    expect(find.widgetWithText(AppBar, 'Duas'), findsOneWidget);
    // Spot-check one known category from the bundled JSON rather than
    // asserting the full list — keeps this test from having to be
    // updated every time content is added.
    expect(find.text('Waking up'), findsOneWidget);
    expect(find.byIcon(Icons.view_list_outlined), findsOneWidget);
  });

  testWidgets('the view toggle switches between grid and list', (tester) async {
    await pumpScreen(tester);

    expect(find.byType(GridView), findsOneWidget);
    expect(find.byType(ListView), findsNothing);

    // The tap synchronously writes to Hive (a real, disk-backed box in
    // this test env) to persist the view choice — that write needs the
    // real event loop, which the widget-test fake-async zone won't
    // advance on its own, so this goes through tester.runAsync to avoid
    // pumpAndSettle hanging on it (same pattern as this file's old
    // script-switch test, and reader_settings_sheet_test.dart's
    // Translation/Tajweed toggles).
    await tester.runAsync(() async {
      await tester.tap(find.byIcon(Icons.view_list_outlined));
      await tester.pumpAndSettle();
      // The Hive write itself is fire-and-forget (not awaited by
      // setMode), so give it a moment before tearDown closes the box
      // out from under it.
      await Future<void>.delayed(const Duration(milliseconds: 50));
    });

    expect(find.byType(ListView), findsOneWidget);
    expect(find.byType(GridView), findsNothing);
    expect(find.byIcon(Icons.grid_view_outlined), findsOneWidget);
    // The category is still there, just in the other layout.
    expect(find.text('Waking up'), findsOneWidget);
  });

  testWidgets('tapping a category opens straight into the reading screen at dua 1', (tester) async {
    await pumpScreen(tester);

    await tester.tap(find.text('Waking up'));
    await tester.pumpAndSettle();

    expect(find.widgetWithText(AppBar, 'Waking up'), findsOneWidget);
    // Position indicator now lives in the header, not the content area.
    expect(find.widgetWithText(AppBar, '1 / 2'), findsOneWidget);
    // Exact match: "Upon waking" is also a substring of this category's
    // second occasion.
    expect(find.text('Upon waking'), findsOneWidget);
  });

  testWidgets('the favorites action opens the Favorites screen', (tester) async {
    await pumpScreen(tester);

    await tester.tap(find.byIcon(Icons.star_border_outlined));
    await tester.pumpAndSettle();

    expect(find.widgetWithText(AppBar, 'Favorites'), findsOneWidget);
  });

  testWidgets('the info action opens the sources note', (tester) async {
    // Tall enough that the info sheet's whole content builds without
    // needing to scroll — same reason as reader_settings_sheet_test.dart's
    // pumpAndOpenSheet: DraggableScrollableSheet sizes itself as a
    // fraction of the viewport, and flutter_test's default 800x600
    // canvas leaves it too short for the sourcesNote paragraph (below
    // the title/description/category summary) to ever mount.
    tester.view.physicalSize = const Size(390, 1600);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await pumpScreen(tester);

    await tester.tap(find.byIcon(Icons.info_outline));
    await tester.pumpAndSettle();

    expect(find.textContaining('Telugu is an algorithmically generated'), findsOneWidget);
  });
}
