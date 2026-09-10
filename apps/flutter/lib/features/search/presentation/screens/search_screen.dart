import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/screens/surah_reader_screen.dart';
import 'package:quran_flutter/features/search/presentation/providers/search_providers.dart';

/// Searches the English translation text (Sahih International) across
/// all 114 surahs. Search runs on submit, not per-keystroke, to avoid a
/// network request per character typed.
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final resultsAsync = ref.watch(searchResultsProvider);
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          autofocus: true,
          textInputAction: TextInputAction.search,
          decoration: const InputDecoration(
            hintText: 'Search translation (e.g. mercy, patience)…',
            border: InputBorder.none,
          ),
          onSubmitted: (value) => ref.read(searchQueryProvider.notifier).state = value,
        ),
      ),
      body: resultsAsync.when(
        data: (results) {
          final query = ref.watch(searchQueryProvider);
          if (query.trim().isEmpty) {
            return const Center(child: Text('Type a word and press search.'));
          }
          if (results.isEmpty) {
            return const Center(child: Text('No matches found.'));
          }
          return ListView.separated(
            itemCount: results.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final r = results[index];
              return ListTile(
                title: Text(r.matchedText, maxLines: 3, overflow: TextOverflow.ellipsis),
                subtitle: Text('${r.surahEnglishName} ${r.surahNumber}:${r.numberInSurah}'),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => SurahReaderScreen(
                      surahNumber: r.surahNumber,
                      initialAyahNumber: r.numberInSurah,
                    ),
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(child: Text('Search failed.\n$error')),
      ),
    );
  }
}
