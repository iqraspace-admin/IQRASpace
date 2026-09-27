import 'package:quran_flutter/features/bookmarks/data/datasources/bookmarks_local_datasource.dart';
import 'package:quran_flutter/features/bookmarks/data/models/bookmark_model.dart';
import 'package:quran_flutter/features/bookmarks/domain/entities/bookmark.dart';
import 'package:quran_flutter/features/bookmarks/domain/repositories/bookmarks_repository.dart';

class BookmarksRepositoryImpl implements BookmarksRepository {
  final BookmarksLocalDataSource local;

  const BookmarksRepositoryImpl(this.local);

  @override
  List<Bookmark> getAll() => local.getAll();

  @override
  bool isBookmarked(int surahNumber, int ayahNumber) =>
      local.isBookmarked(surahNumber, ayahNumber);

  @override
  Future<void> add(Bookmark bookmark) => local.add(BookmarkModel.from(bookmark));

  @override
  Future<void> remove(int surahNumber, int ayahNumber) =>
      local.remove(surahNumber, ayahNumber);
}
