import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/theme/arabic_fonts.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Arabic Font picker, split out of the main Reader Settings sheet
/// (reader_settings_sheet.dart) so that sheet stays short — every control
/// here applies live via Riverpod just like its parent, so there's
/// nothing to Save.
Future<void> showArabicFontPickerSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: false,
    backgroundColor: Colors.transparent,
    builder: (_) => const _ArabicFontPickerSheet(),
  );
}

class _ArabicFontPickerSheet extends ConsumerWidget {
  const _ArabicFontPickerSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final arabicFontFamily = ref.watch(arabicFontFamilyProvider);
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
                  Text(l10n.settingsArabicFont, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    tooltip: l10n.settingsClose,
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              RadioGroup<String>(
                groupValue: arabicFontFamily,
                onChanged: (family) => ref.read(arabicFontFamilyProvider.notifier).setFamily(family!),
                child: Column(
                  children: [
                    for (final option in arabicFontOptions(l10n))
                      RadioListTile<String>(
                        title: Text(option.displayName),
                        subtitle: option.caveat != null ? Text(option.caveat!) : null,
                        value: option.familyName,
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
