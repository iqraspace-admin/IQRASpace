import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// A flat "jump to a dua within this category" list, opened by tapping
/// the reading screen's title. Categories here top out at a few dozen
/// duas, so a plain scrollable list suffices — no twin-wheel picker like
/// the Quran reader's jump_to_surah_sheet.dart needs for 114 surahs.
Future<int?> showDuaJumpSheet(
  BuildContext context, {
  required SupplicationCategory category,
  required int currentIndex,
  required AppLanguage appLanguage,
}) {
  return showModalBottomSheet<int>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _DuaJumpSheet(category: category, currentIndex: currentIndex, appLanguage: appLanguage),
  );
}

class _DuaJumpSheet extends ConsumerWidget {
  final SupplicationCategory category;
  final int currentIndex;
  final AppLanguage appLanguage;

  const _DuaJumpSheet({required this.category, required this.currentIndex, required this.appLanguage});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final brand = IqraSpaceBrand.teal(themeMode);
    final l10n = AppLocalizations.of(context)!;

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.35,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) {
        return Material(
          color: colors.background,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  margin: const EdgeInsets.fromLTRB(0, 10, 0, 4),
                  decoration: BoxDecoration(
                    color: colors.textColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 6, 20, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        l10n.supplicationsJumpToDua,
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      tooltip: l10n.settingsClose,
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.separated(
                  controller: scrollController,
                  itemCount: category.duas.length,
                  separatorBuilder: (_, __) => Divider(height: 1, color: colors.textColor.withValues(alpha: 0.08)),
                  itemBuilder: (context, index) {
                    final isCurrent = index == currentIndex;
                    return ListTile(
                      title: Text(
                        category.duas[index].occasionFor(appLanguage),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w400,
                          color: isCurrent ? brand : colors.textColor,
                        ),
                      ),
                      trailing: isCurrent ? Icon(Icons.check, color: brand) : null,
                      onTap: () => Navigator.of(context).pop(index),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
