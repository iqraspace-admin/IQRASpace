/// The Supplications content source's own metadata — surfaced in the
/// feature's "About this content" info sheet rather than repeated on
/// every dua card (see SupplicationsInfoSheet).
class SupplicationsMeta {
  final String title;
  final String description;
  final List<String> languages;
  final int categoryCount;
  final int duaCount;
  final String sourcesNote;

  const SupplicationsMeta({
    required this.title,
    required this.description,
    required this.languages,
    required this.categoryCount,
    required this.duaCount,
    required this.sourcesNote,
  });
}
