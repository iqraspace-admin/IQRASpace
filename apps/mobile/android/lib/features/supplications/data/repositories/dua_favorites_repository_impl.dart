import 'package:quran_flutter/features/supplications/data/datasources/dua_favorites_local_datasource.dart';
import 'package:quran_flutter/features/supplications/data/models/dua_favorite_model.dart';
import 'package:quran_flutter/features/supplications/domain/entities/dua_favorite.dart';
import 'package:quran_flutter/features/supplications/domain/repositories/dua_favorites_repository.dart';

class DuaFavoritesRepositoryImpl implements DuaFavoritesRepository {
  final DuaFavoritesLocalDataSource local;

  const DuaFavoritesRepositoryImpl(this.local);

  @override
  List<DuaFavorite> getAll() => local.getAll();

  @override
  bool isFavorited(String categoryId, int duaIndex) => local.isFavorited(categoryId, duaIndex);

  @override
  bool isFavoritedBySlug(String slug) => local.isFavoritedBySlug(slug);

  @override
  Future<void> add(DuaFavorite favorite) => local.add(DuaFavoriteModel.from(favorite));

  @override
  Future<void> remove(String categoryId, int duaIndex) => local.remove(categoryId, duaIndex);

  @override
  Future<void> removeBySlug(String slug) => local.removeBySlug(slug);

  @override
  Future<void> replace(DuaFavorite legacy, DuaFavorite migrated) =>
      local.replace(DuaFavoriteModel.from(legacy), DuaFavoriteModel.from(migrated));

  @override
  Future<void> clearAll() => local.clearAll();
}
