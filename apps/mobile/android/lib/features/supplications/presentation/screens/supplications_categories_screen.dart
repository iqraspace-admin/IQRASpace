import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/widgets/brand_mark.dart';
import 'package:quran_flutter/core/widgets/iqra_bottom_nav.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/screens/dua_favorites_screen.dart';
import 'package:quran_flutter/features/supplications/presentation/screens/dua_reading_screen.dart';
import 'package:quran_flutter/features/supplications/presentation/widgets/dua_category_grid_tile.dart';
import 'package:quran_flutter/features/supplications/presentation/widgets/dua_category_list_row.dart';
import 'package:quran_flutter/features/supplications/presentation/widgets/supplications_info_sheet.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Duas' landing screen — every category (id/label/description straight
/// from the bundled JSON), as a grid of colored tiles or a flat list
/// (toggled in the AppBar, see duaCategoryViewModeProvider), matching the
/// reference "Wa Iyyaka Nasta'in" app's grid/list category browser. The
/// reading-script switch that used to be pinned here has moved into the
/// reading screen's settings sheet (see dua_reading_settings_sheet.dart)
/// — see that file's doc comment for why.
class SupplicationsCategoriesScreen extends ConsumerWidget {
  const SupplicationsCategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final content = ref.watch(supplicationsContentProvider);
    final viewMode = ref.watch(duaCategoryViewModeProvider);
    final appLanguage = ref.watch(appLanguageProvider);
    final l10n = AppLocalizations.of(context)!;
    final isGrid = viewMode == DuaCategoryViewMode.grid;

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
            icon: Icon(isGrid ? Icons.view_list_outlined : Icons.grid_view_outlined),
            tooltip: isGrid ? l10n.supplicationsListViewTooltip : l10n.supplicationsGridViewTooltip,
            onPressed: () => ref.read(duaCategoryViewModeProvider.notifier).setMode(
                  isGrid ? DuaCategoryViewMode.list : DuaCategoryViewMode.grid,
                ),
          ),
          IconButton(
            icon: const Icon(Icons.star_border_outlined),
            tooltip: l10n.supplicationsFavoritesTooltip,
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const DuaFavoritesScreen()),
            ),
          ),
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
        data: (content) {
          // Opens straight into the reading screen at the first dua —
          // matching the reference app's actual flow (no separate preview
          // list in between). Swiping, and the reading screen's own
          // "jump to a dua" index icon, cover picking a different one.
          void openCategory(String categoryId) => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => DuaReadingScreen(categoryId: categoryId, initialIndex: 0)),
              );

          // Pull-to-refresh forces a remote version check (no-op offline /
          // when the remote is not configured).
          Future<void> onRefresh() => ref.read(supplicationsRepositoryProvider).refresh(force: true);

          return RefreshIndicator(
            onRefresh: onRefresh,
            child: isGrid
                ? GridView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      childAspectRatio: 1.05,
                    ),
                    itemCount: content.categories.length,
                    itemBuilder: (context, index) {
                      final category = content.categories[index];
                      return DuaCategoryGridTile(
                        category: category,
                        colors: colors,
                        appLanguage: appLanguage,
                        onTap: () => openCategory(category.id),
                      );
                    },
                  )
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(0, 8, 0, 24),
                    itemCount: content.categories.length,
                    separatorBuilder: (_, __) => Divider(height: 1, color: colors.textColor.withValues(alpha: 0.08)),
                    itemBuilder: (context, index) {
                      final category = content.categories[index];
                      return DuaCategoryListRow(
                        category: category,
                        colors: colors,
                        appLanguage: appLanguage,
                        onTap: () => openCategory(category.id),
                      );
                    },
                  ),
          );
        },
      ),
      bottomNavigationBar: const IqraBottomNav(currentIndex: 2),
    );
  }
}
