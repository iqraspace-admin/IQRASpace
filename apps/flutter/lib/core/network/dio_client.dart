import 'package:dio/dio.dart';

/// Al Quran Cloud is public and needs no auth headers — unlike the Quran
/// Foundation *Content* API apps/quran uses (oauth2.quran.foundation),
/// which requires a confidential OAuth2 client secret this mobile/web
/// client can't safely hold. That's the deciding reason this app fetches
/// from api.alquran.cloud directly from the client instead of via a
/// server-side sync step.
Dio buildDioClient() {
  return Dio(
    BaseOptions(
      baseUrl: 'https://api.alquran.cloud/v1',
      // A combined-editions request (Tajweed + translation + audio URLs
      // for every ayah) is a large payload for a long surah like
      // Al-Baqarah — 10s was tight enough to read as a "connection
      // error" on a slow/mobile connection even though the request was
      // still in flight; see SurahRepositoryImpl's retry for the other
      // half of handling that gracefully.
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
    ),
  );
}

/// The older, public **Quran.com v4 API** (api.quran.com) — a separate
/// product from the Content API above, run by the same Quran Foundation,
/// and confirmed reachable with no API key or OAuth token for the
/// `resources/translations` and `quran/translations/{id}` endpoints this
/// app calls. Used only to fetch the Roman Urdu translation (resource id
/// 831, "Abul Ala Maududi (Roman Urdu)") — the one text apps/quran's own
/// generated content also ships — since Al Quran Cloud has no Roman
/// Urdu/Latin-script edition (only Urdu-script ones, e.g. `ur.maududi`,
/// which is a different script entirely, not a substitute).
Dio buildQuranComDioClient() {
  return Dio(
    BaseOptions(
      baseUrl: 'https://api.quran.com/api/v4',
      // Deliberately short and independent of the main client's timeout:
      // this is a "nice to have" supplementary translation
      // (SurahRemoteDataSource fetches it in parallel with the essential
      // Arabic text/English translation/audio call, and swallows any
      // failure) — it should fail fast rather than being the thing that
      // makes a surah feel slow or broken on a network that can't reach
      // this second host.
      connectTimeout: const Duration(seconds: 6),
      receiveTimeout: const Duration(seconds: 8),
    ),
  );
}
