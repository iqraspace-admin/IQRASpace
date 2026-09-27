import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/core/constants/translation_languages.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/ayah.dart';

void main() {
  const ayah = Ayah(
    numberInSurah: 1,
    plainText: 'بِسْمِ اللَّهِ',
    tajweedSpans: [],
    translationTextEn: 'In the name of God, the Lord of Mercy, the Giver of Mercy!',
    translationTextRomanUrdu: 'Allah ke naam se jo Rehman o Raheem hai',
  );

  group('Ayah.translationFor', () {
    test('returns null for TranslationLanguage.off regardless of available text', () {
      expect(ayah.translationFor(TranslationLanguage.off), isNull);
    });

    test('returns the English text for TranslationLanguage.english', () {
      expect(
        ayah.translationFor(TranslationLanguage.english),
        'In the name of God, the Lord of Mercy, the Giver of Mercy!',
      );
    });

    test('returns the Roman Urdu text for TranslationLanguage.romanUrdu', () {
      expect(
        ayah.translationFor(TranslationLanguage.romanUrdu),
        'Allah ke naam se jo Rehman o Raheem hai',
      );
    });

    test('returns null when the requested language has no text', () {
      const partialAyah = Ayah(
        numberInSurah: 2,
        plainText: 'نص',
        tajweedSpans: [],
        translationTextEn: 'English only',
      );

      expect(partialAyah.translationFor(TranslationLanguage.romanUrdu), isNull);
      expect(partialAyah.translationFor(TranslationLanguage.english), 'English only');
    });
  });
}
