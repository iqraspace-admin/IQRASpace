import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/core/constants/transliteration_script.dart';
import 'package:quran_flutter/features/supplications/domain/entities/dua.dart';

void main() {
  const dua = Dua(
    occasion: 'Upon waking',
    reference: 'Bukhari',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliterationLatin: 'Al-hamdu lillah',
    transliterationTelugu: 'అల్హమ్దు లిల్లాహ్',
    transliterationUrdu: 'الْحَمْدُ لِلَّهِ',
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
      expect(dua.transliterationFor(TransliterationScript.urdu), 'الْحَمْدُ لِلَّهِ');
    });
  });
}
