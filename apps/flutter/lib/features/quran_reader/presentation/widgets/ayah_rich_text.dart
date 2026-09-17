import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/theme/tajweed_rule_colors.dart';
import 'package:quran_flutter/core/constants/reader_mode.dart';
import 'package:quran_flutter/core/constants/translation_languages.dart';
import 'package:quran_flutter/features/bookmarks/domain/entities/bookmark.dart';
import 'package:quran_flutter/features/bookmarks/presentation/providers/bookmarks_providers.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/ayah.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/audio_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Font families that bake their own color into the glyph itself
/// (COLR/CPAL). Applying our own per-span Tajweed TextStyle color on top
/// of one of these produces a visually inconsistent result — the font's
/// baked color layers don't uniformly respect an overriding text color,
/// so some glyphs show the font's color and others show ours. Root cause
/// of an earlier "colors look mixed up" report; see arabic_fonts.dart's
/// caveat text for the user-facing explanation.
const _preColoredFontFamilies = {'AmiriQuranColored'};

/// Renders one ayah: Tajweed-colored Arabic, an optional translation
/// line, and per-ayah audio-play / bookmark controls.
///
/// In Read Mode (readModeProvider), all of that ayah-level chrome is
/// skipped — only the colored Arabic text renders, for a plain,
/// distraction-free reading view.
///
/// Building the colored TextSpan list is O(spans) — no regex/parsing
/// happens here, that already ran once at fetch time (see
/// TajweedParser).
class AyahRichText extends ConsumerWidget {
  final Ayah ayah;
  final int surahNumber;
  final String surahEnglishName;

  const AyahRichText({
    required this.ayah,
    required this.surahNumber,
    required this.surahEnglishName,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fontSize = ref.watch(fontSizeProvider);
    final fontFamily = ref.watch(arabicFontFamilyProvider);
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final readMode = ref.watch(readModeProvider);
    final translationLanguage = ref.watch(translationLanguageProvider);
    final showBookmarkIcon = !readMode && ref.watch(showBookmarkIconsProvider);
    final tajweedEnabled = ref.watch(tajweedEnabledProvider);

    final useOwnTajweedColors = tajweedEnabled && !_preColoredFontFamilies.contains(fontFamily);
    final translationText = ayah.translationFor(translationLanguage);
    final showTranslation = !readMode && translationLanguage != TranslationLanguage.off;

    final arabicText = RichText(
      textAlign: TextAlign.justify,
      textDirection: TextDirection.rtl,
      text: TextSpan(
        style: TextStyle(
          fontFamily: fontFamily,
          fontSize: fontSize,
          height: 2.0,
          color: colors.textColor,
        ),
        children: [
          for (final span in ayah.tajweedSpans)
            TextSpan(
              text: span.text,
              style: span.ruleKey != null && useOwnTajweedColors
                  ? TextStyle(color: colorForTajweedCode(span.ruleKey))
                  : null,
            ),
          TextSpan(text: '  ﴿${ayah.numberInSurah}﴾  '),
        ],
      ),
    );

    if (readMode) return arabicText;

    final audioState = ref.watch(audioControllerProvider);
    final readerMode = ref.watch(readerModeProvider);
    final isBookmarked = ref.watch(
      bookmarksProvider.select(
        (bookmarks) => bookmarks.any(
          (b) => b.surahNumber == surahNumber && b.ayahNumber == ayah.numberInSurah,
        ),
      ),
    );
    final isActive = audioState.isActive(surahNumber, ayah.numberInSurah);
    final isActiveAndPlaying = isActive && audioState.isPlaying;
    final mutedColor = colors.textColor.withValues(alpha: 0.6);
    final l10n = AppLocalizations.of(context)!;
    // Reading Mode has no audio at all (per spec) — no per-ayah play
    // control at all, matching the AppBar's whole-surah play icon being
    // hidden in that mode too (surah_reader_screen.dart).
    final showAudioIcon = ayah.audioUrl != null && readerMode != ReaderMode.reading;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            if (showAudioIcon)
              IconButton(
                iconSize: 22,
                visualDensity: VisualDensity.compact,
                icon: Icon(
                  isActive && audioState.isLoading
                      ? Icons.hourglass_top
                      : isActiveAndPlaying
                          ? Icons.pause_circle_filled
                          : Icons.play_circle_fill,
                  color: mutedColor,
                ),
                tooltip: isActiveAndPlaying ? l10n.readerPause : l10n.readerPlayRecitation,
                onPressed: () {
                  final controller = ref.read(audioControllerProvider.notifier);
                  if (isActiveAndPlaying) {
                    controller.pause();
                  } else if (isActive) {
                    controller.resume();
                  } else {
                    controller.playAyah(
                      surahNumber: surahNumber,
                      ayahNumber: ayah.numberInSurah,
                      url: ayah.audioUrl!,
                    );
                  }
                },
              )
            else
              const SizedBox.shrink(),
            if (showBookmarkIcon)
              IconButton(
                iconSize: 22,
                visualDensity: VisualDensity.compact,
                icon: Icon(
                  isBookmarked ? Icons.star : Icons.star_border,
                  color: isBookmarked ? IqraSpaceBrand.gold(themeMode) : mutedColor,
                ),
                tooltip: isBookmarked ? l10n.readerRemoveBookmark : l10n.readerAddBookmark,
                onPressed: () => ref.read(bookmarksProvider.notifier).toggle(
                      Bookmark(
                        surahNumber: surahNumber,
                        ayahNumber: ayah.numberInSurah,
                        surahEnglishName: surahEnglishName,
                        snippet: ayah.translationTextEn ?? ayah.plainText,
                        createdAt: DateTime.now(),
                      ),
                    ),
              )
            else
              const SizedBox.shrink(),
          ],
        ),
        arabicText,
        if (showTranslation && translationText != null)
          Padding(
            padding: const EdgeInsets.only(top: 6, bottom: 4),
            child: Text(
              translationText,
              textDirection: TextDirection.ltr,
              style: TextStyle(fontSize: 15, height: 1.4, color: mutedColor),
            ),
          ),
      ],
    );
  }
}
