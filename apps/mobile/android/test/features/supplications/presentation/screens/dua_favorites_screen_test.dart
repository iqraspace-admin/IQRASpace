import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/features/supplications/domain/entities/dua_favorite.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/dua_favorites_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/screens/dua_favorites_screen.dart';
import 'package:quran_flutter/features/supplications/presentation/screens/dua_reading_screen.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

import '../../../../test_helpers/hive_test_env.dart';
import '../../test_support.dart';

Future<ProviderContainer> buildContainer(WidgetTester tester) async {
  final container = ProviderContainer(overrides: [fixtureRepositoryOverride()]);
  addTearDown(container.dispose);
  await tester.runAsync(() => container.read(supplicationsContentProvider.future));
  return container;
}

Future<void> pumpScreen(WidgetTester tester, ProviderContainer container) async {
  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: const MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: DuaFavoritesScreen(),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  setUp(setUpTestHive);
  tearDown(tearDownTestHive);

  testWidgets('shows an empty state with no favorites', (tester) async {
    final container = await buildContainer(tester);
    await pumpScreen(tester, container);

    expect(find.text('No favorite duas yet.'), findsOneWidget);
    // The clear-all action is disabled (no-op) when there's nothing to
    // clear.
    final button = tester.widget<IconButton>(
      find.ancestor(of: find.byIcon(Icons.delete_sweep_outlined), matching: find.byType(IconButton)),
    );
    expect(button.onPressed, isNull);
  });

  testWidgets('lists a favorited dua and opens it in the reading screen on tap', (tester) async {
    final container = await buildContainer(tester);
    await tester.runAsync(() => container.read(duaFavoritesProvider.notifier).toggle(
          DuaFavorite(
            categoryId: 'waking',
            duaIndex: 0,
            categoryLabel: 'Waking up',
            snippet: 'Upon waking',
            createdAt: DateTime(2026, 1, 1),
          ),
        ));
    await pumpScreen(tester, container);

    expect(find.text('Upon waking'), findsOneWidget);
    expect(find.text('Waking up'), findsOneWidget);

    await tester.tap(find.text('Upon waking'));
    await tester.pumpAndSettle();

    expect(find.byType(DuaReadingScreen), findsOneWidget);
  });

  testWidgets('clear all empties the list after confirming', (tester) async {
    final container = await buildContainer(tester);
    await tester.runAsync(() => container.read(duaFavoritesProvider.notifier).toggle(
          DuaFavorite(
            categoryId: 'waking',
            duaIndex: 0,
            categoryLabel: 'Waking up',
            snippet: 'Upon waking',
            createdAt: DateTime(2026, 1, 1),
          ),
        ));
    await pumpScreen(tester, container);

    // The whole dialog-open-to-confirm sequence goes through a single
    // tester.runAsync: the final tap triggers a real Hive write
    // (clearAll), and starting that mid-sequence in a fresh runAsync
    // block after an un-wrapped pumpAndSettle left a fake-time dialog
    // transition pending caused pumpAndSettle to hang indefinitely
    // waiting on a timer the real-time zone can't drive.
    await tester.runAsync(() async {
      await tester.tap(find.byIcon(Icons.delete_sweep_outlined));
      await tester.pumpAndSettle();
      expect(find.text('Clear all favorites?'), findsOneWidget);

      await tester.tap(find.widgetWithText(TextButton, 'Clear all'));
      await tester.pumpAndSettle();
      // The confirm button's onPressed isn't itself awaited by the tap
      // mechanism, so pumpAndSettle can return before clearAll()'s
      // trailing Hive write actually finishes (it doesn't schedule a
      // new frame, so there's nothing for pumpAndSettle to wait on) —
      // give it a moment before tearDown closes the box out from
      // under it.
      await Future<void>.delayed(const Duration(milliseconds: 50));
    });

    expect(find.text('No favorite duas yet.'), findsOneWidget);
  });

  testWidgets('a favorite found by slug opens in its recorded category; a vanished one shows as unavailable', (tester) async {
    final container = await buildContainer(tester);
    await tester.runAsync(() async {
      final n = container.read(duaFavoritesProvider.notifier);
      await n.toggle(DuaFavorite(
        duaSlug: 'dua-dhikr-waking',
        categoryId: 'morning',
        duaIndex: 7,
        categoryLabel: 'Morning athkar',
        snippet: 'Morning remembrance',
        createdAt: DateTime(2026, 2, 1),
      ));
      await n.toggle(DuaFavorite(
        duaSlug: 'removed-upstream',
        categoryId: 'waking',
        duaIndex: 0,
        categoryLabel: 'Waking up',
        snippet: 'Gone dua',
        createdAt: DateTime(2026, 1, 1),
      ));
    });
    await pumpScreen(tester, container);

    expect(find.text('Waking up · No longer available'), findsOneWidget);
    await tester.tap(find.text('Gone dua'));
    await tester.pumpAndSettle();
    expect(find.byType(DuaReadingScreen), findsNothing);

    await tester.tap(find.text('Morning remembrance'));
    await tester.pumpAndSettle();
    expect(find.byType(DuaReadingScreen), findsOneWidget);
    expect(find.widgetWithText(AppBar, 'Morning athkar'), findsOneWidget);
    expect(find.widgetWithText(AppBar, '1 / 1'), findsOneWidget);
  });
}
