import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:quran_flutter/features/search/data/datasources/search_remote_datasource.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio dio;
  late SearchRemoteDataSource dataSource;

  setUp(() {
    dio = MockDio();
    dataSource = SearchRemoteDataSource(dio);
  });

  test('parses matches from a successful search response', () async {
    when(() => dio.get(any())).thenAnswer(
      (_) async => Response(
        requestOptions: RequestOptions(path: ''),
        statusCode: 200,
        data: {
          'data': {
            'matches': [
              {
                'text': 'In the name of Allah, the Entirely Merciful.',
                'numberInSurah': 1,
                'surah': {'number': 1, 'englishName': 'Al-Faatiha'},
              },
            ],
          },
        },
      ),
    );

    final results = await dataSource.search('Allah');

    expect(results, hasLength(1));
    expect(results.single.surahNumber, 1);
    expect(results.single.surahEnglishName, 'Al-Faatiha');
    expect(results.single.numberInSurah, 1);
  });

  // Confirmed against the live API: a search with no matches returns an
  // actual HTTP 404 with `data` as a plain string, not `{matches: []}`.
  test('returns an empty list on a 404 (no matches), not an error', () async {
    when(() => dio.get(any())).thenThrow(
      DioException(
        requestOptions: RequestOptions(path: ''),
        response: Response(
          requestOptions: RequestOptions(path: ''),
          statusCode: 404,
          data: 'Nothing matching your search was found..',
        ),
      ),
    );

    final results = await dataSource.search('zzzzznomatch');

    expect(results, isEmpty);
  });

  test('rethrows non-404 errors instead of swallowing them', () async {
    when(() => dio.get(any())).thenThrow(
      DioException(
        requestOptions: RequestOptions(path: ''),
        response: Response(requestOptions: RequestOptions(path: ''), statusCode: 500),
      ),
    );

    expect(() => dataSource.search('x'), throwsA(isA<DioException>()));
  });
}
