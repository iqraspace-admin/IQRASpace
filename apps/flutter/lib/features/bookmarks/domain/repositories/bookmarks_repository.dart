import 'package:quran_flutter/features/bookmarks/domain/entities/bookmark.dart';

abstract class BookmarksRepository {
  List<Bookmark> getAll();
  bool isBookmarked(int surahNumber, int ayahNumber);
  Future<void> add(Bookmark bookmark);
  Future<void> remove(int surahNumber, int ayahNumber);
}
