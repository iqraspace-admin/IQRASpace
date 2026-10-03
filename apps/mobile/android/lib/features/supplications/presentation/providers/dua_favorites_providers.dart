import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/features/supplications/data/datasources/dua_favorites_local_datasource.dart';
import 'package:quran_flutter/features/supplications/data/repositories/dua_favorites_repository_impl.dart';
import 'package:quran_flutter/features/supplications/domain/entities/dua_favorite.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';
import 'package:quran_flutter/features/supplications/domain/repositories/dua_favorites_repository.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/utils/favorite_resolver.dart';

final duaFavoritesRepositoryProvider = Provider<DuaFavoritesRepository>((ref) {
  return DuaFavoritesRepositoryImpl(DuaFavoritesLocalDataSource(HiveBoxes.duasFavoritesBox));
});

/// Holds the current favorites list in memory so the reading screen's
/// per-dua star and the Favorites screen both update immediately on
/// add/remove, without re-reading Hive on every build — same pattern as
/// BookmarksNotifier/bookmarksProvider.
///
/// Favorites are identified by dua slug. Entries written by older app
/// versions (no slug, positional category + index) are migrated once,
/// through the BUNDLED content (whose categories keep the legacy order):
/// see [migrationDone].
class DuaFavoritesNotifier extends StateNotifier<List<DuaFavorite>> {
  final DuaFavoritesRepository _repository;

  /// Completes when legacy favorites have been migrated (immediately when
  /// there is nothing to migrate).
  late final Future<void> migrationDone;

  DuaFavoritesNotifier(this._repository, {Future<List<SupplicationCategory>> Function()? bundledCategories})
      : super(_repository.getAll()) {
    migrationDone = (bundledCategories == null || !state.any((f) => f.duaSlug == null))
        ? Future.value()
        : _migrateLegacy(bundledCategories);
  }

  Future<void> _migrateLegacy(Future<List<SupplicationCategory>> Function() bundledCategories) async {
    try {
      final categories = await bundledCategories();
      for (final legacy in state.where((f) => f.duaSlug == null).toList()) {
        SupplicationCategory? category;
        for (final c in categories) {
          if (c.id == legacy.categoryId) category = c;
        }
        final dua = category == null ? null : legacyDuaAt(category, legacy.duaIndex);
        if (dua == null) continue; // unresolvable: keep the entry untouched
        final migrated = legacy.withSlug(dua.slug);
        await _repository.replace(legacy, migrated);
        if (!mounted) return;
        final withoutLegacy = state.where((f) => !identical(f, legacy)).toList();
        state = withoutLegacy.any((f) => f.duaSlug == migrated.duaSlug)
            ? withoutLegacy
            : [...withoutLegacy, migrated]..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      }
    } catch (_) {
      // Bundled content unavailable: leave legacy entries as they are.
    }
  }

  /// Legacy positional lookup (slug-less entries only).
  bool isFavorited(String categoryId, int duaIndex) =>
      state.any((f) => f.duaSlug == null && f.categoryId == categoryId && f.duaIndex == duaIndex);

  bool isFavoritedSlug(String slug) => state.any((f) => f.duaSlug == slug);

  /// Updates [state] synchronously (so a tap's UI feedback — e.g. the
  /// reading screen's star icon — reflects immediately, before this
  /// method's `await` below ever yields) and only then persists to Hive
  /// in the background.
  Future<void> toggle(DuaFavorite favorite) async {
    final slug = favorite.duaSlug;
    if (slug != null) {
      if (isFavoritedSlug(slug)) {
        state = state.where((f) => f.duaSlug != slug).toList();
        await _repository.removeBySlug(slug);
      } else {
        state = [favorite, ...state];
        await _repository.add(favorite);
      }
      return;
    }
    if (isFavorited(favorite.categoryId, favorite.duaIndex)) {
      state = state
          .where((f) => !(f.duaSlug == null && f.categoryId == favorite.categoryId && f.duaIndex == favorite.duaIndex))
          .toList();
      await _repository.remove(favorite.categoryId, favorite.duaIndex);
    } else {
      state = [favorite, ...state];
      await _repository.add(favorite);
    }
  }

  Future<void> clearAll() async {
    state = const [];
    await _repository.clearAll();
  }
}

final duaFavoritesProvider = StateNotifierProvider<DuaFavoritesNotifier, List<DuaFavorite>>((ref) {
  final content = ref.read(supplicationsRepositoryProvider);
  return DuaFavoritesNotifier(
    ref.watch(duaFavoritesRepositoryProvider),
    bundledCategories: () async => (await content.loadBundled()).categories,
  );
});
