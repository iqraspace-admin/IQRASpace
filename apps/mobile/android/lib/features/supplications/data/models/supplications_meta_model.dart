import 'package:quran_flutter/features/supplications/domain/entities/supplications_meta.dart';

class SupplicationsMetaModel extends SupplicationsMeta {
  const SupplicationsMetaModel({
    required super.title,
    required super.description,
    required super.languages,
    required super.categoryCount,
    required super.duaCount,
    required super.sourcesNote,
    super.urduTitlesNote,
    super.coverageNote,
  });

  /// Lenient: the bundled asset's top-level `meta` object (no counts —
  /// those are computed from the active content). Missing text fields
  /// become empty.
  factory SupplicationsMetaModel.fromJson(Map<String, dynamic> json) {
    String? opt(String k) => json[k] is String && (json[k] as String).isNotEmpty ? json[k] as String : null;
    final langs = json['languages'];
    return SupplicationsMetaModel(
      title: opt('title') ?? 'Duas',
      description: opt('description') ?? '',
      languages: langs is List ? langs.whereType<String>().toList() : const [],
      categoryCount: 0,
      duaCount: 0,
      sourcesNote: opt('sources_note') ?? '',
      urduTitlesNote: opt('urdu_titles_note'),
      coverageNote: opt('coverage_note'),
    );
  }
}
