import 'dart:convert';

import 'package:dio/dio.dart';

/// Where the public Duas content lives: the IqraSpace Learning API's
/// published-only feed (Cloudflare Worker + D1). Supplied at build time with
/// `--dart-define=DUAS_API_URL=https://iqraspace.org/learning/api`. The feed
/// is public and read-only — no key involved. If the URL is empty the remote
/// layer is disabled and the app is purely offline (cache/bundled).
class DuasRemoteConfig {
  final String url;

  const DuasRemoteConfig({required this.url});

  static const fromEnvironment = DuasRemoteConfig(
    url: String.fromEnvironment('DUAS_API_URL'),
  );

  bool get isEnabled => url.trim().isNotEmpty;
}

/// Thin HTTP client over the two public feed endpoints (plain dio).
/// Throws on any failure; the repository swallows it.
class SupplicationsRemoteDataSource {
  final Dio _dio;

  SupplicationsRemoteDataSource(this._dio);

  /// A dio configured for [config] with short timeouts.
  factory SupplicationsRemoteDataSource.create(DuasRemoteConfig config, {HttpClientAdapter? adapter}) {
    final base = config.url.trim().replaceAll(RegExp(r'/+$'), '');
    final dio = Dio(
      BaseOptions(
        baseUrl: '$base/duas/',
        connectTimeout: const Duration(seconds: 8),
        receiveTimeout: const Duration(seconds: 15),
        responseType: ResponseType.plain,
        headers: {'Accept': 'application/json'},
      ),
    );
    if (adapter != null) dio.httpClientAdapter = adapter;
    return SupplicationsRemoteDataSource(dio);
  }

  /// `GET /duas/version` — a JSON string that changes whenever the feed does.
  Future<String> fetchVersion() async {
    final decoded = await _get('version');
    if (decoded is! String || decoded.isEmpty) throw const FormatException('unexpected version payload');
    return decoded;
  }

  /// `GET /duas/content` — the full snapshot object (unvalidated).
  Future<Map<String, dynamic>> fetchContent() async {
    final decoded = await _get('content');
    if (decoded is! Map<String, dynamic>) throw const FormatException('unexpected content payload');
    return decoded;
  }

  Future<Object?> _get(String path) async {
    final response = await _dio.get<String>(path);
    final body = response.data;
    if (body == null) throw const FormatException('empty response');
    return jsonDecode(body);
  }
}
