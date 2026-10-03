import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/constants/dua_category_style.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/dua_favorites_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/screens/dua_reading_screen.dart';
import 'package:quran_flutter/features/supplications/presentation/utils/favorite_resolver.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Every dua the reader has favorited, newest first. Reached from the
/// categories screen's AppBar star icon (list-level entry point) and
/// from the reading screen's bottom-bar star (per-dua toggle). No
/// IqraBottomNav here — reached by icon push, same as DuaReadingScreen.
class DuaFavoritesScreen extends ConsumerWidget {
  const DuaFavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final favorites = ref.watch(duaFavoritesProvider);
    final categories = ref.watch(supplicationsContentProvider).valueOrNull?.categories;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Text(l10n.supplicationsFavoritesTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_sweep_outlined),
            tooltip: l10n.supplicationsFavoritesClearAll,
            onPressed: favorites.isEmpty
                ? null
                : () async {
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (dialogContext) => AlertDialog(
                        title: Text(l10n.supplicationsFavoritesClearConfirmTitle),
                        content: Text(l10n.supplicationsFavoritesClearConfirmBody),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(dialogContext).pop(false),
                            child: Text(l10n.commonCancel),
                          ),
                          TextButton(
                            onPressed: () => Navigator.of(dialogContext).pop(true),
                            child: Text(l10n.supplicationsFavoritesClearAll),
                          ),
                        ],
                      ),
                    );
                    if (confirmed == true) {
                      await ref.read(duaFavoritesProvider.notifier).clearAll();
                    }
                  },
          ),
        ],
      ),
      body: favorites.isEmpty
          ? Center(child: Text(l10n.supplicationsFavoritesEmpty))
          : ListView.separated(
              itemCount: favorites.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final favorite = favorites[index];
                final style = DuaCategoryStyles.forId(favorite.categoryId);
                // Content still loading: leave it tappable-less, not 'removed'.
                final location = categories == null ? null : resolveFavorite(favorite, categories);
                final unavailable = categories != null && location == null;
                return Row(
                  children: [
                    Container(width: 5, height: 56, color: style.accent),
                    Expanded(
                      child: ListTile(
                        title: Text(favorite.snippet, maxLines: 2, overflow: TextOverflow.ellipsis),
                        subtitle: Text(
                          unavailable
                              ? '${favorite.categoryLabel} · ${l10n.supplicationsFavoriteUnavailable}'
                              : favorite.categoryLabel,
                        ),
                        onTap: location == null
                            ? null
                            : () => Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => DuaReadingScreen(
                                      categoryId: location.categoryId,
                                      initialIndex: location.index,
                                    ),
                                  ),
                                ),
                      ),
                    ),
                  ],
                );
              },
            ),
    );
  }
}
