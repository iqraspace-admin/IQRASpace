import 'package:quran_flutter/features/supplications/domain/entities/dua_favorite.dart';

class DuaFavoriteModel extends DuaFavorite {
  const DuaFavoriteModel({
    required super.categoryId,
    required super.duaIndex,
    required super.categoryLabel,
    required super.snippet,
    required super.createdAt,
    super.duaSlug,
  });

  factory DuaFavoriteModel.fromJson(Map<String, dynamic> json) => DuaFavoriteModel(
        duaSlug: json['duaSlug'] as String?,
        categoryId: json['categoryId'] as String,
        duaIndex: json['duaIndex'] as int,
        categoryLabel: json['categoryLabel'] as String,
        snippet: json['snippet'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  factory DuaFavoriteModel.from(DuaFavorite f) => DuaFavoriteModel(
        duaSlug: f.duaSlug,
        categoryId: f.categoryId,
        duaIndex: f.duaIndex,
        categoryLabel: f.categoryLabel,
        snippet: f.snippet,
        createdAt: f.createdAt,
      );

  Map<String, dynamic> toJson() => {
        if (duaSlug != null) 'duaSlug': duaSlug,
        'categoryId': categoryId,
        'duaIndex': duaIndex,
        'categoryLabel': categoryLabel,
        'snippet': snippet,
        'createdAt': createdAt.toIso8601String(),
      };
}
