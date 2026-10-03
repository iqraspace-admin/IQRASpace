import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/widgets/surah_name_label.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/surah_summary.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Canvas color for the Surah list. In light mode this is apps/site's
/// ivory (`--ivory`) so white cards lift off it; sepia and true-black dark
/// keep their own reader backgrounds.
Color surahListCanvas(ReaderThemeMode mode) =>
    mode == ReaderThemeMode.light ? const Color(0xFFFAF8F2) : ReaderColors.forMode(mode).background;

/// One surah in the Quran tab's list — an elevated, softly-bordered card
/// (white on the ivory canvas in light mode, matching apps/site's cards),
/// with the surah number in an eight-pointed star, the transliteration and
/// meaning on the left, the Arabic name in brand green on the right, and a
/// quiet gold-or-teal origin marker beside the ayah count.
class SurahListCard extends ConsumerWidget {
  final SurahSummary surah;
  final ReaderThemeMode themeMode;
  final VoidCallback onTap;

  const SurahListCard({
    required this.surah,
    required this.themeMode,
    required this.onTap,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ReaderColors.forMode(themeMode);
    final isLight = themeMode == ReaderThemeMode.light;
    final brand = IqraSpaceBrand.teal(themeMode);
    final gold = IqraSpaceBrand.gold(themeMode);
    final l10n = AppLocalizations.of(context)!;
    final isMedinan = surah.revelationType.toLowerCase().startsWith('medin');
    final originColor = isMedinan ? gold : brand;
    final muted = colors.textColor.withValues(alpha: 0.6);

    return Container(
      decoration: BoxDecoration(
        color: isLight ? Colors.white : colors.textColor.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isLight ? const Color(0xFFE4E8E2) : colors.textColor.withValues(alpha: 0.12),
        ),
        boxShadow: isLight
            ? [
                BoxShadow(
                  color: const Color(0xFF0F5C4F).withValues(alpha: 0.06),
                  blurRadius: 14,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 16, 14),
            child: Row(
              children: [
                _StarBadge(number: surah.number, brand: brand, gold: gold),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        surahTransliterationLabel(ref, surah.number),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 15.5,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -0.1,
                          color: colors.textColor,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        surah.englishNameTranslation,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: muted),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(color: originColor, shape: BoxShape.circle),
                          ),
                          Text(
                            surah.revelationType,
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: originColor),
                          ),
                          Text('·', style: TextStyle(fontSize: 11, color: muted)),
                          Text(
                            l10n.commonAyahsCount(surah.numberOfAyahs),
                            style: TextStyle(fontSize: 11, color: muted),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  surah.name,
                  textDirection: TextDirection.rtl,
                  style: TextStyle(fontFamily: 'AmiriQuran', fontSize: 27, height: 1.5, color: brand),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// The surah number inside an eight-pointed star (two overlapped squares,
/// the classic Islamic rub el hizb motif) — teal-tinted fill, a fine gold
/// outline, the number centered in brand teal.
class _StarBadge extends StatelessWidget {
  final int number;
  final Color brand;
  final Color gold;

  const _StarBadge({required this.number, required this.brand, required this.gold});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 46,
      height: 46,
      child: CustomPaint(
        painter: _StarPainter(fill: brand.withValues(alpha: 0.10), outline: gold.withValues(alpha: 0.75)),
        child: Center(
          child: Text(
            '$number',
            style: TextStyle(
              fontSize: number > 99 ? 12.5 : 14,
              fontWeight: FontWeight.w700,
              color: brand,
              height: 1,
            ),
          ),
        ),
      ),
    );
  }
}

class _StarPainter extends CustomPainter {
  final Color fill;
  final Color outline;

  _StarPainter({required this.fill, required this.outline});

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final r = size.width / 2 - 1;
    // Eight-point star: alternate outer points with inner notches.
    final inner = r * 0.78;
    final path = Path();
    for (var i = 0; i < 16; i++) {
      final radius = i.isEven ? r : inner;
      final a = -math.pi / 2 + i * math.pi / 8;
      final p = Offset(c.dx + radius * math.cos(a), c.dy + radius * math.sin(a));
      i == 0 ? path.moveTo(p.dx, p.dy) : path.lineTo(p.dx, p.dy);
    }
    path.close();
    canvas.drawPath(path, Paint()..color = fill);
    canvas.drawPath(
      path,
      Paint()
        ..color = outline
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(_StarPainter old) => old.fill != fill || old.outline != outline;
}
