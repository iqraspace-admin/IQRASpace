import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/features/bookmarks/data/datasources/bookmarks_local_datasource.dart';
import 'package:quran_flutter/features/bookmarks/data/repositories/bookmarks_repository_impl.dart';
import 'package:quran_flutter/features/bookmarks/domain/entities/bookmark.dart';
import 'package:quran_flutter/features/bookmarks/domain/repositories/bookmarks_repository.dart';

final bookmarksRepositoryProvider = Provider<BookmarksRepository>((ref) {
  return BookmarksRepositoryImpl(BookmarksLocalDataSource(HiveBoxes.bookmarksBox));
});

/// Holds the current bookmark list in memory so the reader's per-ayah
/// star icon and the Bookmarks screen both update immediately on
/// add/remove, without re-reading Hive on every build.
class BookmarksNotifier extends StateNotifier<List<Bookmark>> {
  final BookmarksRepository _repository;

  BookmarksNotifier(this._repository) : super(_repository.getAll());

  bool isBookmarked(int surahNumber, int ayahNumber) =>
      state.any((b) => b.surahNumber == surahNumber && b.ayahNumber == ayahNumber);

  Future<void> toggle(Bookmark bookmark) async {
    if (isBookmarked(bookmark.surahNumber, bookmark.ayahNumber)) {
      await _repository.remove(bookmark.surahNumber, bookmark.ayahNumber);
    } else {
      await _repository.add(bookmark);
    }
    state = _repository.getAll();
  }
}

final bookmarksProvider = StateNotifierProvider<BookmarksNotifier, List<Bookmark>>((ref) {
  return BookmarksNotifier(ref.watch(bookmarksRepositoryProvider));
});
