import 'package:quran_flutter/features/quran_reader/domain/entities/tajweed_span.dart';

/// Parses Al Quran Cloud's `quran-tajweed` edition markup.
///
/// The raw API does NOT return HTML — it returns a compact bracket
/// notation, e.g. for the Basmala:
///
///   بِسْمِ [h:1[ٱ]للَّهِ [h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ ...
///
/// Each tagged run is `[<code>(:<id>)?[<text>]` — an opening `[` + a rule
/// code (optionally followed by `:<numeric id>`), a second `[`, the
/// affected text, and a single closing `]`. Untagged runs are plain text
/// with no `[`/`]` at all. Confirmed against the actual API
/// (api.alquran.cloud/v1/surah/1/quran-tajweed) and cross-checked
/// against the `alquran-tools` PHP library's parser
/// (github.com/islamic-network/alquran-tools,
/// src/AlQuranCloud/Tools/Parser/Tajweed.php) — the same library Al
/// Quran Cloud's own developer guide (alquran.cloud/tajweed-guide) uses
/// to turn this into `<tajweed class="...">` HTML. See
/// lib/core/theme/tajweed_rule_colors.dart for what each code means.
///
/// This runs ONCE per ayah, at fetch time (see AyahModel.fromApiJson).
/// The parsed spans are what gets cached and rendered — nothing
/// downstream re-parses tagged text inside a widget build().
class TajweedParser {
  TajweedParser._();

  static final RegExp _tagPattern = RegExp(
    r'\[([a-z]+)(?::\d+)?\[([^\]]*)\]|([^\[]+)',
  );

  // Real, spacing Arabic letters this API's Uthmani text actually uses
  // (standard letters U+0621-U+063A/U+0641-U+064A, plus the wasl-alif
  // and wavy-hamza-alef variants seen in Quranic orthography,
  // U+0671-U+06D3). Deliberately excludes U+0640 TATWEEL (a spacing
  // connector with no letter identity of its own) and all combining
  // marks (harakat U+064B-U+0652, dagger alif U+0670, etc.) — see
  // _reattachOrphanedMarks below for why that distinction matters.
  static final RegExp _baseLetterPattern = RegExp('[ء-غف-يٱ-ۓ]');

  static List<TajweedSpan> parse(String rawTaggedText) {
    final rawSpans = _tagPattern.allMatches(rawTaggedText).map((m) {
      if (m.group(1) != null) {
        return TajweedSpan(m.group(2) ?? '', m.group(1));
      }
      return TajweedSpan(m.group(3) ?? '', null);
    }).toList();

    return _reattachOrphanedMarks(rawSpans);
  }

  /// Some tajweed-tagged runs carry no real base letter — e.g. `[n[ـٰ]`
  /// tags just `ـٰ` (a TATWEEL connector + dagger-alif combining mark)
  /// for madda_normal. Rendered as its own isolated TextSpan (a
  /// different color = a different Flutter/Skia text run), that
  /// combining mark can't correctly cursive-join or attach to a base
  /// letter that lives in a DIFFERENT span — it showed up on screen as
  /// a small floating, disconnected mark instead of a properly attached
  /// diacritic (reported as "script colors getting mixed up").
  ///
  /// Fix: when a tagged span has no base letter of its own, pull the
  /// immediately preceding span's trailing base letter — plus any
  /// combining marks already stacked after it, e.g. a fatha — into this
  /// span, so the orphaned mark and the letter it attaches to share one
  /// style run. This also matches how colored-Tajweed mushafs
  /// conventionally highlight a madd as one letter+mark unit, not an
  /// isolated diacritic.
  ///
  /// Carrying just the literal last character would risk grabbing
  /// another combining mark instead of a real letter (Arabic harakat
  /// commonly trail their base letter in storage order), which wouldn't
  /// fix anything — hence searching backward for the last actual letter.
  static List<TajweedSpan> _reattachOrphanedMarks(List<TajweedSpan> spans) {
    final result = <TajweedSpan>[];
    for (final span in spans) {
      final isOrphanedMark = span.ruleKey != null &&
          span.text.isNotEmpty &&
          !_baseLetterPattern.hasMatch(span.text);
      final letterIndex = isOrphanedMark && result.isNotEmpty
          ? _lastBaseLetterIndex(result.last.text)
          : -1;
      if (letterIndex != -1) {
        final previous = result.removeLast();
        final carried = previous.text.substring(letterIndex);
        final shortened = previous.text.substring(0, letterIndex);
        if (shortened.isNotEmpty) {
          result.add(TajweedSpan(shortened, previous.ruleKey));
        }
        result.add(TajweedSpan(carried + span.text, span.ruleKey));
      } else {
        result.add(span);
      }
    }
    return result;
  }

  static int _lastBaseLetterIndex(String text) {
    for (var i = text.length - 1; i >= 0; i--) {
      if (_baseLetterPattern.hasMatch(text[i])) return i;
    }
    return -1;
  }
}
