import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';

/// Single storage abstraction across mobile and web. Hive's web
/// implementation is backed by IndexedDB, so this is the only place that
/// needs to know the native/web split — no feature code should call
/// path_provider or check kIsWeb directly.
class HiveBoxes {
  HiveBoxes._();

  static const surahBoxName = 'surah_cache';
  static const settingsBoxName = 'reader_settings';
  static const bookmarksBoxName = 'bookmarks';

  static bool _initialized = false;

  static Future<void> init() async {
    if (_initialized) return;

    if (kIsWeb) {
      await Hive.initFlutter();
    } else {
      final dir = await getApplicationDocumentsDirectory();
      Hive.init(dir.path);
    }

    await Future.wait([
      Hive.openBox<String>(surahBoxName),
      Hive.openBox(settingsBoxName),
      Hive.openBox<String>(bookmarksBoxName),
    ]);

    _initialized = true;
  }

  /// Cache: key `"surah_{n}"` -> JSON-encoded list of AyahModel cache
  /// entries (already-parsed Tajweed spans, so a cache hit never
  /// re-parses tagged text). Also holds the surah list under the fixed
  /// key `"surah_list"`. No Hive TypeAdapter/codegen needed — see
  /// SurahLocalDataSource.
  static Box<String> get surahBox => Hive.box<String>(surahBoxName);

  /// Reader preferences: theme mode, font size, show-translation toggle.
  static Box get settingsBox => Hive.box(settingsBoxName);

  /// Bookmarked ayat: key `"{surah}_{ayah}"` -> JSON-encoded Bookmark.
  static Box<String> get bookmarksBox => Hive.box<String>(bookmarksBoxName);
}
