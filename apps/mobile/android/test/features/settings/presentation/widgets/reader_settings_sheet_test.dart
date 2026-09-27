import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/core/constants/translation_languages.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/features/settings/presentation/widgets/reader_settings_sheet.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

import '../../../../test_helpers/hive_test_env.dart';

/// Opens the Reader Settings sheet in a test surface tall enough that
/// its whole (fairly long) content builds without needing to scroll —
/// the sheet's `DraggableScrollableSheet` sizes itself as a fraction of
/// the viewport, and `flutter_test`'s default 800x600 canvas leaves it
/// too short for a `ListView`'s off-screen rows to ever mount, which
/// made every `find.text(...)` below the fold fail even though the
/// widgets were really there (confirmed via debugDumpApp while
/// diagnosing this).
Future<void> pumpAndOpenSheet(WidgetTester tester) async {
  tester.view.physicalSize = const Size(390, 2800);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  await tester.pumpWidget(
    ProviderScope(
      child: MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: Builder(
          builder: (context) => Scaffold(
            body: Center(
              child: ElevatedButton(
                onPressed: () => showReaderSettingsSheet(context),
                child: const Text('Open Settings'),
              ),
            ),
          ),
        ),
      ),
    ),
  );

  await tester.tap(find.text('Open Settings'));
  await tester.pumpAndSettle();
}

void main() {
  setUp(setUpTestHive);
  tearDown(tearDownTestHive);

  testWidgets('shows every settings section', (tester) async {
    await pumpAndOpenSheet(tester);

    expect(find.text('Reading Settings'), findsOneWidget);
    expect(find.text('Theme'), findsOneWidget);
    expect(find.text('Arabic Font'), findsOneWidget);
    expect(find.text('Translation'), findsOneWidget);
    expect(find.text('Tajweed'), findsOneWidget);
    expect(find.text('Reciter'), findsOneWidget);
    expect(find.text('Reading Experience'), findsOneWidget);
    expect(find.text('Tajweed Rules'), findsOneWidget);
  });

  testWidgets('lists Off, English, and Roman Urdu translation options', (tester) async {
    await pumpAndOpenSheet(tester);

    // Translation language now lives in its own picker sheet, opened by
    // tapping the "Translation" nav row on the main sheet — see
    // translation_picker_sheet.dart.
    await tester.tap(find.text('Translation'));
    await tester.pumpAndSettle();

    // Scoped to the picker's RadioListTiles — the main sheet (still
    // mounted underneath this popup) also shows "Off" as the Translation
    // row's current-value summary, so a bare find.text('Off') matches
    // both.
    expect(find.widgetWithText(RadioListTile<TranslationLanguage>, 'Off'), findsOneWidget);
    expect(
      find.widgetWithText(RadioListTile<TranslationLanguage>, 'English (Sahih International)'),
      findsOneWidget,
    );
    expect(
      find.widgetWithText(RadioListTile<TranslationLanguage>, 'Roman Urdu (Abul Ala Maududi)'),
      findsOneWidget,
    );
  });

  testWidgets('selecting Roman Urdu persists translationLanguage=romanUrdu', (tester) async {
    await pumpAndOpenSheet(tester);
    expect(HiveBoxes.settingsBox.get('translationLanguage'), isNull);

    await tester.tap(find.text('Translation'));
    await tester.pumpAndSettle();

    // The tap synchronously calls into Hive (a real, disk-backed box in
    // this test env) — that write needs the real event loop, which the
    // widget-test fake-async zone won't advance on its own, so this goes
    // through tester.runAsync to avoid pumpAndSettle hanging on it.
    await tester.runAsync(() async {
      await tester.tap(find.text('Roman Urdu (Abul Ala Maududi)'));
      await tester.pumpAndSettle();
    });

    expect(HiveBoxes.settingsBox.get('translationLanguage'), 'romanUrdu');
  });

  testWidgets('toggling Tajweed coloring persists tajweedEnabled=false', (tester) async {
    await pumpAndOpenSheet(tester);
    expect(HiveBoxes.settingsBox.get('tajweedEnabled'), isNull);

    await tester.runAsync(() async {
      await tester.tap(find.text('Tajweed coloring'));
      await tester.pumpAndSettle();
    });

    expect(HiveBoxes.settingsBox.get('tajweedEnabled'), isFalse);
  });

  testWidgets('the close (X) button dismisses the sheet', (tester) async {
    await pumpAndOpenSheet(tester);
    expect(find.text('Reading Settings'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.close));
    await tester.pumpAndSettle();

    expect(find.text('Reading Settings'), findsNothing);
  });

  testWidgets('the Done button dismisses the sheet', (tester) async {
    await pumpAndOpenSheet(tester);

    // Done is the very last row — even the oversized test viewport
    // above doesn't fit the whole sheet, so drag the sheet's list until
    // Done actually mounts (a ListView's off-screen rows aren't in the
    // element tree at all until scrolled near).
    await tester.dragUntilVisible(
      find.text('Done'),
      find.byType(ListView),
      const Offset(0, -300),
    );
    await tester.tap(find.text('Done'));
    await tester.pumpAndSettle();

    expect(find.text('Reading Settings'), findsNothing);
  });

  testWidgets('tapping "Tajweed Rules" opens the Tajweed Rules reference screen', (tester) async {
    await pumpAndOpenSheet(tester);

    await tester.tap(find.text('Tajweed Rules'));
    await tester.pumpAndSettle();

    // A rule name unique to that screen confirms the navigation actually
    // happened, rather than relying on the (now possibly duplicated)
    // "Tajweed Rules" label.
    expect(find.text('Ghunnah'), findsOneWidget);
  });

  testWidgets('tapping "User Guide" opens the screenshot walkthrough', (tester) async {
    await pumpAndOpenSheet(tester);

    // "User Guide" sits well down the list, below the oversized test
    // viewport's initial layout reach — same off-screen-row situation as
    // the Done button test above.
    await tester.dragUntilVisible(
      find.text('User Guide'),
      find.byType(ListView),
      const Offset(0, -300),
    );
    await tester.tap(find.text('User Guide'));
    await tester.pumpAndSettle();

    // The guide's first topic title confirms the navigation actually
    // happened, rather than relying on the (now possibly duplicated)
    // "User Guide" label.
    expect(find.text('Skip'), findsOneWidget);
  });
}
