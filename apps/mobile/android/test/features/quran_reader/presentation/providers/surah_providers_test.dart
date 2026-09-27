import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/core/constants/translation_languages.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/last_read.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';

import '../../../../test_helpers/hive_test_env.dart';

void main() {
  setUp(setUpTestHive);
  tearDown(tearDownTestHive);

  group('translationLanguageProvider', () {
    test('defaults to off (translation hidden by default)', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(translationLanguageProvider), TranslationLanguage.off);
    });

    test('setLanguage updates state and persists across a fresh container', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(translationLanguageProvider.notifier).setLanguage(TranslationLanguage.romanUrdu);
      expect(container.read(translationLanguageProvider), TranslationLanguage.romanUrdu);

      // A brand-new container/notifier reads the persisted Hive value,
      // the same way a fresh app launch would.
      final reopened = ProviderContainer();
      addTearDown(reopened.dispose);
      expect(reopened.read(translationLanguageProvider), TranslationLanguage.romanUrdu);
    });
  });

  group('tajweedEnabledProvider', () {
    test('defaults to on', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(tajweedEnabledProvider), isTrue);
    });

    test('setEnabled(false) persists', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(tajweedEnabledProvider.notifier).setEnabled(false);

      final reopened = ProviderContainer();
      addTearDown(reopened.dispose);
      expect(reopened.read(tajweedEnabledProvider), isFalse);
    });
  });

  group('lastReadProvider', () {
    test('defaults to an empty history when nothing has been read yet', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(lastReadProvider), isEmpty);
    });

    test('update() persists and a fresh container reads it back', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(lastReadProvider.notifier).update(
            surahNumber: 2,
            ayahNumber: 142,
            surahEnglishName: 'Al-Baqara',
            surahTotalAyahs: 286,
          );

      final state = container.read(lastReadProvider);
      expect(state, hasLength(1));
      expect(state.first.surahNumber, 2);
      expect(state.first.ayahNumber, 142);
      expect(state.first.surahEnglishName, 'Al-Baqara');
      expect(state.first.surahTotalAyahs, 286);

      final reopened = ProviderContainer();
      addTearDown(reopened.dispose);
      final reopenedState = reopened.read(lastReadProvider);
      expect(reopenedState, hasLength(1));
      expect(reopenedState.first.surahNumber, 2);
      expect(reopenedState.first.ayahNumber, 142);
    });

    test('reading the same surah again moves it to the front instead of duplicating it', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final notifier = container.read(lastReadProvider.notifier);

      notifier.update(surahNumber: 2, ayahNumber: 10, surahEnglishName: 'Al-Baqara', surahTotalAyahs: 286);
      notifier.update(surahNumber: 18, ayahNumber: 5, surahEnglishName: 'Al-Kahf', surahTotalAyahs: 110);
      notifier.update(surahNumber: 2, ayahNumber: 200, surahEnglishName: 'Al-Baqara', surahTotalAyahs: 286);

      final state = container.read(lastReadProvider);
      expect(state, hasLength(2));
      expect(state.first.surahNumber, 2);
      expect(state.first.ayahNumber, 200);
      expect(state[1].surahNumber, 18);
    });

    test('a corrupt stored entry is treated as "nothing read yet" rather than crashing', () async {
      await HiveBoxes.settingsBox.put('lastReadHistory', 'not valid json{{{');

      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(lastReadProvider), isEmpty);
    });
  });

  group('LastRead JSON round-trip', () {
    test('toJson/fromJson round-trips every field', () {
      final original = LastRead(
        surahNumber: 18,
        ayahNumber: 10,
        surahEnglishName: 'Al-Kahf',
        surahTotalAyahs: 110,
        updatedAt: DateTime.utc(2026, 1, 2, 3, 4, 5),
      );

      final restored = LastRead.fromJson(original.toJson());

      expect(restored.surahNumber, original.surahNumber);
      expect(restored.ayahNumber, original.ayahNumber);
      expect(restored.surahEnglishName, original.surahEnglishName);
      expect(restored.surahTotalAyahs, original.surahTotalAyahs);
      expect(restored.updatedAt, original.updatedAt);
    });
  });
}
