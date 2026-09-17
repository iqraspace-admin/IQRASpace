/// One row of the 114-surah list (from GET /v1/surah) — just enough to
/// render a navigable list; the full ayah content is fetched separately,
/// per surah, on demand.
class SurahSummary {
  final int number;
  final String name;
  final String englishName;
  final String englishNameTranslation;
  final int numberOfAyahs;
  final String revelationType;

  const SurahSummary({
    required this.number,
    required this.name,
    required this.englishName,
    required this.englishNameTranslation,
    required this.numberOfAyahs,
    required this.revelationType,
  });
}
