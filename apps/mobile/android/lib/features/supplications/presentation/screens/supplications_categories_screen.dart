import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/widgets/brand_mark.dart';
import 'package:quran_flutter/core/widgets/iqra_bottom_nav.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/screens/supplication_category_detail_screen.dart';
import 'package:quran_flutter/features/supplications/presentation/widgets/script_switch.dart';
import 'package:quran_flutter/features/supplications/presentation/widgets/supplications_info_sheet.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Supplications' landing screen — every category (id/label/description
/// straight from the bundled JSON), with the session-wide reading-script
/// switch pinned at the top since it's the feature's headline control.
class SupplicationsCategoriesScreen extends ConsumerWidget {
  const SupplicationsCategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final content = ref.watch(supplicationsContentProvider);
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Row(
          children: [
            const BrandMark(size: 22),
            const SizedBox(width: 10),
            Flexible(
              child: Text(l10n.supplicationsScreenTitle, overflow: TextOverflow.ellipsis),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            tooltip: l10n.supplicationsInfoTitle,
            onPressed: content.valueOrNull == null
                ? null
                : () => showSupplicationsInfoSheet(context, content.valueOrNull!.meta),
          ),
        ],
      ),
      body: content.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              l10n.supplicationsLoadFailed,
              textAlign: TextAlign.center,
              style: TextStyle(color: colors.textColor.withValues(alpha: 0.7)),
            ),
          ),
        ),
        data: (content) => Column(
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: ScriptSwitch(),
            ),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                itemCount: content.categories.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final category = content.categories[index];
                  return InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => SupplicationCategoryDetailScreen(categoryId: category.id),
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        border: Border.all(color: colors.textColor.withValues(alpha: 0.15)),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  category.label,
                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  category.description,
                                  style: TextStyle(fontSize: 12.5, color: colors.textColor.withValues(alpha: 0.65)),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(Icons.chevron_right, color: colors.textColor.withValues(alpha: 0.4)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const IqraBottomNav(currentIndex: 2),
    );
  }
}
