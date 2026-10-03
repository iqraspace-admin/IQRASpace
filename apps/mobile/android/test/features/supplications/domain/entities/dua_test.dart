import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/core/constants/transliteration_script.dart';
import 'package:quran_flutter/features/supplications/domain/entities/dua.dart';

void main() {
  const dua = Dua(
    slug: 'upon-waking',
    title: 'Upon waking',
    arabic: 'الْحَمْدُ لِلَّهِ',
    reference: 'Bukhari',
    transliterationLatin: 'Al-hamdu lillah',
    transliterationTelugu: 'అల్హమ్దు లిల్లాహ్',
    transliterationUrdu: 'الْحَمْدُ لِلَّهِ ٹ',
    translationEnglish: 'All praise is for Allah.',
  );

  group('Dua.transliterationFor', () {
    test('returns the Latin transliteration for TransliterationScript.latin', () {
      expect(dua.transliterationFor(TransliterationScript.latin), 'Al-hamdu lillah');
    });

    test('returns the Telugu transliteration for TransliterationScript.telugu', () {
      expect(dua.transliterationFor(TransliterationScript.telugu), 'అల్హమ్దు లిల్లాహ్');
    });

    test('returns the Urdu (Arabic-script) transliteration for TransliterationScript.urdu', () {
      expect(dua.transliterationFor(TransliterationScript.urdu), 'الْحَمْدُ لِلَّهِ ٹ');
    });

    test('falls back to Arabic (Urdu) and Latin (Telugu) when absent', () {
      const bare = Dua(slug: 's', title: 't', arabic: 'اللَّهُ', transliterationLatin: 'Allah');
      expect(bare.transliterationFor(TransliterationScript.urdu), 'اللَّهُ');
      expect(bare.transliterationFor(TransliterationScript.telugu), 'Allah');
    });
  });

  test('displayReference only shows hadith number/grade when present', () {
    expect(dua.displayReference, 'Bukhari');
    const graded = Dua(slug: 's', title: 't', arabic: 'ا', reference: 'Muslim', hadithNumber: '12', hadithGrade: 'sahih');
    expect(graded.displayReference, 'Muslim · #12 · Sahih');
  });
}
