import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/constants/dua_translation_language.dart';
import 'package:quran_flutter/core/constants/transliteration_script.dart';
import 'package:quran_flutter/features/supplications/data/models/duas_snapshot.dart';

import '../../test_support.dart';

Map<String, dynamic> withFirstDua(void Function(Map<String, dynamic> dua) change) {
  final json = fixtureJson();
  final dua = ((json['categories'] as List).first['duas'] as List).first as Map<String, dynamic>;
  change(dua);
  return json;
}

void main() {
  group('parsing the snapshot fixture', () {
    final snapshot = DuasSnapshot.parse(fixtureJson());

    test('maps slug/name to id/label and keeps order', () {
      expect(snapshot.version, 'fixture-v1');
      expect(snapshot.categories.map((c) => c.id), ['waking', 'morning', 'brand-new-category']);
      expect(snapshot.categories.first.label, 'Waking up');
      expect(snapshot.categories.first.labelUrdu, isNotNull);
      expect(snapshot.categories.first.labelTelugu, isNull);
    });

    test('reads every dua field, tolerating nulls and unknown fields', () {
      final duas = snapshot.categories.first.duas;
      expect(duas.first.slug, 'dua-upon-waking');
      expect(duas.first.repeatCount, isNull);
      expect(duas.first.transliterationUrdu, isNull);
      expect(duas.first.translationUrdu, isNotNull);

      final second = duas[1];
      expect(second.repeatCount, 3);
      expect(second.hadithNumber, '5060');
      expect(second.hadithGrade, 'sahih');
      expect(second.quranRefs.single.surah, 2);
      expect(second.quranRefs.single.ayahTo, 255);
      expect(second.audioUrl, 'https://example.com/a.mp3');
      expect(second.displayReference, 'Abu Dawud · #5060 · Sahih');
    });

    test('same slug may appear in several categories with per-category overrides', () {
      final waking = snapshot.categories[0].duas[1];
      final morning = snapshot.categories[1].duas.single;
      expect(waking.slug, morning.slug);
      expect(waking.repeatCount, 3);
      expect(morning.repeatCount, 10);
    });

    test('display fallbacks: Urdu-script transliteration -> Arabic, Telugu -> Latin', () {
      final dua = snapshot.categories.first.duas[1];
      expect(dua.transliterationFor(TransliterationScript.urdu), dua.arabic);
      expect(dua.transliterationFor(TransliterationScript.telugu), dua.transliterationLatin);
    });

    test('Urdu translation only for Urdu readers when present; title falls back', () {
      final first = snapshot.categories.first.duas.first;
      final second = snapshot.categories.first.duas[1];
      expect(first.translationFor(DuaTranslationLanguage.urdu), first.translationUrdu);
      expect(first.translationFor(DuaTranslationLanguage.english), first.translationEnglish);
      expect(second.translationFor(DuaTranslationLanguage.urdu), second.translationEnglish);
      expect(first.occasionFor(AppLanguage.urdu), first.titleUrdu);
      expect(second.occasionFor(AppLanguage.urdu), second.title);
    });
  });

  group('validation rejects bad snapshots', () {
    test('not an object / no categories / empty categories', () {
      expect(() => DuasSnapshot.parse('x'), throwsFormatException);
      expect(() => DuasSnapshot.parse(<String, dynamic>{}), throwsFormatException);
      expect(() => DuasSnapshot.parse({'categories': []}), throwsFormatException);
      expect(() => DuasSnapshot.parse({'categories': 'nope'}), throwsFormatException);
    });

    test('a category without duas', () {
      final json = fixtureJson();
      ((json['categories'] as List).first as Map<String, dynamic>)['duas'] = [];
      expect(() => DuasSnapshot.parse(json), throwsFormatException);
    });

    test('a category without slug (old/unknown shape)', () {
      final json = fixtureJson();
      ((json['categories'] as List).first as Map<String, dynamic>).remove('slug');
      expect(() => DuasSnapshot.parse(json), throwsFormatException);
    });

    test('a dua with empty slug / title / arabic', () {
      for (final key in ['slug', 'title', 'arabic']) {
        final json = withFirstDua((d) => d[key] = '  ');
        expect(() => DuasSnapshot.parse(json), throwsFormatException, reason: key);
      }
    });

    test('Arabic field without Arabic-script characters', () {
      final json = withFirstDua((d) => d['arabic'] = 'All praise is for Allah');
      expect(() => DuasSnapshot.parse(json), throwsFormatException);
    });

    test('wrongly typed fields do not escape as TypeErrors', () {
      final json = withFirstDua((d) => d['title'] = 42);
      expect(() => DuasSnapshot.parse(json), throwsFormatException);
    });
  });
}
