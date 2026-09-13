import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/core/constants/tajweed_rule_info.dart';
import 'package:quran_flutter/features/quran_reader/presentation/screens/tajweed_rules_screen.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

import '../../../../test_helpers/hive_test_env.dart';

void main() {
  setUp(setUpTestHive);
  tearDown(tearDownTestHive);

  testWidgets('shows the AppBar title and a row for every documented rule', (tester) async {
    // Tall enough that all 15 rule rows build without needing to scroll
    // — see reader_settings_sheet_test.dart's pumpAndOpenSheet for why.
    tester.view.physicalSize = const Size(390, 2200);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: const TajweedRulesScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final l10n = await AppLocalizations.delegate.load(const Locale('en'));

    expect(find.text(l10n.tajweedRulesScreenTitle), findsOneWidget);
    for (final rule in tajweedRuleInfo(l10n)) {
      expect(find.text(rule.name), findsOneWidget, reason: 'missing rule: ${rule.name}');
      expect(find.text(rule.description), findsOneWidget, reason: 'missing description for: ${rule.name}');
    }
  });
}
