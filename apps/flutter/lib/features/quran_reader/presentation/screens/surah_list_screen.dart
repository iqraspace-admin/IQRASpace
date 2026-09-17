import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/widgets/brand_mark.dart';
import 'package:quran_flutter/core/widgets/iqra_bottom_nav.dart';
import 'package:quran_flutter/core/widgets/surah_name_label.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/screens/surah_reader_screen.dart';
import 'package:quran_flutter/features/search/presentation/screens/search_screen.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// The Quran tab: all 114 surahs, with an entry point to Search.
/// Bookmarks and Settings live on the persistent bottom nav instead of
/// this AppBar now.
class SurahListScreen extends ConsumerWidget {
  const SurahListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final surahsAsync = ref.watch(surahListProvider);
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Row(
          children: [
            const BrandMark(size: 24),
            const SizedBox(width: 10),
            Text(l10n.quranTitle),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            tooltip: l10n.homeSearch,
            onPressed: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => const SearchScreen())),
          ),
        ],
      ),
      body: surahsAsync.when(
        data: (surahs) => ListView.separated(
          itemCount: surahs.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final s = surahs[index];
            return ListTile(
              leading: CircleAvatar(child: Text('${s.number}')),
              title: SurahNameLabel(surahNumber: s.number, arabicName: s.name),
              subtitle: Text(
                '${s.englishNameTranslation} · ${l10n.commonAyahsCount(s.numberOfAyahs)} · ${s.revelationType}',
              ),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => SurahReaderScreen(surahNumber: s.number)),
              ),
            );
          },
        ),
        loading: () => const BrandedLoadingIndicator(),
        error: (error, stackTrace) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const BrandMark(size: 40),
                const SizedBox(height: 14),
                Text(
                  l10n.commonCouldNotReachReader,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  '$error',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.refresh(surahListProvider),
                  child: Text(l10n.commonRetry),
                ),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: const IqraBottomNav(currentIndex: 1),
    );
  }
}
