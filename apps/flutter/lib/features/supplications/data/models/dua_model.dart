import 'package:quran_flutter/features/supplications/domain/entities/dua.dart';

class DuaModel extends Dua {
  const DuaModel({
    required super.occasion,
    required super.reference,
    required super.arabic,
    required super.transliterationLatin,
    required super.transliterationTelugu,
    required super.transliterationUrdu,
    required super.translationEnglish,
  });

  factory DuaModel.fromJson(Map<String, dynamic> json) => DuaModel(
        occasion: json['occasion'] as String,
        reference: json['reference'] as String,
        arabic: json['arabic'] as String,
        transliterationLatin: json['transliteration_latin'] as String,
        transliterationTelugu: json['transliteration_telugu'] as String,
        transliterationUrdu: json['transliteration_urdu'] as String,
        translationEnglish: json['translation_english'] as String,
      );
}
