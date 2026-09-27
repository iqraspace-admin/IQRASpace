import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:quran_flutter/features/quran_reader/data/datasources/surah_local_datasource.dart';
import 'package:quran_flutter/features/quran_reader/data/datasources/surah_remote_datasource.dart';
import 'package:quran_flutter/features/quran_reader/data/models/ayah_model.dart';
import 'package:quran_flutter/features/quran_reader/data/models/surah_summary_model.dart';
import 'package:quran_flutter/features/quran_reader/data/repositories/surah_repository_impl.dart';

class MockRemoteDataSource extends Mock implements SurahRemoteDataSource {}

class MockLocalDataSource extends Mock implements SurahLocalDataSource {}

void main() {
  late MockRemoteDataSource remote;
  late MockLocalDataSource local;
  late SurahRepositoryImpl repository;

  const fakeAyahs = [
    AyahModel(numberInSurah: 1, plainText: 'بِسْمِ اللَّهِ', tajweedSpans: []),
  ];

  setUp(() {
    remote = MockRemoteDataSource();
    local = MockLocalDataSource();
    repository = SurahRepositoryImpl(remote: remote, local: local);
  });

  const reciter = 'ar.alafasy';

  test('returns cached ayahs and never calls the network on a cache hit', () async {
    when(() => local.getSurah(1, reciter)).thenReturn(fakeAyahs);

    final result = await repository.getSurah(1, reciterEdition: reciter);

    expect(result, fakeAyahs);
    verifyNever(() => remote.fetchSurah(any(), reciterEdition: any(named: 'reciterEdition')));
  });

  test('fetches from network and caches on a cache miss', () async {
    when(() => local.getSurah(1, reciter)).thenReturn(null);
    when(() => remote.fetchSurah(1, reciterEdition: reciter))
        .thenAnswer((_) async => fakeAyahs);
    when(() => local.cacheSurah(1, reciter, fakeAyahs)).thenAnswer((_) async {});

    final result = await repository.getSurah(1, reciterEdition: reciter);

    expect(result, fakeAyahs);
    verify(() => remote.fetchSurah(1, reciterEdition: reciter)).called(1);
    verify(() => local.cacheSurah(1, reciter, fakeAyahs)).called(1);
  });

  group('getSurahList', () {
    const fakeSurahs = [
      SurahSummaryModel(
        number: 1,
        name: 'سُورَةُ ٱلْفَاتِحَةِ',
        englishName: 'Al-Faatiha',
        englishNameTranslation: 'The Opening',
        numberOfAyahs: 7,
        revelationType: 'Meccan',
      ),
    ];

    test('returns cached list and never calls the network on a cache hit', () async {
      when(() => local.getSurahList()).thenReturn(fakeSurahs);

      final result = await repository.getSurahList();

      expect(result, fakeSurahs);
      verifyNever(() => remote.fetchSurahList());
    });

    test('fetches from network and caches on a cache miss', () async {
      when(() => local.getSurahList()).thenReturn(null);
      when(() => remote.fetchSurahList()).thenAnswer((_) async => fakeSurahs);
      when(() => local.cacheSurahList(fakeSurahs)).thenAnswer((_) async {});

      final result = await repository.getSurahList();

      expect(result, fakeSurahs);
      verify(() => remote.fetchSurahList()).called(1);
      verify(() => local.cacheSurahList(fakeSurahs)).called(1);
    });
  });
}
