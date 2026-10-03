import 'package:quran_flutter/features/supplications/domain/entities/dua.dart';

final _arabicScript = RegExp('[؀-ۿ]');

String? _optStr(Object? v) {
  if (v is! String) return null;
  return v.trim().isEmpty ? null : v;
}

String _reqStr(Map<String, dynamic> json, String key) {
  final v = json[key];
  if (v is! String || v.trim().isEmpty) {
    throw FormatException('dua field "$key" missing or empty');
  }
  return v;
}

class DuaModel extends Dua {
  const DuaModel({
    required super.slug,
    required super.title,
    required super.arabic,
    super.titleUrdu,
    super.transliterationLatin,
    super.transliterationTelugu,
    super.transliterationUrdu,
    super.translationEnglish,
    super.translationUrdu,
    super.description,
    super.repeatCount,
    super.sourceType,
    super.sourceCollection,
    super.reference,
    super.hadithNumber,
    super.hadithGrade,
    super.quranRefs,
    super.audioUrl,
    super.sortOrder,
  });

  /// Strict about slug/title/arabic (non-empty, Arabic script) — the
  /// snapshot validation rule — and lenient about everything else:
  /// nullable fields may be null/absent and unknown keys are ignored.
  factory DuaModel.fromJson(Map<String, dynamic> json) {
    final arabic = _reqStr(json, 'arabic');
    if (!_arabicScript.hasMatch(arabic)) {
      throw const FormatException('dua "arabic" contains no Arabic-script characters');
    }
    final repeat = json['repeat_count'];
    final refs = json['quran_refs'];
    return DuaModel(
      slug: _reqStr(json, 'slug'),
      title: _reqStr(json, 'title'),
      arabic: arabic,
      titleUrdu: _optStr(json['title_ur']),
      transliterationLatin: _optStr(json['transliteration_latin']) ?? '',
      transliterationTelugu: _optStr(json['transliteration_telugu']),
      transliterationUrdu: _optStr(json['transliteration_urdu']),
      translationEnglish: _optStr(json['translation_en']) ?? '',
      translationUrdu: _optStr(json['translation_ur']),
      description: _optStr(json['description']),
      repeatCount: repeat is num && repeat > 0 ? repeat.toInt() : null,
      sourceType: _optStr(json['source_type']) ?? 'other',
      sourceCollection: _optStr(json['source_collection']),
      reference: _optStr(json['reference']) ?? '',
      hadithNumber: _optStr(json['hadith_number']),
      hadithGrade: _optStr(json['hadith_grade']),
      quranRefs: [
        if (refs is List)
          for (final r in refs)
            if (r is Map && r['surah'] is num && r['ayah_from'] is num)
              QuranRef(
                surah: (r['surah'] as num).toInt(),
                ayahFrom: (r['ayah_from'] as num).toInt(),
                ayahTo: ((r['ayah_to'] ?? r['ayah_from']) as num).toInt(),
              ),
      ],
      audioUrl: _optStr(json['audio_url']),
      sortOrder: json['sort_order'] is num ? (json['sort_order'] as num).toInt() : null,
    );
  }
}
