import 'package:quran_flutter/features/supplications/domain/entities/dua.dart';
import 'package:quran_flutter/features/supplications/domain/entities/dua_favorite.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';

/// The dua a LEGACY positional favorite (categoryId, duaIndex) pointed at.
/// Matches on `sortOrder == duaIndex` (the bundled asset keeps the legacy
/// index there); only when no dua in the category carries a sort order at
/// all does it fall back to the list position. `null` if unresolvable.
Dua? legacyDuaAt(SupplicationCategory category, int duaIndex) {
  if (category.duas.any((d) => d.sortOrder != null)) {
    for (final d in category.duas) {
      if (d.sortOrder == duaIndex) return d;
    }
    return null;
  }
  return duaIndex >= 0 && duaIndex < category.duas.length ? category.duas[duaIndex] : null;
}

/// Where a favorite lives in the current content.
typedef DuaLocation = ({String categoryId, int index});

/// Finds [favorite] in [categories]: by slug, preferring the category it
/// was recorded in, else the first category containing it. A legacy
/// (slug-less) favorite falls back to its positional category/index if
/// that still exists. `null` means "no longer available".
DuaLocation? resolveFavorite(DuaFavorite favorite, List<SupplicationCategory> categories) {
  final slug = favorite.duaSlug;
  if (slug == null) {
    for (final c in categories) {
      if (c.id != favorite.categoryId) continue;
      final dua = legacyDuaAt(c, favorite.duaIndex);
      if (dua != null) return (categoryId: c.id, index: c.duas.indexOf(dua));
    }
    return null;
  }
  DuaLocation? first;
  for (final c in categories) {
    final i = c.duas.indexWhere((d) => d.slug == slug);
    if (i < 0) continue;
    if (c.id == favorite.categoryId) return (categoryId: c.id, index: i);
    first ??= (categoryId: c.id, index: i);
  }
  return first;
}
