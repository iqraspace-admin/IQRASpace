import 'dart:convert';

import 'package:hive/hive.dart';
import 'package:quran_flutter/features/supplications/data/models/dua_favorite_model.dart';

/// Favorites are local-only — no cloud sync. New entries are keyed by the
/// dua's stable slug (`"slug:{duaSlug}"`), so re-ordering or editing the
/// remote content cannot repoint them. Legacy entries (written before
/// slugs existed) keep their positional `"{categoryId}_{duaIndex}"` key
/// until DuaFavoritesNotifier migrates them via [replace].
class DuaFavoritesLocalDataSource {
  final Box<String> _box;

  DuaFavoritesLocalDataSource(this._box);

  static String _legacyKey(String categoryId, int duaIndex) => '${categoryId}_$duaIndex';
  static String _slugKey(String slug) => 'slug:$slug';
  static String _keyOf(DuaFavoriteModel f) =>
      f.duaSlug != null ? _slugKey(f.duaSlug!) : _legacyKey(f.categoryId, f.duaIndex);

  List<DuaFavoriteModel> getAll() {
    final result = <DuaFavoriteModel>[];
    for (final raw in _box.values) {
      try {
        result.add(DuaFavoriteModel.fromJson(jsonDecode(raw) as Map<String, dynamic>));
      } catch (_) {
        // Skip an unreadable entry rather than losing the whole list.
      }
    }
    return result..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  bool isFavorited(String categoryId, int duaIndex) {
    return _box.containsKey(_legacyKey(categoryId, duaIndex));
  }

  bool isFavoritedBySlug(String slug) => _box.containsKey(_slugKey(slug));

  Future<void> add(DuaFavoriteModel favorite) async {
    await _box.put(_keyOf(favorite), jsonEncode(favorite.toJson()));
  }

  Future<void> remove(String categoryId, int duaIndex) async {
    await _box.delete(_legacyKey(categoryId, duaIndex));
  }

  Future<void> removeBySlug(String slug) async {
    await _box.delete(_slugKey(slug));
  }

  /// Rewrites a legacy entry as its slug-keyed equivalent. If a slug-keyed
  /// entry for the same dua already exists it is kept and the legacy one
  /// is simply dropped (same dua, already favorited).
  Future<void> replace(DuaFavoriteModel legacy, DuaFavoriteModel migrated) async {
    final newKey = _keyOf(migrated);
    if (!_box.containsKey(newKey)) {
      await _box.put(newKey, jsonEncode(migrated.toJson()));
    }
    await _box.delete(_keyOf(legacy));
  }

  Future<void> clearAll() async {
    await _box.clear();
  }
}
