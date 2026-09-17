import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/bookmarks/presentation/screens/bookmarks_screen.dart';
import 'package:quran_flutter/features/home/presentation/screens/home_screen.dart';
import 'package:quran_flutter/features/learning/presentation/screens/learn_coming_soon_screen.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/screens/surah_list_screen.dart';
import 'package:quran_flutter/features/settings/presentation/widgets/reader_settings_sheet.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// The app's persistent bottom navigation — Home | Quran | Learn |
/// Bookmarks | Settings — present on every top-level screen (never on
/// the Quran Reader itself, which stays distraction-free).
///
/// Navigation is plain `pushReplacement` between top-level screens
/// (matching the rest of this app's existing push-based navigation)
/// rather than an IndexedStack shell — simpler, and doesn't disturb the
/// Navigator-based flows already used for deep links from Search/
/// Bookmarks into the reader. Settings doesn't navigate anywhere: it
/// opens the Reader Settings bottom sheet directly, per the approved
/// design ("Settings should disappear after the user finishes making
/// changes so the Quran remains the primary focus").
class IqraBottomNav extends ConsumerWidget {
  /// Which tab is highlighted. `null` for a screen that isn't one of the
  /// five destinations (there currently is none, but this keeps the
  /// widget usable from a screen added later without forcing a fake
  /// selection).
  final int? currentIndex;

  const IqraBottomNav({required this.currentIndex, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final l10n = AppLocalizations.of(context)!;

    void go(Widget screen) {
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => screen));
    }

    return NavigationBar(
      selectedIndex: currentIndex ?? 0,
      backgroundColor: colors.chromeColor,
      onDestinationSelected: (index) {
        switch (index) {
          case 0:
            if (currentIndex != 0) go(const HomeScreen());
          case 1:
            if (currentIndex != 1) go(const SurahListScreen());
          case 2:
            go(const LearnComingSoonScreen());
          case 3:
            if (currentIndex != 3) go(const BookmarksScreen());
          case 4:
            showReaderSettingsSheet(context);
        }
      },
      destinations: [
        NavigationDestination(icon: const Icon(Icons.home_outlined), selectedIcon: const Icon(Icons.home), label: l10n.navHome),
        NavigationDestination(
          icon: const Icon(Icons.menu_book_outlined),
          selectedIcon: const Icon(Icons.menu_book),
          label: l10n.navQuran,
        ),
        NavigationDestination(icon: const Icon(Icons.school_outlined), selectedIcon: const Icon(Icons.school), label: l10n.navLearn),
        NavigationDestination(
          icon: const Icon(Icons.bookmark_outline),
          selectedIcon: const Icon(Icons.bookmark),
          label: l10n.navBookmarks,
        ),
        NavigationDestination(
          icon: const Icon(Icons.settings_outlined),
          selectedIcon: const Icon(Icons.settings),
          label: l10n.navSettings,
        ),
      ],
    );
  }
}
