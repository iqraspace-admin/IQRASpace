/// Per-Surah Urdu-translation recitation audio — one whole-Surah audio
/// file per entry (not per-ayah; see `resources/urdu-audio/` at the repo
/// root for how these are being prepared/reviewed). `null` today for
/// every Surah: the hosted URLs are supplied separately once that
/// pipeline finishes — fill in `_urduSurahAudioUrls` then (a plain
/// `{surahNumber: url}` map; no other code needs to change).
///
/// Used only by Listening Mode's "Recitation + Urdu Translation" track
/// (see `lib/core/constants/reader_mode.dart`'s `ListeningTrack`) —
/// played back-to-back *after* the Surah's Arabic ayahs, never mixed
/// into or replacing the Arabic recitation/Tajweed/translation text
/// itself.
const Map<int, String> _urduSurahAudioUrls = {};

/// The Urdu-translation audio URL for [surahNumber] (1-114), or `null`
/// if not yet available.
String? urduSurahAudioUrl(int surahNumber) => _urduSurahAudioUrls[surahNumber];
