import 'package:quran_flutter/features/supplications/domain/entities/supplications_meta.dart';

class SupplicationsMetaModel extends SupplicationsMeta {
  const SupplicationsMetaModel({
    required super.title,
    required super.description,
    required super.languages,
    required super.categoryCount,
    required super.duaCount,
    required super.sourcesNote,
  });

  factory SupplicationsMetaModel.fromJson(Map<String, dynamic> json) => SupplicationsMetaModel(
        title: json['title'] as String,
        description: json['description'] as String,
        languages: (json['languages'] as List).cast<String>(),
        categoryCount: json['category_count'] as int,
        duaCount: json['dua_count'] as int,
        sourcesNote: json['sources_note'] as String,
      );
}
