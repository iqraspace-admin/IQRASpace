import 'package:quran_flutter/features/supplications/domain/entities/dua_favorite.dart';

abstract class DuaFavoritesRepository {
  List<DuaFavorite> getAll();
  bool isFavorited(String categoryId, int duaIndex);
  bool isFavoritedBySlug(String slug);
  Future<void> add(DuaFavorite favorite);
  Future<void> remove(String categoryId, int duaIndex);
  Future<void> removeBySlug(String slug);

  /// Replaces a legacy (slug-less) favorite with its slug-keyed form.
  Future<void> replace(DuaFavorite legacy, DuaFavorite migrated);
  Future<void> clearAll();
}
