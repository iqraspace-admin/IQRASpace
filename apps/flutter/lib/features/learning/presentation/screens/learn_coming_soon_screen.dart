import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/widgets/brand_mark.dart';
import 'package:quran_flutter/core/widgets/iqra_bottom_nav.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Reserved slot for IqraSpace Learning — deliberately non-functional in
/// this phase (see the Flutter app's product scope: Quran Reader only).
/// Kept as its own screen/feature folder, separate from every
/// quran_reader/bookmarks/search import, so Learning can be built out
/// later without touching or redesigning anything here.
class LearnComingSoonScreen extends ConsumerWidget {
  const LearnComingSoonScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Row(children: [const BrandMark(size: 22), const SizedBox(width: 10), Text(l10n.learnTitle)]),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Opacity(opacity: 0.55, child: BrandMark(size: 56)),
              const SizedBox(height: 16),
              Text(
                l10n.learnHeading,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Text(
                l10n.learnBody,
                textAlign: TextAlign.center,
                style: TextStyle(color: colors.textColor.withValues(alpha: 0.65)),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const IqraBottomNav(currentIndex: 2),
    );
  }
}
