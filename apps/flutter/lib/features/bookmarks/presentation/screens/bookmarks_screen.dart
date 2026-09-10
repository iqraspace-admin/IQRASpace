import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/bookmarks/presentation/providers/bookmarks_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/screens/surah_reader_screen.dart';

class BookmarksScreen extends ConsumerWidget {
  const BookmarksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookmarks = ref.watch(bookmarksProvider);
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(title: const Text('Bookmarks')),
      body: bookmarks.isEmpty
          ? const Center(child: Text('No bookmarks yet.'))
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
                    subtitle: Text('${b.surahEnglishName} ${b.surahNumber}:${b.ayahNumber}'),
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
    );
  }
}
