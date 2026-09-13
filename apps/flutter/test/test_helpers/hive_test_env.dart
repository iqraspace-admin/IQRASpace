import 'dart:io';

import 'package:hive/hive.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';

/// Opens real (temp-directory-backed) Hive boxes for tests that touch a
/// provider reading `HiveBoxes.*` directly — every StateNotifier in
/// surah_providers.dart (theme, font size, translation language, Tajweed
/// toggle, last read, ...) isn't constructor-injected with a `Box` the
/// way BookmarksLocalDataSource is, so a real (throwaway) Hive instance
/// is the only seam available without changing production code.
///
/// Call from `setUp`; pair with [tearDownTestHive] in `tearDown` so each
/// test starts from empty boxes, not whatever the previous test left
/// behind.
Future<void> setUpTestHive() async {
  final dir = await Directory.systemTemp.createTemp('iqraspace_test_hive_');
  Hive.init(dir.path);
  await Hive.openBox<String>(HiveBoxes.surahBoxName);
  await Hive.openBox(HiveBoxes.settingsBoxName);
  await Hive.openBox<String>(HiveBoxes.bookmarksBoxName);
}

Future<void> tearDownTestHive() async {
  // Closes and deletes every open box + its backing file, so the next
  // setUpTestHive starts completely fresh.
  await Hive.deleteFromDisk();
}
