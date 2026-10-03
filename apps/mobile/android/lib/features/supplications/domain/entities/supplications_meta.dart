/// The Supplications content source's own metadata — surfaced in the
/// feature's "About this content" info sheet rather than repeated on
/// every dua card (see SupplicationsInfoSheet). The text comes from the
/// bundled asset (the remote snapshot carries none); the counts are
/// computed from whichever content is active.
class SupplicationsMeta {
  final String title;
  final String description;
  final List<String> languages;
  final int categoryCount;
  final int duaCount;
  final String sourcesNote;
  final String? urduTitlesNote;
  final String? coverageNote;

  const SupplicationsMeta({
    required this.title,
    required this.description,
    required this.languages,
    required this.categoryCount,
    required this.duaCount,
    required this.sourcesNote,
    this.urduTitlesNote,
    this.coverageNote,
  });

  static const empty = SupplicationsMeta(
    title: 'Duas',
    description: '',
    languages: [],
    categoryCount: 0,
    duaCount: 0,
    sourcesNote: '',
  );

  SupplicationsMeta withCounts({required int categoryCount, required int duaCount}) => SupplicationsMeta(
        title: title,
        description: description,
        languages: languages,
        categoryCount: categoryCount,
        duaCount: duaCount,
        sourcesNote: sourcesNote,
        urduTitlesNote: urduTitlesNote,
        coverageNote: coverageNote,
      );
}
