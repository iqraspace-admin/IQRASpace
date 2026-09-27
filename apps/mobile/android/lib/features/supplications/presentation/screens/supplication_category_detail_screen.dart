import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/widgets/dua_card.dart';
import 'package:quran_flutter/features/supplications/presentation/widgets/script_switch.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// One category's duas, each as its own card. The reading-script switch
/// is repeated here (same global provider as the categories screen) so
/// it's reachable without backing out of the category first.
class SupplicationCategoryDetailScreen extends ConsumerWidget {
  final String categoryId;

  const SupplicationCategoryDetailScreen({required this.categoryId, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final category = ref.watch(supplicationCategoryProvider(categoryId));
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(title: Text(category?.label ?? l10n.supplicationsScreenTitle)),
      body: category == null
          ? const SizedBox.shrink()
          : Column(
              children: [
                const Padding(
                  padding: EdgeInsets.fromLTRB(16, 12, 16, 4),
                  child: ScriptSwitch(),
                ),
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: category.duas.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) => DuaCard(dua: category.duas[index]),
                  ),
                ),
              ],
            ),
    );
  }
}
