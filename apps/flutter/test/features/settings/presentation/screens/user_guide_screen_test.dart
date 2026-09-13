import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/features/settings/presentation/screens/user_guide_screen.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

import '../../../../test_helpers/hive_test_env.dart';

Future<void> pumpGuide(WidgetTester tester) async {
  await tester.pumpWidget(
    ProviderScope(
      child: MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: const UserGuideScreen(),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  setUp(setUpTestHive);
  tearDown(tearDownTestHive);

  testWidgets('opens on the first topic with Back disabled and Next enabled', (tester) async {
    await pumpGuide(tester);

    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);
    expect(find.widgetWithText(TextButton, 'Back'), findsOneWidget);
    expect(
      tester.widget<TextButton>(find.widgetWithText(TextButton, 'Back')).onPressed,
      isNull,
    );
    expect(find.widgetWithText(FilledButton, 'Next'), findsOneWidget);
  });

  testWidgets('Next advances to the next topic', (tester) async {
    await pumpGuide(tester);

    await tester.tap(find.widgetWithText(FilledButton, 'Next'));
    await tester.pumpAndSettle();

    expect(find.text('The Surah screen'), findsOneWidget);
  });

  testWidgets('Skip closes the guide', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: Builder(
            builder: (context) => Scaffold(
              body: Center(
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const UserGuideScreen()),
                  ),
                  child: const Text('Open Guide'),
                ),
              ),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Open Guide'));
    await tester.pumpAndSettle();
    expect(find.text('Home'), findsOneWidget);

    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    expect(find.text('Home'), findsNothing);
    expect(find.text('Open Guide'), findsOneWidget);
  });

  testWidgets('the last page shows Done instead of Next, and it closes the guide', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: Builder(
            builder: (context) => Scaffold(
              body: Center(
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const UserGuideScreen()),
                  ),
                  child: const Text('Open Guide'),
                ),
              ),
            ),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Open Guide'));
    await tester.pumpAndSettle();

    // Tap Next until it's replaced by Done (the last topic).
    while (find.widgetWithText(FilledButton, 'Next').evaluate().isNotEmpty) {
      await tester.tap(find.widgetWithText(FilledButton, 'Next'));
      await tester.pumpAndSettle();
    }

    expect(find.widgetWithText(FilledButton, 'Done'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Next'), findsNothing);

    await tester.tap(find.widgetWithText(FilledButton, 'Done'));
    await tester.pumpAndSettle();

    expect(find.text('Open Guide'), findsOneWidget);
  });
}
