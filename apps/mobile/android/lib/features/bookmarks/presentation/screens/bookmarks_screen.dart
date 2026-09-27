import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/widgets/brand_mark.dart';
import 'package:quran_flutter/core/widgets/iqra_bottom_nav.dart';
import 'package:quran_flutter/core/widgets/surah_name_label.dart';
import 'package:quran_flutter/features/bookmarks/presentation/providers/bookmarks_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/screens/surah_reader_screen.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

class BookmarksScreen extends ConsumerWidget {
  const BookmarksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookmarks = ref.watch(bookmarksProvider);
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Row(
          children: [const BrandMark(size: 22), const SizedBox(width: 10), Text(l10n.bookmarksTitle)],
        ),
      ),
      body: bookmarks.isEmpty
          ? Center(child: Text(l10n.bookmarksEmpty))
          : ListView.separated(
              itemCount: bookmarks.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final b = bookmarks[index];
                return Dismissible(
                  key: ValueKey('${b.surahNumber}_${b.ayahNumber}'),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    color: Colors.red,
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: const Icon(Icons.delete, color: Colors.white),
                  ),
                  onDismissed: (_) => ref.read(bookmarksProvider.notifier).toggle(b),
                  child: ListTile(
                    title: Text(b.snippet, maxLines: 2, overflow: TextOverflow.ellipsis),
                    subtitle: Row(
                      children: [
                        Flexible(
                          child: SurahNameLabel(
                            surahNumber: b.surahNumber,
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ),
                        Text(' ${b.surahNumber}:${b.ayahNumber}'),
                      ],
                    ),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => SurahReaderScreen(
                          surahNumber: b.surahNumber,
                          initialAyahNumber: b.ayahNumber,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
      bottomNavigationBar: const IqraBottomNav(currentIndex: 3),
    );
  }
}
