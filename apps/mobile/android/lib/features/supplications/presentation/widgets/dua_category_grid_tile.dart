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
  final VoidCallback onTap;

  const DuaCategoryGridTile({
    required this.category,
    required this.colors,
    required this.appLanguage,
    required this.onTap,
    super.key,
  });

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
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: colors.textColor),
            ),
            const SizedBox(height: 8),
            Container(height: 3, width: 28, decoration: BoxDecoration(color: style.accent, borderRadius: BorderRadius.circular(2))),
          ],
        ),
      ),
    );
  }
}
