import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/widgets/brand_mark.dart';
import 'package:quran_flutter/core/widgets/iqra_bottom_nav.dart';
import 'package:quran_flutter/core/widgets/mini_player_bar.dart';
import 'package:quran_flutter/core/widgets/surah_name_label.dart';
import 'package:quran_flutter/features/bookmarks/presentation/providers/bookmarks_providers.dart';
import 'package:quran_flutter/features/bookmarks/presentation/screens/bookmarks_screen.dart';
import 'package:quran_flutter/features/learning/presentation/screens/learn_coming_soon_screen.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/screens/surah_list_screen.dart';
import 'package:quran_flutter/features/quran_reader/presentation/screens/surah_reader_screen.dart';
import 'package:quran_flutter/features/quran_reader/presentation/screens/tajweed_rules_screen.dart';
import 'package:quran_flutter/features/search/presentation/screens/search_screen.dart';
import 'package:quran_flutter/features/settings/presentation/widgets/reader_settings_sheet.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// The app's landing screen — branding, a "Continue Reading" card for
/// wherever the reader last left off, entry points into the Quran
/// Reader and (reserved, non-functional) Learning, and a Bookmarks
/// preview. Everything here is a doorway to another top-level screen;
/// no reading happens directly on this page.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final brand = IqraSpaceBrand.teal(themeMode);
    final gold = IqraSpaceBrand.gold(themeMode);
    final lastReadHistory = ref.watch(lastReadProvider);
    final bookmarks = ref.watch(bookmarksProvider);
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Row(
              children: [
                const BrandMark(size: 34),
                const SizedBox(width: 10),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(text: 'IQRA', style: TextStyle(color: brand, fontWeight: FontWeight.w700, fontSize: 18)),
                      TextSpan(text: 'SPACE', style: TextStyle(color: gold, fontWeight: FontWeight.w700, fontSize: 18)),
                    ],
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.only(top: 3, left: 44),
              child: Text(
                l10n.homeTagline,
                style: TextStyle(
                  fontSize: 11.5,
                  letterSpacing: 0.5,
                  color: colors.textColor.withValues(alpha: 0.6),
                ),
              ),
            ),
            const SizedBox(height: 22),

            // Shown only while Listening/Reading+Listening Mode audio is
            // active — see MiniPlayerBar's own doc comment.
            const MiniPlayerBar(),

            // Continue Reading
            if (lastReadHistory.isNotEmpty)
              _ContinueReadingCard(brand: brand, gold: gold)
            else
              _StartReadingCard(brand: brand),

            const SizedBox(height: 16),

            // Entry tiles: Read Quran / Learning
            Row(
              children: [
                Expanded(
                  child: _EntryTile(
                    icon: Icons.menu_book_outlined,
                    color: brand,
                    colors: colors,
                    title: l10n.homeReadQuranTitle,
                    subtitle: l10n.homeReadQuranSubtitle,
                    onTap: () => Navigator.of(context)
                        .push(MaterialPageRoute(builder: (_) => const SurahListScreen())),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _EntryTile(
                    icon: Icons.school_outlined,
                    color: gold,
                    colors: colors,
                    title: l10n.homeLearningTitle,
                    subtitle: l10n.homeLearningSubtitle,
                    onTap: () => Navigator.of(context)
                        .push(MaterialPageRoute(builder: (_) => const LearnComingSoonScreen())),
                  ),
                ),
              ],
            ),

            // Last Reads — recent reading history beyond "Continue
            // Reading"'s single most-recent entry, for quickly resuming
            // a surah visited a little further back.
            if (lastReadHistory.length > 1) ...[
              const SizedBox(height: 20),
              Text(l10n.homeLastReads, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
              const SizedBox(height: 10),
              SizedBox(
                height: 92,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: lastReadHistory.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (context, index) {
                    final entry = lastReadHistory[index];
                    return InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => SurahReaderScreen(
                            surahNumber: entry.surahNumber,
                            initialAyahNumber: entry.ayahNumber,
                          ),
                        ),
                      ),
                      child: Container(
                        width: 150,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          border: Border.all(color: colors.textColor.withValues(alpha: 0.15)),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.history, size: 14, color: brand),
                            const SizedBox(height: 5),
                            // Transliteration only, not the full Arabic +
                            // transliteration label — this compact history
                            // card doesn't have (and shouldn't force-fetch)
                            // the Surah list just to show an Arabic name;
                            // the full label appears once the reader
                            // actually opens the Surah (surah_reader_screen).
                            Text(
                              surahTransliterationLabel(ref, entry.surahNumber),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12.5, height: 1.15, fontWeight: FontWeight.w600),
                            ),
                            Text(
                              l10n.homeAyahOfTotal(entry.ayahNumber, entry.surahTotalAyahs),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 10.5, height: 1.15),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],

            const SizedBox(height: 20),
            Text(l10n.homeQuickLinks, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _QuickLinkChip(
                    icon: Icons.search,
                    label: l10n.homeSearch,
                    color: brand,
                    colors: colors,
                    onTap: () => Navigator.of(context)
                        .push(MaterialPageRoute(builder: (_) => const SearchScreen())),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _QuickLinkChip(
                    icon: Icons.format_color_text,
                    label: l10n.homeTajweedRules,
                    color: brand,
                    colors: colors,
                    onTap: () => Navigator.of(context)
                        .push(MaterialPageRoute(builder: (_) => const TajweedRulesScreen())),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _QuickLinkChip(
                    icon: Icons.tune,
                    label: l10n.homeReaderSettings,
                    color: brand,
                    colors: colors,
                    onTap: () => showReaderSettingsSheet(context),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(l10n.homeBookmarks, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                TextButton(
                  onPressed: () => Navigator.of(context)
                      .push(MaterialPageRoute(builder: (_) => const BookmarksScreen())),
                  child: Text(l10n.homeSeeAll),
                ),
              ],
            ),
            if (bookmarks.isEmpty)
              Text(
                l10n.homeNoBookmarksYet,
                style: TextStyle(fontSize: 12.5, color: colors.textColor.withValues(alpha: 0.6)),
              )
            else
              SizedBox(
                height: 74,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: bookmarks.length > 5 ? 5 : bookmarks.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (context, index) {
                    final b = bookmarks[index];
                    return InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => SurahReaderScreen(
                            surahNumber: b.surahNumber,
                            initialAyahNumber: b.ayahNumber,
                          ),
                        ),
                      ),
                      child: Container(
                        width: 148,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          border: Border.all(color: colors.textColor.withValues(alpha: 0.15)),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.star, size: 14, color: gold),
                            const SizedBox(height: 5),
                            Text(
                              surahTransliterationLabel(ref, b.surahNumber),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
                            ),
                            Text(l10n.homeAyahCount(b.ayahNumber), style: const TextStyle(fontSize: 10.5)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
      bottomNavigationBar: const IqraBottomNav(currentIndex: 0),
    );
  }
}

class _ContinueReadingCard extends ConsumerWidget {
  final Color brand;
  final Color gold;

  const _ContinueReadingCard({required this.brand, required this.gold});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lastRead = ref.watch(lastReadProvider).first;
    final progress = lastRead.ayahNumber / lastRead.surahTotalAyahs;
    final l10n = AppLocalizations.of(context)!;

    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => SurahReaderScreen(
            surahNumber: lastRead.surahNumber,
            initialAyahNumber: lastRead.ayahNumber,
          ),
        ),
      ),
      child: Container(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
        decoration: BoxDecoration(color: brand, borderRadius: BorderRadius.circular(18)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.homeContinueReading,
                        style: TextStyle(
                          fontSize: 10.5,
                          letterSpacing: 1,
                          color: Colors.white.withValues(alpha: 0.65),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        surahTransliterationLabel(ref, lastRead.surahNumber),
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                      Text(
                        l10n.homeAyahOfTotal(lastRead.ayahNumber, lastRead.surahTotalAyahs),
                        style: TextStyle(fontSize: 12.5, color: Colors.white.withValues(alpha: 0.8)),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.16), shape: BoxShape.circle),
                  child: const Icon(Icons.arrow_forward, color: Colors.white, size: 18),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(3),
              child: LinearProgressIndicator(
                value: progress.clamp(0, 1),
                minHeight: 5,
                backgroundColor: Colors.white.withValues(alpha: 0.22),
                valueColor: AlwaysStoppedAnimation(gold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StartReadingCard extends ConsumerWidget {
  final Color brand;

  const _StartReadingCard({required this.brand});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final surahName = surahTransliterationLabel(ref, 1);
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const SurahReaderScreen(surahNumber: 1)),
      ),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(color: brand, borderRadius: BorderRadius.circular(18)),
        child: Row(
          children: [
            Expanded(
              child: Text(
                l10n.homeBeginWithSurah(surahName),
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
              ),
            ),
            const Icon(Icons.arrow_forward, color: Colors.white),
          ],
        ),
      ),
    );
  }
}

/// A compact "Quick Links" shortcut — icon + label, stacked vertically,
/// for a one-tap jump to a commonly-used Quran reading action without
/// leaving Home.
class _QuickLinkChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final ReaderColors colors;
  final VoidCallback onTap;

  const _QuickLinkChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.colors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          border: Border.all(color: colors.textColor.withValues(alpha: 0.15)),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}

class _EntryTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final ReaderColors colors;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _EntryTile({
    required this.icon,
    required this.color,
    required this.colors,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: colors.textColor.withValues(alpha: 0.15)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(11)),
              child: Icon(icon, color: color, size: 19),
            ),
            const SizedBox(height: 10),
            Text(title, style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600)),
            const SizedBox(height: 3),
            Text(subtitle, style: TextStyle(fontSize: 11.5, color: colors.textColor.withValues(alpha: 0.6))),
          ],
        ),
      ),
    );
  }
}
