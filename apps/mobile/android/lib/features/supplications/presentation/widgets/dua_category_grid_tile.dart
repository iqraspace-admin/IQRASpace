import 'package:flutter/material.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';
import 'package:quran_flutter/features/supplications/presentation/constants/dua_category_style.dart';

/// One category tile in the Duas grid view — icon badge, label and a
/// colored accent underline, echoing the reference app's colored-tile
/// grid while reusing this app's own card chip conventions (the tinted
/// icon-box shape already used elsewhere, e.g. Home's _EntryTile).
class DuaCategoryGridTile extends StatelessWidget {
  final SupplicationCategory category;
  final ReaderColors colors;
  final AppLanguage appLanguage;
  final double fontScale;
  final VoidCallback onTap;

  const DuaCategoryGridTile({
    required this.category,
    required this.colors,
    required this.appLanguage,
    required this.fontScale,
    required this.onTap,
    super.key,
  });

  static const double _baseLabelSize = 13.5;

  /// Lines the label may wrap to — more at larger sizes so a long category
  /// name is wrapped, not cut off with an ellipsis.
  static int maxLinesFor(double fontScale) =>
      fontScale <= 1.0 ? 2 : (fontScale <= 1.4 ? 3 : 4);

  /// Fixed grid-cell height that fits icon + the label at [maxLinesFor]
  /// lines (incl. the system text scale) — the grid uses this instead of
  /// an aspect ratio, which cannot grow with the text.
  static double extentFor(BuildContext context, double fontScale) {
    final label =
        MediaQuery.textScalerOf(context).scale(_baseLabelSize * fontScale);
    // padding 24 + border 2 + icon 38 + min gap 8 + text + gap 8 + underline 3
    return 24 + 2 + 38 + 8 + label * 1.4 * maxLinesFor(fontScale) + 8 + 3;
  }

  @override
  Widget build(BuildContext context) {
    final style = DuaCategoryStyles.forId(category.id);

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: style.accent.withValues(alpha: 0.10),
          border: Border.all(color: style.accent.withValues(alpha: 0.25)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: style.accent.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(11),
              ),
              alignment: Alignment.center,
              child: Icon(style.icon, color: style.accent, size: 20),
            ),
            const Spacer(),
            Text(
              category.labelFor(appLanguage),
              maxLines: maxLinesFor(fontScale),
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  fontSize: _baseLabelSize * fontScale,
                  height: 1.25,
                  fontWeight: FontWeight.w700,
                  color: colors.textColor),
            ),
            const SizedBox(height: 8),
            Container(
                height: 3,
                width: 28,
                decoration: BoxDecoration(
                    color: style.accent,
                    borderRadius: BorderRadius.circular(2))),
          ],
        ),
      ),
    );
  }
}
