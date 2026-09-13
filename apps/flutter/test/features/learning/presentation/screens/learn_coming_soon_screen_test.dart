import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/features/learning/presentation/screens/learn_coming_soon_screen.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

import '../../../../test_helpers/hive_test_env.dart';

void main() {
  setUp(setUpTestHive);
  tearDown(tearDownTestHive);

  testWidgets('shows the reserved-for-later placeholder copy, not a broken/empty screen', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: const LearnComingSoonScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('IqraSpace Learning'), findsOneWidget);
    expect(find.textContaining('coming in a future update'), findsOneWidget);
    // Still reachable via the normal bottom nav — this isn't a dead end.
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Quran'), findsOneWidget);
  });
}
