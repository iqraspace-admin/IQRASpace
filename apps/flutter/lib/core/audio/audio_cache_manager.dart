import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:path_provider/path_provider.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';

/// On-device cache for Listening Mode's whole-Surah audio files (Al-Afasy
/// recitation / Urdu translation — see `arabic_surah_audio.dart`,
/// `urdu_surah_audio.dart`). First play downloads from Cloudflare R2
/// and writes the file to disk; every later play of the same [key] reads
/// it straight back off disk with zero network calls. Native only — see
/// [resolve]'s `kIsWeb` branch; there's no persistent, app-writable
/// filesystem to cache into on web, matching the native/web split
/// `HiveBoxes` already centralizes for its own storage location.
///
/// Does not touch per-ayah playback (`playAyah`/`playSurahAyahs` in
/// `iqra_audio_handler.dart`) — those still stream directly from the
/// Quran API for Reading + Listening Mode's ayah-level sync.
class AudioCacheManager {
  AudioCacheManager._();

  static final Dio _dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 15),
      // Dio's receiveTimeout resets on every received data chunk — it
      // only fires if the connection genuinely stalls with no bytes
      // arriving for this long, not just because a large file takes a
      // while overall. That's the distinction that matters here: a
      // slow-but-progressing download on a poor connection should keep
      // going (and keep showing "loading" — see
      // `IqraAudioHandler._publishLoading`), while a truly stuck one
      // should surface as a failure instead of hanging indefinitely.
      receiveTimeout: const Duration(seconds: 20),
    ),
  );

  /// Resolves [key] (e.g. `"arabic_12"`) to a local file path, downloading
  /// [remoteUrl] first if it isn't cached yet. On web, returns [remoteUrl]
  /// unchanged — callers must not treat the result as a local path
  /// without first checking `kIsWeb` themselves (see
  /// `IqraAudioHandler._audioSourceFor`).
  static Future<String> resolve(String key, String remoteUrl) async {
    if (kIsWeb) return remoteUrl;

    final cachedPath = HiveBoxes.audioFileCacheBox.get(key);
    if (cachedPath != null && File(cachedPath).existsSync()) {
      return cachedPath;
    }

    final dir = await _cacheDir();
    final finalPath = '${dir.path}/$key.mp3';
    final partPath = '$finalPath.part';

    // Downloads to a `.part` path and only writes the Hive "completed"
    // entry after a successful rename — an interrupted/killed download
    // leaves at most a stray `.part` file, never a corrupt file marked as
    // cached. dio's `deleteOnError` (default true) also removes the
    // partial file itself on a network failure mid-download.
    await _dio.download(remoteUrl, partPath);
    final partFile = File(partPath);
    if (!await partFile.exists() || await partFile.length() == 0) {
      if (await partFile.exists()) await partFile.delete();
      throw StateError('Downloaded empty or missing file for $key');
    }
    await partFile.rename(finalPath);
    await HiveBoxes.audioFileCacheBox.put(key, finalPath);
    return finalPath;
  }

  static Future<Directory> _cacheDir() async {
    final support = await getApplicationSupportDirectory();
    final dir = Directory('${support.path}/audio_cache');
    if (!dir.existsSync()) {
      dir.createSync(recursive: true);
    }
    return dir;
  }

  /// Total bytes currently cached on disk — for a Settings "cache size"
  /// display alongside [clearCache].
  static Future<int> cacheSizeBytes() async {
    if (kIsWeb) return 0;
    final dir = await _cacheDir();
    if (!dir.existsSync()) return 0;
    var total = 0;
    for (final entity in dir.listSync()) {
      if (entity is File) total += await entity.length();
    }
    return total;
  }

  /// Deletes every cached audio file and forgets their metadata. Only
  /// ever touches audio bytes/metadata this class itself wrote — never
  /// Quran text, bookmarks, or settings (separate Hive boxes entirely).
  static Future<void> clearCache() async {
    if (kIsWeb) return;
    final dir = await _cacheDir();
    if (dir.existsSync()) {
      await dir.delete(recursive: true);
    }
    await HiveBoxes.audioFileCacheBox.clear();
  }
}
