import 'dart:convert';

import 'package:hive/hive.dart';
import 'package:quran_flutter/features/bookmarks/data/models/bookmark_model.dart';

/// Bookmarks are local-only in this pass — no cloud sync — keyed
/// `"{surah}_{ayah}"` so add/remove/lookup for a given ayah is O(1).
class BookmarksLocalDataSource {
  final Box<String> _box;

  BookmarksLocalDataSource(this._box);

  static String _keyFor(int surahNumber, int ayahNumber) => '${surahNumber}_$ayahNumber';

  List<BookmarkModel> getAll() {
    return _box.values
        .map((raw) => BookmarkModel.fromJson(jsonDecode(raw) as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  bool isBookmarked(int surahNumber, int ayahNumber) {
    return _box.containsKey(_keyFor(surahNumber, ayahNumber));
  }

  Future<void> add(BookmarkModel bookmark) async {
    await _box.put(
      _keyFor(bookmark.surahNumber, bookmark.ayahNumber),
      jsonEncode(bookmark.toJson()),
    );
  }

  Future<void> remove(int surahNumber, int ayahNumber) async {
    await _box.delete(_keyFor(surahNumber, ayahNumber));
  }
}
