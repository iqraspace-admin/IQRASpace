import 'package:quran_flutter/features/bookmarks/domain/entities/bookmark.dart';

class BookmarkModel extends Bookmark {
  const BookmarkModel({
    required super.surahNumber,
    required super.ayahNumber,
    required super.surahEnglishName,
    required super.snippet,
    required super.createdAt,
  });

  factory BookmarkModel.fromJson(Map<String, dynamic> json) => BookmarkModel(
        surahNumber: json['surahNumber'] as int,
        ayahNumber: json['ayahNumber'] as int,
        surahEnglishName: json['surahEnglishName'] as String,
        snippet: json['snippet'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  factory BookmarkModel.from(Bookmark b) => BookmarkModel(
        surahNumber: b.surahNumber,
        ayahNumber: b.ayahNumber,
        surahEnglishName: b.surahEnglishName,
        snippet: b.snippet,
        createdAt: b.createdAt,
      );

  Map<String, dynamic> toJson() => {
        'surahNumber': surahNumber,
        'ayahNumber': ayahNumber,
        'surahEnglishName': surahEnglishName,
        'snippet': snippet,
        'createdAt': createdAt.toIso8601String(),
      };
}
