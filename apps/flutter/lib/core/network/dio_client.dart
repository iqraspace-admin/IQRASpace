import 'package:dio/dio.dart';

/// Al Quran Cloud is public and needs no auth headers — unlike the Quran
/// Foundation Content API apps/quran uses, which requires a confidential
/// OAuth2 client secret this mobile/web client can't safely hold. That's
/// the deciding reason this app fetches from api.alquran.cloud directly
/// from the client instead of via a server-side sync step.
Dio buildDioClient() {
  return Dio(
    BaseOptions(
      baseUrl: 'https://api.alquran.cloud/v1',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ),
  );
}
