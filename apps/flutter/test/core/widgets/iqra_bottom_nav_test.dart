import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/core/widgets/iqra_bottom_nav.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

import '../../test_helpers/hive_test_env.dart';

Future<void> pumpHost(WidgetTester tester, {int? currentIndex}) async {
  await tester.pumpWidget(
    ProviderScope(
      child: MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(
          body: const Center(child: Text('Screen body')),
          bottomNavigationBar: IqraBottomNav(currentIndex: currentIndex),
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  setUp(setUpTestHive);
  tearDown(tearDownTestHive);

  testWidgets('lists all five destinations', (tester) async {
    await pumpHost(tester, currentIndex: 0);

    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Quran'), findsOneWidget);
    expect(find.text('Learn'), findsOneWidget);
    expect(find.text('Bookmarks'), findsOneWidget);
    expect(find.text('Settings'), findsOneWidget);
  });

  testWidgets('tapping Settings opens the Reader Settings sheet without navigating away', (tester) async {
    await pumpHost(tester, currentIndex: 0);

    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();

    expect(find.text('Reading Settings'), findsOneWidget);
    // Still on the same screen underneath — Settings is a sheet, not a
    // route change.
    expect(find.text('Screen body'), findsOneWidget);
  });

  testWidgets('tapping Learn navigates to the Learn placeholder screen', (tester) async {
    await pumpHost(tester, currentIndex: 0);

    await tester.tap(find.text('Learn'));
    await tester.pumpAndSettle();

    expect(find.text('IqraSpace Learning'), findsOneWidget);
  });

  testWidgets('a null currentIndex does not crash (defaults to Home selected)', (tester) async {
    await pumpHost(tester, currentIndex: null);

    expect(tester.takeException(), isNull);
  });
}
