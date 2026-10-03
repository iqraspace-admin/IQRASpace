import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplications_meta.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// The Supplications feature's "About this content" sheet — this is
/// where meta.sourcesNote (a general disclaimer, notably that the Telugu
/// transliteration is an algorithmically generated approximate phonetic
/// aid) lives, rather than being repeated on every dua card.
Future<void> showSupplicationsInfoSheet(BuildContext context, SupplicationsMeta meta) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: false,
    backgroundColor: Colors.transparent,
    builder: (_) => _SupplicationsInfoSheet(meta: meta),
  );
}

class _SupplicationsInfoSheet extends ConsumerWidget {
  final SupplicationsMeta meta;

  const _SupplicationsInfoSheet({required this.meta});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final brand = IqraSpaceBrand.teal(themeMode);
    final mutedColor = colors.textColor.withValues(alpha: 0.72);
    final l10n = AppLocalizations.of(context)!;

    return DraggableScrollableSheet(
      initialChildSize: 0.5,
      minChildSize: 0.3,
      maxChildSize: 0.85,
      expand: false,
      builder: (context, scrollController) {
        return Material(
          color: colors.background,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          clipBehavior: Clip.antiAlias,
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 14),
                  decoration: BoxDecoration(
                    color: colors.textColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      l10n.supplicationsInfoTitle,
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
              const SizedBox(height: 4),
              Text(
                meta.title,
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: brand),
              ),
              const SizedBox(height: 6),
              Text(
                meta.description,
                style: TextStyle(fontSize: 14, height: 1.5, color: mutedColor),
              ),
              const SizedBox(height: 6),
              Text(
                l10n.supplicationsCategoryDuaSummary(meta.categoryCount, meta.duaCount),
                style: TextStyle(fontSize: 13, color: mutedColor),
              ),
              const SizedBox(height: 18),
              Text(
                l10n.supplicationsSourcesHeading,
                style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700, color: brand),
              ),
              const SizedBox(height: 6),
              Text(
                meta.sourcesNote,
                style: TextStyle(fontSize: 13.5, height: 1.55, color: mutedColor),
              ),
              if (meta.urduTitlesNote != null) ...[
                const SizedBox(height: 10),
                Text(
                  meta.urduTitlesNote!,
                  style: TextStyle(fontSize: 13.5, height: 1.55, color: mutedColor),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
