/// A bookmarked ayah. [snippet] is a short preview of the ayah's
/// translation (or Arabic, if translation wasn't available) captured at
/// bookmark time, so the bookmarks list is readable without refetching.
class Bookmark {
  final int surahNumber;
  final int ayahNumber;
  final String surahEnglishName;
  final String snippet;
  final DateTime createdAt;

  const Bookmark({
    required this.surahNumber,
    required this.ayahNumber,
    required this.surahEnglishName,
    required this.snippet,
    required this.createdAt,
  });
}
