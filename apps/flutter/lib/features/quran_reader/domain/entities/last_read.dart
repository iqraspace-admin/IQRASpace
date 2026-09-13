/// Where the reader last left off — shown as the Home screen's "Continue
/// Reading" card. Updated by SurahReaderScreen as the reader scrolls, and
/// persisted so it survives an app restart.
class LastRead {
  final int surahNumber;
  final int ayahNumber;
  final String surahEnglishName;
  final int surahTotalAyahs;
  final DateTime updatedAt;

  const LastRead({
    required this.surahNumber,
    required this.ayahNumber,
    required this.surahEnglishName,
    required this.surahTotalAyahs,
    required this.updatedAt,
  });

  factory LastRead.fromJson(Map<String, dynamic> json) => LastRead(
        surahNumber: json['surahNumber'] as int,
        ayahNumber: json['ayahNumber'] as int,
        surahEnglishName: json['surahEnglishName'] as String,
        surahTotalAyahs: json['surahTotalAyahs'] as int,
        updatedAt: DateTime.parse(json['updatedAt'] as String),
      );

  Map<String, dynamic> toJson() => {
        'surahNumber': surahNumber,
        'ayahNumber': ayahNumber,
        'surahEnglishName': surahEnglishName,
        'surahTotalAyahs': surahTotalAyahs,
        'updatedAt': updatedAt.toIso8601String(),
      };
}
