import 'package:quran_flutter/features/supplications/data/models/dua_model.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';

class SupplicationCategoryModel extends SupplicationCategory {
  const SupplicationCategoryModel({
    required super.id,
    required super.label,
    required super.description,
    required super.duas,
  });

  factory SupplicationCategoryModel.fromJson(Map<String, dynamic> json) => SupplicationCategoryModel(
        id: json['id'] as String,
        label: json['label'] as String,
        description: json['description'] as String,
        duas: (json['duas'] as List)
            .map((e) => DuaModel.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
