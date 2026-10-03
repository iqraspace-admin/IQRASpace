import 'package:flutter/material.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';
import 'package:quran_flutter/features/supplications/presentation/constants/dua_category_style.dart';

/// One category row in the Duas list view — a colored left bar, icon
/// chip, label + description, and a chevron. The list-view counterpart
/// to [DuaCategoryGridTile] — same data, same per-category color/icon,
/// different layout.
class DuaCategoryListRow extends StatelessWidget {
  final SupplicationCategory category;
  final ReaderColors colors;
  final AppLanguage appLanguage;
  final VoidCallback onTap;

  const DuaCategoryListRow({
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
      onTap: onTap,
      child: Row(
        children: [
          Container(width: 5, height: 64, color: style.accent),
          const SizedBox(width: 12),
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(color: style.accent.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
            alignment: Alignment.center,
            child: Icon(style.icon, color: style.accent, size: 17),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(category.labelFor(appLanguage), style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(
                    category.descriptionFor(appLanguage),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12, color: colors.textColor.withValues(alpha: 0.65)),
                  ),
                ],
              ),
            ),
          ),
          Icon(Icons.chevron_right, color: colors.textColor.withValues(alpha: 0.4)),
          const SizedBox(width: 8),
        ],
      ),
    );
  }
}
