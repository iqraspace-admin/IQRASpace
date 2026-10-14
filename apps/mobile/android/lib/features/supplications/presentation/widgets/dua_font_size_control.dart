import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Opens just the text-size control (with its live preview) in a sheet —
/// the categories screen's entry point, since category labels scale with
/// this setting too and that screen has no reading-settings sheet.
Future<void> showDuaFontSizeSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _DuaFontSizeSheet(),
  );
}

class _DuaFontSizeSheet extends ConsumerWidget {
  const _DuaFontSizeSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ReaderColors.forMode(ref.watch(readerThemeModeProvider));
    final l10n = AppLocalizations.of(context)!;
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.35,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) => Material(
        color: colors.background,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        clipBehavior: Clip.antiAlias,
        child: ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    l10n.supplicationsFontSizeLabel,
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
            const DuaFontSizeControl(),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text(l10n.commonDone),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Text-size slider (−A / slider / +A / percent / Reset) over a live
/// preview of what it does — Arabic, transliteration, translation and a
/// category tile label, at the real reading sizes. The preview follows the
/// slider while it is dragged (a local draft); the value is persisted when
/// the drag ends or a step button is pressed, which also updates the
/// screen behind the sheet.
class DuaFontSizeControl extends ConsumerStatefulWidget {
  const DuaFontSizeControl({super.key});

  @override
  ConsumerState<DuaFontSizeControl> createState() => _DuaFontSizeControlState();
}

class _DuaFontSizeControlState extends ConsumerState<DuaFontSizeControl> {
  double? _draft;

  void _commit(double value) {
    ref.read(duaFontScaleProvider.notifier).setScale(value);
    setState(() => _draft = null);
  }

  @override
  Widget build(BuildContext context) {
    final colors = ReaderColors.forMode(ref.watch(readerThemeModeProvider));
    final l10n = AppLocalizations.of(context)!;
    final saved = ref.watch(duaFontScaleProvider);
    final scale = _draft ?? saved;
    final hint = Theme.of(context).hintColor;
    final canShrink = scale > DuaFontScaleNotifier.min + 0.001;
    final canGrow = scale < DuaFontScaleNotifier.max - 0.001;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 6, bottom: 8),
          child: Text(l10n.supplicationsFontSizePreviewHint, style: TextStyle(fontSize: 12.5, color: hint)),
        ),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: colors.textColor.withValues(alpha: 0.05),
            border: Border.all(color: colors.textColor.withValues(alpha: 0.12)),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            children: [
              Text(
                l10n.supplicationsFontSizePreviewArabic,
                textAlign: TextAlign.center,
                textDirection: TextDirection.rtl,
                style: TextStyle(fontFamily: 'NotoNaskhArabic', fontSize: 24 * scale, height: 1.8, color: colors.textColor),
              ),
              const SizedBox(height: 6),
              Text(
                l10n.supplicationsFontSizePreviewTranslit,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14.5 * scale, height: 1.4, color: colors.textColor),
              ),
              const SizedBox(height: 6),
              Text(
                l10n.supplicationsFontSizePreviewTranslation,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 15 * scale, height: 1.35, color: colors.textColor.withValues(alpha: 0.75)),
              ),
              const SizedBox(height: 10),
              Divider(height: 1, color: colors.textColor.withValues(alpha: 0.1)),
              const SizedBox(height: 10),
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: Text(
                  l10n.supplicationsFontSizePreviewCategory,
                  style: TextStyle(fontSize: 13.5 * scale, fontWeight: FontWeight.w700, color: colors.textColor),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            IconButton(
              tooltip: l10n.supplicationsFontSizeDecrease,
              icon: const Text('A', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
              onPressed: canShrink ? () => _commit(scale - DuaFontScaleNotifier.step) : null,
            ),
            Expanded(
              child: Slider(
                min: DuaFontScaleNotifier.min,
                max: DuaFontScaleNotifier.max,
                divisions: ((DuaFontScaleNotifier.max - DuaFontScaleNotifier.min) / DuaFontScaleNotifier.step).round(),
                value: scale.clamp(DuaFontScaleNotifier.min, DuaFontScaleNotifier.max),
                label: '${(scale * 100).round()}%',
                onChanged: (v) => setState(() => _draft = v),
                onChangeEnd: _commit,
              ),
            ),
            IconButton(
              tooltip: l10n.supplicationsFontSizeIncrease,
              icon: const Text('A', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
              onPressed: canGrow ? () => _commit(scale + DuaFontScaleNotifier.step) : null,
            ),
          ],
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 12),
              child: Text('${(scale * 100).round()}%', style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
            TextButton(
              onPressed: (scale - DuaFontScaleNotifier.defaultScale).abs() < 0.001
                  ? null
                  : () => _commit(DuaFontScaleNotifier.defaultScale),
              child: Text(l10n.supplicationsFontSizeReset),
            ),
          ],
        ),
      ],
    );
  }
}
