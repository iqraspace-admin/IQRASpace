import 'package:quran_flutter/features/supplications/data/models/dua_model.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';

String? _optStr(Object? v) => (v is String && v.trim().isNotEmpty) ? v : null;

class SupplicationCategoryModel extends SupplicationCategory {
  const SupplicationCategoryModel({
    required super.id,
    required super.label,
    required super.description,
    required super.duas,
    super.labelUrdu,
    super.labelTelugu,
    super.descriptionUrdu,
    super.descriptionTelugu,
  });

  /// Snapshot shape: `slug` becomes [id], `name` becomes [label]. Throws
  /// [FormatException] when slug/name are missing or the category has no
  /// duas (the snapshot validation rules).
  factory SupplicationCategoryModel.fromJson(Map<String, dynamic> json) {
    final slug = _optStr(json['slug']);
    final name = _optStr(json['name']);
    final duas = json['duas'];
    if (slug == null || name == null) {
      throw const FormatException('category missing "slug"/"name"');
    }
    if (duas is! List || duas.isEmpty) {
      throw FormatException('category "$slug" has no duas');
    }
    return SupplicationCategoryModel(
      id: slug,
      label: name,
      description: _optStr(json['description']) ?? '',
      duas: duas.map((e) {
        if (e is! Map<String, dynamic>) throw FormatException('category "$slug" has a non-object dua');
        return DuaModel.fromJson(e);
      }).toList(),
      labelUrdu: _optStr(json['name_ur']),
      labelTelugu: _optStr(json['name_te']),
      descriptionUrdu: _optStr(json['description_ur']),
      descriptionTelugu: _optStr(json['description_te']),
    );
  }
}
