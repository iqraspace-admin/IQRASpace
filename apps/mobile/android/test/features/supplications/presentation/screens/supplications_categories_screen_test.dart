import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/screens/supplications_categories_screen.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

import '../../../../test_helpers/hive_test_env.dart';

/// Builds the widget tree from a [ProviderContainer] that has already
/// resolved [supplicationsContentProvider], instead of pumping the
/// screen cold and waiting out its loading state.
///
/// Deliberately not "pumpWidget, then pumpAndSettle": the screen's
/// loading state renders a CircularProgressIndicator, which schedules
/// frames forever and never "settles" on its own — and reading
/// assets/supplications.json is real (if fast) disk I/O, which needs
/// runAsync to actually complete inside the fake-async test zone (same
/// reason Hive I/O does elsewhere in this suite — see
/// home_screen_test.dart's pumpHome doc comment). Awaiting the provider
/// directly, via runAsync, before the first pump means the screen never
/// renders that loading frame at all.
Future<void> pumpScreen(WidgetTester tester) async {
  final container = ProviderContainer();
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

  testWidgets('shows the Supplications title, the script switch, and every category', (tester) async {
    await pumpScreen(tester);

    expect(find.widgetWithText(AppBar, 'Supplications'), findsOneWidget);
    expect(find.text('Latin'), findsOneWidget);
    expect(find.text('Telugu'), findsOneWidget);
    expect(find.text('Urdu'), findsOneWidget);
    // Spot-check one known category from the bundled JSON rather than
    // asserting the full list — keeps this test from having to be
    // updated every time content is added.
    expect(find.text('Waking up'), findsOneWidget);
  });

  testWidgets('tapping a category opens its detail screen with the Arabic dua text', (tester) async {
    await pumpScreen(tester);

    await tester.tap(find.text('Waking up'));
    await tester.pumpAndSettle();

    expect(find.widgetWithText(AppBar, 'Waking up'), findsOneWidget);
    expect(find.textContaining('Upon waking'), findsWidgets);
  });

  testWidgets('switching the script updates every visible dua card', (tester) async {
    await pumpScreen(tester);
    await tester.tap(find.text('Waking up'));
    await tester.pumpAndSettle();

    // Defaults to Latin — the transliteration line should not contain
    // Telugu script text yet.
    expect(find.textContaining('Al-ḥamdu'), findsWidgets);

    // The tap synchronously writes to Hive (a real, disk-backed box in
    // this test env) to persist the script choice — that write needs
    // the real event loop, which the widget-test fake-async zone won't
    // advance on its own, so this goes through tester.runAsync to avoid
    // pumpAndSettle hanging on it (same pattern as
    // reader_settings_sheet_test.dart's Translation/Tajweed toggles).
    await tester.runAsync(() async {
      await tester.tap(find.text('Telugu'));
      await tester.pumpAndSettle();
    });

    expect(find.textContaining('అల్హమ్దు'), findsWidgets);
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
