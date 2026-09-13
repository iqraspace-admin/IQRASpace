import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/constants/surah_transliterations.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';

/// Shows a Surah's name as "Arabic  transliteration (in the current UI
/// language)" — per the app's Surah-name rule, always Arabic +
/// transliteration, never a meaning-based translation (e.g. "Al-Fatihah",
/// never "The Opening"). Used everywhere a Surah name is displayed:
/// Home, Surah list, Reader, Search, Bookmarks, Jump-to-Surah.
///
/// [arabicName] can be passed directly when the caller already has a
/// full `SurahSummary` (avoids an extra provider lookup); otherwise it's
/// resolved live via [surahByNumberProvider], so callers holding only a
/// denormalized `surahNumber` (bookmarks, last-reads, search hits) still
/// get the Arabic name without any Hive schema change.
class SurahNameLabel extends ConsumerWidget {
  final int surahNumber;
  final String? arabicName;
  final TextStyle? arabicStyle;
  final TextStyle? translitStyle;
  final TextOverflow? overflow;
  final int? maxLines;

  const SurahNameLabel({
    required this.surahNumber,
    this.arabicName,
    this.arabicStyle,
    this.translitStyle,
    this.overflow,
    this.maxLines,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final language = ref.watch(appLanguageProvider);
    final resolvedArabic = arabicName ?? ref.watch(surahByNumberProvider)[surahNumber]?.name;
    final transliteration = surahTransliterationFor(surahNumber, language);

    return Text.rich(
      TextSpan(
        children: [
          if (resolvedArabic != null) ...[
            TextSpan(
              text: resolvedArabic,
              style: (arabicStyle ?? const TextStyle()).copyWith(fontFamily: arabicStyle?.fontFamily ?? 'AmiriQuran'),
            ),
            const TextSpan(text: '  '),
          ],
          TextSpan(text: transliteration, style: translitStyle),
        ],
      ),
      overflow: overflow,
      maxLines: maxLines,
      // The Arabic segment is always RTL; the transliteration segment's
      // own direction (set per-span isn't supported by TextSpan, so the
      // paragraph direction below governs both) follows the current UI
      // language — Urdu's transliteration is itself Perso-Arabic script,
      // so it also reads RTL, while English/Telugu read LTR. Either way
      // this is independent of the Quran Arabic text's own fixed RTL
      // rendering elsewhere (see ayah_rich_text.dart).
      textDirection: language.textDirection,
    );
  }
}

/// Just the transliteration, no Arabic prefix — for inline sentence use
/// (e.g. Home's "Begin with Al-Fatihah" CTA) where a full Arabic+translit
/// block would read oddly mid-sentence.
String surahTransliterationLabel(WidgetRef ref, int surahNumber) {
  return surahTransliterationFor(surahNumber, ref.watch(appLanguageProvider));
}
