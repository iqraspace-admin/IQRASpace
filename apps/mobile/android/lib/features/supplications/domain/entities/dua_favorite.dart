/// A favorited dua. [duaSlug] is the stable identity (null only for
/// legacy entries written before slugs existed, which are migrated on
/// first content load — see DuaFavoritesNotifier). [categoryId] records
/// the category it was favorited from (for the label and for reopening
/// in the same category); [duaIndex] is the position at favorite-time,
/// informational once [duaSlug] is set. [snippet] is a short preview
/// captured at favorite-time, so the list stays readable even if the
/// dua is later removed from the content.
class DuaFavorite {
  final String? duaSlug;
  final String categoryId;
  final int duaIndex;
  final String categoryLabel;
  final String snippet;
  final DateTime createdAt;

  const DuaFavorite({
    required this.categoryId,
    required this.duaIndex,
    required this.categoryLabel,
    required this.snippet,
    required this.createdAt,
    this.duaSlug,
  });

  DuaFavorite withSlug(String slug) => DuaFavorite(
        duaSlug: slug,
        categoryId: categoryId,
        duaIndex: duaIndex,
        categoryLabel: categoryLabel,
        snippet: snippet,
        createdAt: createdAt,
      );
}
