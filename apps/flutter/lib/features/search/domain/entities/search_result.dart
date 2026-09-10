/// One match from Al Quran Cloud's /v1/search endpoint — searches
/// translation text (English, Sahih International) across the whole
/// Quran or one surah.
class SearchResult {
  final int surahNumber;
  final String surahEnglishName;
  final int numberInSurah;
  final String matchedText;

  const SearchResult({
    required this.surahNumber,
    required this.surahEnglishName,
    required this.numberInSurah,
    required this.matchedText,
  });
}
