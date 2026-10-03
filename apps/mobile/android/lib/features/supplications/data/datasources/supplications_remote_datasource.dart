import 'dart:convert';

import 'package:dio/dio.dart';

/// Where the public Duas content lives. Supplied at build time with
/// `--dart-define=DUAS_SUPABASE_URL=https://<ref>.supabase.co` and
/// `--dart-define=DUAS_SUPABASE_ANON_KEY=<anon key>`. The anon key is
/// public by design (it is gated by the database's RPC grants); never
/// put a service-role key here. If either value is empty the remote
/// layer is disabled and the app is purely offline (cache/bundled).
class DuasRemoteConfig {
  final String url;
  final String anonKey;

  const DuasRemoteConfig({required this.url, required this.anonKey});

  static const fromEnvironment = DuasRemoteConfig(
    url: String.fromEnvironment('DUAS_SUPABASE_URL'),
    anonKey: String.fromEnvironment('DUAS_SUPABASE_ANON_KEY'),
  );

  bool get isEnabled => url.trim().isNotEmpty && anonKey.trim().isNotEmpty;
}

/// Thin HTTP client over the two public Supabase RPCs (plain dio — no
/// supabase_flutter). Throws on any failure; the repository swallows it.
class SupplicationsRemoteDataSource {
  final Dio _dio;

  SupplicationsRemoteDataSource(this._dio);

  /// A dio configured for [config] with short timeouts and the anon-key
  /// headers.
  factory SupplicationsRemoteDataSource.create(DuasRemoteConfig config, {HttpClientAdapter? adapter}) {
    final base = config.url.trim().replaceAll(RegExp(r'/+$'), '');
    final dio = Dio(
      BaseOptions(
        baseUrl: '$base/rest/v1/rpc/',
        connectTimeout: const Duration(seconds: 8),
        receiveTimeout: const Duration(seconds: 15),
        responseType: ResponseType.plain,
        headers: {
          'apikey': config.anonKey,
          'Authorization': 'Bearer ${config.anonKey}',
          'Content-Type': 'application/json',
        },
      ),
    );
    if (adapter != null) dio.httpClientAdapter = adapter;
    return SupplicationsRemoteDataSource(dio);
  }

  /// `dua_content_version` — a JSON string (md5 hash).
  Future<String> fetchVersion() async {
    final decoded = await _post('dua_content_version');
    if (decoded is! String || decoded.isEmpty) throw const FormatException('unexpected version payload');
    return decoded;
  }

  /// `get_dua_content` — the full snapshot object (unvalidated).
  Future<Map<String, dynamic>> fetchContent() async {
    final decoded = await _post('get_dua_content');
    if (decoded is! Map<String, dynamic>) throw const FormatException('unexpected content payload');
    return decoded;
  }

  Future<Object?> _post(String rpc) async {
    final response = await _dio.post<String>(rpc, data: '{}');
    final body = response.data;
    if (body == null) throw const FormatException('empty response');
    return jsonDecode(body);
  }
}
