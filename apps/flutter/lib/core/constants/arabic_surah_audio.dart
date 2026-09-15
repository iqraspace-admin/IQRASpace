/// One playable segment of a Surah's Al-Afasy recitation audio. Almost
/// every Surah is exactly one part (a whole-Surah audio file). A
/// handful were split into several sequential parts as a one-time
/// workaround for a since-migrated storage backend's 50MiB per-object
/// limit (originally Supabase Storage; audio now lives on Cloudflare R2,
/// which has no such limit) — see
/// `apps/flutter/scripts/split-large-audio.mjs` and
/// `apps/flutter/AUDIO.md`. The already-split files are kept as-is
/// rather than re-merged now that the limit is gone, since re-splitting/
/// merging already-verified audio would be unnecessary rework. Splits
/// are cut at real silence in the recitation nearest the ideal
/// even-split point, never mid-word/mid-ayah, and
/// `IqraAudioHandler.playSurahLocal` plays a Surah's parts back through
/// one `ConcatenatingAudioSource` — gapless on Android — so this is
/// inaudible as anything but one continuous Surah; the Surah
/// boundaries/verified audio content itself is unchanged.
///
/// [duration] is known upfront (probed by the split script at
/// `durationMs` precision) for a split part; `null` for the ordinary
/// single-part case, where `IqraAudioHandler` instead learns it
/// reactively from `just_audio` once the file loads — either way,
/// `IqraAudioHandler` treats a `List<ArabicSurahAudioPart>` of any
/// length the same way.
class ArabicSurahAudioPart {
  final String url;
  final Duration? duration;
  const ArabicSurahAudioPart(this.url, this.duration);
}

const String _r2AudioBaseUrl = 'https://audio.iqraspace.org';

/// Surahs split into sequential parts by
/// `apps/flutter/scripts/split-large-audio.mjs` because the whole
/// recitation file exceeded Supabase Storage's old 50MiB free-tier
/// object limit (historical — audio is now hosted on Cloudflare R2,
/// which has no per-object size limit) — object names
/// `arabic/{NNN}_part{i}.mp3` (i = 1-based), and durations are exact
/// (ffprobe'd from each cut part, not estimated). Every other Surah
/// falls through to the ordinary single-URL, unknown-duration case in
/// [arabicSurahAudioParts].
final Map<int, List<ArabicSurahAudioPart>> _arabicSurahSplitParts = {
  4: const [
    ArabicSurahAudioPart('$_r2AudioBaseUrl/arabic/004_part1.mp3', Duration(milliseconds: 2433540)),
    ArabicSurahAudioPart('$_r2AudioBaseUrl/arabic/004_part2.mp3', Duration(milliseconds: 2363720)),
  ],
  5: const [
    ArabicSurahAudioPart('$_r2AudioBaseUrl/arabic/005_part1.mp3', Duration(milliseconds: 1893280)),
    ArabicSurahAudioPart('$_r2AudioBaseUrl/arabic/005_part2.mp3', Duration(milliseconds: 1888180)),
  ],
  6: const [
    ArabicSurahAudioPart('$_r2AudioBaseUrl/arabic/006_part1.mp3', Duration(milliseconds: 2181850)),
    ArabicSurahAudioPart('$_r2AudioBaseUrl/arabic/006_part2.mp3', Duration(milliseconds: 2168220)),
  ],
  7: const [
    ArabicSurahAudioPart('$_r2AudioBaseUrl/arabic/007_part1.mp3', Duration(milliseconds: 2489970)),
    ArabicSurahAudioPart('$_r2AudioBaseUrl/arabic/007_part2.mp3', Duration(milliseconds: 2482650)),
  ],
  9: const [
    ArabicSurahAudioPart('$_r2AudioBaseUrl/arabic/009_part1.mp3', Duration(milliseconds: 1812270)),
    ArabicSurahAudioPart('$_r2AudioBaseUrl/arabic/009_part2.mp3', Duration(milliseconds: 1812300)),
  ],
};

/// The Al-Afasy Surah-wise audio part(s) for [surahNumber] (1-114), in
/// playback order — almost always exactly one entry. Empty if nothing
/// has been uploaded yet for this Surah (Listening Mode's play button
/// simply no-ops for it until then).
List<ArabicSurahAudioPart> arabicSurahAudioParts(int surahNumber) {
  if (surahNumber < 1 || surahNumber > 114) return const [];
  final split = _arabicSurahSplitParts[surahNumber];
  if (split != null) return split;
  final padded = surahNumber.toString().padLeft(3, '0');
  return [ArabicSurahAudioPart('$_r2AudioBaseUrl/arabic/$padded.mp3', null)];
}
