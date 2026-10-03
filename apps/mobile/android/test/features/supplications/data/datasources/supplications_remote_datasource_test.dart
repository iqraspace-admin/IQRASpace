import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_remote_datasource.dart';

class _RecordingAdapter implements HttpClientAdapter {
  final requests = <RequestOptions>[];
  final Map<String, String> bodies;

  _RecordingAdapter(this.bodies);

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    final body = bodies[options.path.split('/').last];
    if (body == null) return ResponseBody.fromString('nope', 404);
    return ResponseBody.fromString(body, 200, headers: {
      Headers.contentTypeHeader: ['application/json'],
    });
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  const config = DuasRemoteConfig(url: 'https://abc.supabase.co/', anonKey: 'anon-key');

  test('config is disabled unless both URL and key are set', () {
    expect(const DuasRemoteConfig(url: '', anonKey: 'k').isEnabled, isFalse);
    expect(const DuasRemoteConfig(url: 'https://x', anonKey: ' ').isEnabled, isFalse);
    expect(config.isEnabled, isTrue);
    // No --dart-define in `flutter test`: remote is off by default.
    expect(DuasRemoteConfig.fromEnvironment.isEnabled, isFalse);
  });

  test('posts {} to the RPC endpoints with the anon-key headers and short timeouts', () async {
    final adapter = _RecordingAdapter({
      'dua_content_version': jsonEncode('abc123'),
      'get_dua_content': jsonEncode({'version': 'abc123', 'categories': []}),
    });
    final remote = SupplicationsRemoteDataSource.create(config, adapter: adapter);

    expect(await remote.fetchVersion(), 'abc123');
    expect((await remote.fetchContent())['version'], 'abc123');

    final req = adapter.requests.first;
    expect(req.method, 'POST');
    expect(req.uri.toString(), 'https://abc.supabase.co/rest/v1/rpc/dua_content_version');
    expect(req.headers['apikey'], 'anon-key');
    expect(req.headers['Authorization'], 'Bearer anon-key');
    expect(req.data, '{}');
    expect(req.connectTimeout, const Duration(seconds: 8));
    expect(req.receiveTimeout, const Duration(seconds: 15));
  });

  test('HTTP errors and unexpected payloads throw', () async {
    final adapter = _RecordingAdapter({'dua_content_version': '123', 'get_dua_content': '[]'});
    final remote = SupplicationsRemoteDataSource.create(config, adapter: adapter);

    await expectLater(remote.fetchVersion(), throwsA(anything)); // number, not a string
    await expectLater(remote.fetchContent(), throwsA(anything)); // array, not an object
    final missing = SupplicationsRemoteDataSource.create(config, adapter: _RecordingAdapter({}));
    await expectLater(missing.fetchVersion(), throwsA(isA<DioException>()));
  });
}
