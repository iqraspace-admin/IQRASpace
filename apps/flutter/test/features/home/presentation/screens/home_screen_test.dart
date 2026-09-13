import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/features/home/presentation/screens/home_screen.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/last_read.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

import '../../../../test_helpers/hive_test_env.dart';

/// Pumps [HomeScreen] under a plain [ProviderScope] — any "last read"
/// state a test wants must be seeded into Hive *before* this (see
/// [seedLastRead]), not mutated afterward: writing to Hive from inside a
/// running widget test (after the widget is already pumped) needs
/// `tester.runAsync` or it can hang `pumpAndSettle` waiting on real disk
/// I/O the fake-async test zone never lets complete. Reading Hive before
/// the first pump has no such issue — it's plain, non-widget-bound async
/// code.
Future<void> pumpHome(WidgetTester tester) async {
  await tester.pumpWidget(
    ProviderScope(
      child: MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: const HomeScreen(),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

/// Seeds the reading history, most-recent-first — matches
/// LastReadNotifier's own storage shape (a JSON array under
/// 'lastReadHistory'), so this is exactly what a fresh app launch would
/// read back after those surahs were read.
Future<void> seedLastRead(List<LastRead> history) {
  return HiveBoxes.settingsBox.put('lastReadHistory', jsonEncode(history.map((e) => e.toJson()).toList()));
}

void main() {
  setUp(setUpTestHive);
  tearDown(tearDownTestHive);

  testWidgets('shows the brand tagline', (tester) async {
    await pumpHome(tester);

    expect(find.text('Read. Listen. Learn. Reflect.'), findsOneWidget);
  });

  testWidgets('shows a "start reading" card when nothing has been read yet', (tester) async {
    await pumpHome(tester);

    expect(find.text('Begin with Al-Fatihah'), findsOneWidget);
    expect(find.textContaining('CONTINUE READING'), findsNothing);
  });

  testWidgets('shows the Continue Reading card once a surah has been read', (tester) async {
    // Real disk I/O (Hive) inside a testWidgets body has to go through
    // tester.runAsync — even before the first pump, this still runs
    // inside flutter_test's FakeAsync zone, and Hive's box lock uses a
    // real Future.delayed retry internally that FakeAsync's virtual
    // clock never advances, which hung this test for the full 10-minute
    // default timeout the one time it wasn't wrapped like this.
    await tester.runAsync(
      () => seedLastRead([
        LastRead(
          surahNumber: 2,
          ayahNumber: 142,
          surahEnglishName: 'Al-Baqarah',
          surahTotalAyahs: 286,
          updatedAt: DateTime.now(),
        ),
      ]),
    );

    await pumpHome(tester);

    expect(find.text('Al-Baqarah'), findsOneWidget);
    expect(find.text('Ayah 142 of 286'), findsOneWidget);
    expect(find.text('Begin with Al-Fatihah'), findsNothing);
  });

  testWidgets('shows a "Last Reads" row once more than one surah has been read', (tester) async {
    await tester.runAsync(
      () => seedLastRead([
        LastRead(
          surahNumber: 2,
          ayahNumber: 142,
          surahEnglishName: 'Al-Baqarah',
          surahTotalAyahs: 286,
          updatedAt: DateTime.now(),
        ),
        LastRead(
          surahNumber: 18,
          ayahNumber: 10,
          surahEnglishName: 'Al-Kahf',
          surahTotalAyahs: 110,
          updatedAt: DateTime.now(),
        ),
      ]),
    );

    await pumpHome(tester);

    expect(find.text('Last Reads'), findsOneWidget);
    // 'Al-Baqarah' appears twice: once in the Continue Reading hero card,
    // once in the Last Reads row (which lists the full history).
    expect(find.text('Al-Baqarah'), findsNWidgets(2));
    expect(find.text('Al-Kahf'), findsOneWidget);
  });

  testWidgets('does not show a "Last Reads" row for a single history entry', (tester) async {
    await tester.runAsync(
      () => seedLastRead([
        LastRead(
          surahNumber: 2,
          ayahNumber: 142,
          surahEnglishName: 'Al-Baqarah',
          surahTotalAyahs: 286,
          updatedAt: DateTime.now(),
        ),
      ]),
    );

    await pumpHome(tester);

    expect(find.text('Last Reads'), findsNothing);
  });

  testWidgets('shows the Quick Links row', (tester) async {
    await pumpHome(tester);

    expect(find.text('Quick Links'), findsOneWidget);
    expect(find.text('Search'), findsOneWidget);
    expect(find.text('Tajweed Rules'), findsOneWidget);
    expect(find.text('Reader Settings'), findsOneWidget);
  });

  testWidgets('shows an empty-bookmarks message when there are no bookmarks', (tester) async {
    await pumpHome(tester);

    expect(find.textContaining('No bookmarks yet'), findsOneWidget);
  });

  testWidgets('shows both the Read Quran and Learning entry tiles', (tester) async {
    await pumpHome(tester);

    expect(find.text('Read Quran'), findsOneWidget);
    expect(find.text('Learning'), findsOneWidget);
  });

  testWidgets('bottom nav highlights Home and lists all five destinations', (tester) async {
    await pumpHome(tester);

    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Quran'), findsOneWidget);
    expect(find.text('Learn'), findsOneWidget);
    // 'Bookmarks' also appears as this screen's own section header, so
    // there are two matches: the bottom-nav label plus that header.
    expect(find.text('Bookmarks'), findsNWidgets(2));
    expect(find.text('Settings'), findsOneWidget);
  });
}
