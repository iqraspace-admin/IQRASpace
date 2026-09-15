import 'package:quran_flutter/core/constants/arabic_surah_audio.dart' show arabicSurahAudioParts;

/// Per-Surah Urdu-translation recitation audio — one whole-Surah audio
/// file per entry (not per-ayah). Uploaded to the same Cloudflare R2
/// bucket as `arabic_surah_audio.dart`'s Al-Afasy recitation (see
/// `Resources/Urdu Audio (Surah-wise)` at the repo root and
/// `apps/flutter/scripts/upload-audio-to-r2.mjs`) — the URL is computed
/// the same predictable way, just under the `urdu/` prefix instead of
/// `arabic/`.
///
/// Used only by Listening Mode's "Recitation + Urdu Translation" track
/// (see `lib/core/constants/reader_mode.dart`'s `ListeningTrack`) —
/// played back-to-back *after* the Surah's Arabic ayahs, never mixed
/// into or replacing the Arabic recitation/Tajweed/translation text
/// itself.
const String _r2AudioBaseUrl = 'https://audio.iqraspace.org';

/// The Urdu-translation audio URL for [surahNumber] (1-114), or `null`
/// if out of range. Unlike [arabicSurahAudioParts], every Surah's Urdu
/// track is a single file — none ever needed splitting.
String? urduSurahAudioUrl(int surahNumber) {
  if (surahNumber < 1 || surahNumber > 114) return null;
  return '$_r2AudioBaseUrl/urdu/${surahNumber.toString().padLeft(3, '0')}.mp3';
}
