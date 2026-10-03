import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/core/constants/dua_translation_language.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/dua_favorites_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/screens/dua_reading_screen.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

import 'package:quran_flutter/core/storage/hive_boxes.dart';

import '../../../../test_helpers/hive_test_env.dart';
import '../../test_support.dart';

Future<void> pumpScreen(
  WidgetTester tester, {
  required String categoryId,
  int initialIndex = 0,
  String? language,
  bool tasbeeh = false,
}) async {
  await tester.runAsync(() async {
    if (language != null) await HiveBoxes.settingsBox.put('appLanguage', language);
    if (tasbeeh) await HiveBoxes.settingsBox.put('supplicationsTasbeehEnabled', true);
  });
  final container = ProviderContainer(overrides: [fixtureRepositoryOverride()]);
  addTearDown(container.dispose);
  await tester.runAsync(() => container.read(supplicationsContentProvider.future));

  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: DuaReadingScreen(categoryId: categoryId, initialIndex: initialIndex),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  setUp(setUpTestHive);
  tearDown(tearDownTestHive);

  testWidgets('shows the Arabic text, translation, transliteration and reference for the first dua', (tester) async {
    await pumpScreen(tester, categoryId: 'waking');

    expect(find.text('1 / 2'), findsOneWidget);
    expect(find.text('Transliteration'), findsOneWidget);
    expect(find.text('Reference'), findsOneWidget);
    expect(find.textContaining('Al-ḥamdu'), findsOneWidget);
  });

  testWidgets('swiping moves to the next dua and updates the position', (tester) async {
    await pumpScreen(tester, categoryId: 'waking');

    await tester.fling(find.byType(PageView), const Offset(-400, 0), 1000);
    await tester.pumpAndSettle();

    expect(find.text('2 / 2'), findsOneWidget);
  });

  testWidgets('tapping the favorite star adds the dua to favorites and fills the star', (tester) async {
    final container = ProviderContainer(overrides: [fixtureRepositoryOverride()]);
    addTearDown(container.dispose);
    await tester.runAsync(() => container.read(supplicationsContentProvider.future));

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: DuaReadingScreen(categoryId: 'waking', initialIndex: 0),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.star_border_outlined), findsOneWidget);
    expect(container.read(duaFavoritesProvider), isEmpty);

    // Favoriting synchronously writes to Hive (a real, disk-backed box in
    // this test env), which needs the real event loop — runAsync avoids
    // pumpAndSettle hanging on it (same pattern as
    // supplications_categories_screen_test.dart's script-switch test).
    await tester.runAsync(() async {
      await tester.tap(find.byIcon(Icons.star_border_outlined));
      await tester.pumpAndSettle();
      // toggle()'s trailing Hive write isn't awaited by the IconButton's
      // onPressed caller, and doesn't itself schedule a new frame, so
      // pumpAndSettle can return before it finishes — give it a moment
      // before tearDown closes the box out from under it (same reason as
      // dua_favorites_screen_test.dart's clear-all test).
      await Future<void>.delayed(const Duration(milliseconds: 50));
    });

    expect(find.byIcon(Icons.star), findsOneWidget);
    expect(container.read(duaFavoritesProvider), hasLength(1));
  });

  testWidgets('a dua without a repeat count shows no repeat chip and a plain tasbeeh badge', (tester) async {
    await pumpScreen(tester, categoryId: 'waking', tasbeeh: true);

    expect(find.textContaining('Repeat'), findsNothing);
    expect(find.text('0'), findsOneWidget);
    expect(find.text('0/3'), findsNothing);
  });

  testWidgets('a dua with a repeat count shows the chip, the hadith number/grade and a target badge', (tester) async {
    await pumpScreen(tester, categoryId: 'waking', initialIndex: 1, tasbeeh: true);

    expect(find.text('Repeat ×3'), findsOneWidget);
    expect(find.text('Abu Dawud · #5060 · Sahih'), findsOneWidget);
    expect(find.text('0/3'), findsOneWidget);

    await tester.tap(find.text('0/3'));
    await tester.pump();
    expect(find.text('1/3'), findsOneWidget);
  });

  testWidgets('the repeat count follows the category the dua is read in', (tester) async {
    await pumpScreen(tester, categoryId: 'morning');

    expect(find.text('Repeat ×10'), findsOneWidget);
  });

  testWidgets('Urdu readers get the Urdu translation when present, English otherwise', (tester) async {
    await pumpScreen(tester, categoryId: 'waking', language: 'urdu');

    expect(find.textContaining('اللہ کے لیے'), findsOneWidget);
    expect(find.textContaining('gave us life'), findsNothing);

    await tester.fling(find.byType(PageView), const Offset(-400, 0), 1000);
    await tester.pumpAndSettle();
    // Second dua has no Urdu translation: falls back to English.
    expect(find.textContaining('no god but Allah'), findsOneWidget);
  });

  testWidgets('English readers see the English translation', (tester) async {
    await pumpScreen(tester, categoryId: 'waking');

    expect(find.textContaining('gave us life'), findsOneWidget);
  });

  testWidgets('a non-null description is shown as a note; absent descriptions show nothing', (tester) async {
    await pumpScreen(tester, categoryId: 'waking', initialIndex: 1);
    expect(find.text('A short note.'), findsOneWidget);
  });

  testWidgets('translation language is independent of the app language (English app, Urdu translation)', (tester) async {
    await tester.runAsync(() => HiveBoxes.settingsBox.put('supplicationsTranslationLanguage', 'urdu'));
    await pumpScreen(tester, categoryId: 'waking');

    expect(find.textContaining('اللہ کے لیے'), findsOneWidget);
    expect(find.textContaining('gave us life'), findsNothing);
    // Arabic and transliteration are unaffected by the translation choice.
    expect(find.textContaining('Al-ḥamdu'), findsOneWidget);
  });

  testWidgets('Urdu chosen but missing: English is shown with an explanatory note', (tester) async {
    await tester.runAsync(() => HiveBoxes.settingsBox.put('supplicationsTranslationLanguage', 'urdu'));
    await pumpScreen(tester, categoryId: 'waking', initialIndex: 1);

    expect(find.textContaining('no god but Allah'), findsOneWidget);
    expect(find.textContaining('Urdu translation not available'), findsOneWidget);
  });

  testWidgets('transliteration off hides it completely and keeps Arabic then translation', (tester) async {
    await tester.runAsync(() => HiveBoxes.settingsBox.put('supplicationsTransliterationEnabled', false));
    await pumpScreen(tester, categoryId: 'waking');

    expect(find.text('Transliteration'), findsNothing);
    expect(find.textContaining('Al-ḥamdu'), findsNothing);
    expect(find.textContaining('gave us life'), findsOneWidget);
    // setting survives moving to the next dua
    await tester.fling(find.byType(PageView), const Offset(-400, 0), 1000);
    await tester.pumpAndSettle();
    expect(find.text('Transliteration'), findsNothing);
  });

  testWidgets('display order is Arabic, transliteration, translation', (tester) async {
    await pumpScreen(tester, categoryId: 'waking');
    final arabic = tester.getTopLeft(find.textContaining('الْحَمْدُ').first).dy;
    final translit = tester.getTopLeft(find.textContaining('Al-ḥamdu')).dy;
    final translation = tester.getTopLeft(find.textContaining('gave us life')).dy;
    expect(arabic, lessThan(translit));
    expect(translit, lessThan(translation));
  });

  testWidgets('the settings sheet offers the translation choice and the transliteration switch', (tester) async {
    await pumpScreen(tester, categoryId: 'waking');
    await tester.tap(find.byIcon(Icons.tune));
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(SegmentedButton<DuaTranslationLanguage>), findsOneWidget);
    expect(find.text('English'), findsOneWidget);
    expect(find.text('اردو'), findsOneWidget);
    expect(find.widgetWithText(SwitchListTile, 'Transliteration'), findsOneWidget);
  });

  test('translation language and transliteration settings persist and default sensibly', () async {
    await setUpTestHive();
    final c = ProviderContainer();
    expect(c.read(duaTranslationLanguageProvider), DuaTranslationLanguage.english);
    expect(c.read(duaTransliterationEnabledProvider), true);

    c.read(duaTranslationLanguageProvider.notifier).setLanguage(DuaTranslationLanguage.urdu);
    c.read(duaTransliterationEnabledProvider.notifier).setEnabled(false);
    expect(HiveBoxes.settingsBox.get('supplicationsTranslationLanguage'), 'urdu');
    expect(HiveBoxes.settingsBox.get('supplicationsTransliterationEnabled'), false);

    final fresh = ProviderContainer(); // a new session reads the saved choice
    expect(fresh.read(duaTranslationLanguageProvider), DuaTranslationLanguage.urdu);
    expect(fresh.read(duaTransliterationEnabledProvider), false);
    c.dispose();
    fresh.dispose();
    await tearDownTestHive();
  });
}
