import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/core/utils/tajweed_parser.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/tajweed_span.dart';

void main() {
  group('TajweedParser.parse', () {
    // Real fixture pulled from api.alquran.cloud/v1/ayah/1/quran-tajweed
    // (the Basmala) — not an invented format. Confirms the parser
    // matches what the live API actually returns, not an assumed shape.
    test('parses the real Al Quran Cloud bracket notation (Basmala)', () {
      const raw =
          'بِسْمِ [h:1[ٱ]للَّهِ [h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ [h:3[ٱ][l[ل]رَّح[p[ِي]مِ';

      final spans = TajweedParser.parse(raw);

      expect(spans, [
        const TajweedSpan('بِسْمِ ', null),
        const TajweedSpan('ٱ', 'h'),
        const TajweedSpan('للَّهِ ', null),
        const TajweedSpan('ٱ', 'h'),
        const TajweedSpan('ل', 'l'),
        // 'ـٰ' (tatweel + dagger-alif) has no base letter of its own, so
        // the trailing 'مَ' (the meem it attaches to, plus its fatha) is
        // carried over from the preceding plain span into this one —
        // see _reattachOrphanedMarks.
        const TajweedSpan('رَّحْ', null),
        const TajweedSpan('مَـٰ', 'n'),
        const TajweedSpan('نِ ', null),
        const TajweedSpan('ٱ', 'h'),
        const TajweedSpan('ل', 'l'),
        // 'ِي' (kasra + ya) DOES have a base letter (ya) — no merge.
        const TajweedSpan('رَّح', null),
        const TajweedSpan('ِي', 'p'),
        const TajweedSpan('مِ', null),
      ]);
    });

    test('reattaches a mark-only tagged span to its preceding base letter', () {
      // Isolated repro of the ayah-2 case: '[n[ـٰ]' tags a bare
      // tatweel+dagger-alif with no letter of its own.
      final spans = TajweedParser.parse('لْعَ[n[ـٰ]لَم');

      expect(spans, [
        const TajweedSpan('لْ', null),
        const TajweedSpan('عَـٰ', 'n'),
        const TajweedSpan('لَم', null),
      ]);
    });

    test('returns a single untagged span for plain text', () {
      const raw = 'بِسْمِ اللَّهِ';

      final spans = TajweedParser.parse(raw);

      expect(spans, [const TajweedSpan(raw, null)]);
    });

    test('numeric ids after a code (e.g. h:1) are stripped from ruleKey', () {
      final spans = TajweedParser.parse('[h:9421[ٱ]');

      expect(spans, [const TajweedSpan('ٱ', 'h')]);
    });

    test('handles multiple different tagged codes in sequence', () {
      const raw = '[g[نّ]َهَا[q[بٌ]';

      final spans = TajweedParser.parse(raw);

      expect(spans, [
        const TajweedSpan('نّ', 'g'),
        const TajweedSpan('َهَا', null),
        const TajweedSpan('بٌ', 'q'),
      ]);
    });
  });
}
