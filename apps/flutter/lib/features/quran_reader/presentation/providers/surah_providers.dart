import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/reciters.dart';
import 'package:quran_flutter/core/network/dio_client.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/theme/arabic_fonts.dart';
import 'package:quran_flutter/features/quran_reader/data/datasources/surah_local_datasource.dart';
import 'package:quran_flutter/features/quran_reader/data/datasources/surah_remote_datasource.dart';
import 'package:quran_flutter/features/quran_reader/data/repositories/surah_repository_impl.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/ayah.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/surah_summary.dart';
import 'package:quran_flutter/features/quran_reader/domain/repositories/surah_repository.dart';
import 'package:quran_flutter/features/quran_reader/domain/usecases/get_surah.dart';
import 'package:quran_flutter/features/quran_reader/domain/usecases/get_surah_list.dart';

final dioProvider = Provider<Dio>((ref) => buildDioClient());

final surahRepositoryProvider = Provider<SurahRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return SurahRepositoryImpl(
    remote: SurahRemoteDataSource(dio),
    local: SurahLocalDataSource(HiveBoxes.surahBox),
  );
});

final getSurahProvider = Provider<GetSurah>((ref) {
  return GetSurah(ref.watch(surahRepositoryProvider));
});

/// [surahProvider]'s family key — a record instead of a bare int because
/// the fetched/cached audio depends on which reciter is selected too
/// (see reciterEditionProvider and SurahLocalDataSource's cache key).
typedef SurahRequest = ({int surahNumber, String reciterEdition});

/// Fetches (offline-first) the ayahs of one surah with one reciter's
/// audio.
final surahProvider = FutureProvider.family<List<Ayah>, SurahRequest>((ref, request) {
  return ref.watch(getSurahProvider)(request.surahNumber, reciterEdition: request.reciterEdition);
});

final getSurahListProvider = Provider<GetSurahList>((ref) {
  return GetSurahList(ref.watch(surahRepositoryProvider));
});

/// The 114-surah navigation list, offline-first the same way as
/// [surahProvider].
final surahListProvider = FutureProvider<List<SurahSummary>>((ref) {
  return ref.watch(getSurahListProvider)();
});

class ReaderThemeModeNotifier extends StateNotifier<ReaderThemeMode> {
  static const _key = 'themeMode';

  ReaderThemeModeNotifier()
      : super(_fromName(HiveBoxes.settingsBox.get(_key) as String?));

  static ReaderThemeMode _fromName(String? name) {
    return ReaderThemeMode.values.firstWhere(
      (mode) => mode.name == name,
      orElse: () => ReaderThemeMode.light,
    );
  }

  void setMode(ReaderThemeMode mode) {
    state = mode;
    HiveBoxes.settingsBox.put(_key, mode.name);
  }
}

final readerThemeModeProvider =
    StateNotifierProvider<ReaderThemeModeNotifier, ReaderThemeMode>(
  (ref) => ReaderThemeModeNotifier(),
);

class FontSizeNotifier extends StateNotifier<double> {
  static const _key = 'fontSize';
  static const double min = 18;
  static const double max = 40;

  FontSizeNotifier() : super((HiveBoxes.settingsBox.get(_key) as double?) ?? 26);

  void setSize(double size) {
    // num.clamp returns num, not double — cast explicitly so this keeps
    // typing as double for `state` and the Hive write below.
    state = size.clamp(min, max).toDouble();
    HiveBoxes.settingsBox.put(_key, state);
  }
}

final fontSizeProvider = StateNotifierProvider<FontSizeNotifier, double>(
  (ref) => FontSizeNotifier(),
);

class ShowTranslationNotifier extends StateNotifier<bool> {
  static const _key = 'showTranslation';

  // Defaults to on — most readers using a translation-capable app want
  // it visible; Settings can turn it off for an Arabic-only view.
  ShowTranslationNotifier() : super((HiveBoxes.settingsBox.get(_key) as bool?) ?? true);

  void setShown(bool shown) {
    state = shown;
    HiveBoxes.settingsBox.put(_key, shown);
  }
}

final showTranslationProvider = StateNotifierProvider<ShowTranslationNotifier, bool>(
  (ref) => ShowTranslationNotifier(),
);

class ShowBookmarkIconsNotifier extends StateNotifier<bool> {
  static const _key = 'showBookmarkIcons';

  ShowBookmarkIconsNotifier() : super((HiveBoxes.settingsBox.get(_key) as bool?) ?? true);

  void setShown(bool shown) {
    state = shown;
    HiveBoxes.settingsBox.put(_key, shown);
  }
}

final showBookmarkIconsProvider = StateNotifierProvider<ShowBookmarkIconsNotifier, bool>(
  (ref) => ShowBookmarkIconsNotifier(),
);

class ArabicFontNotifier extends StateNotifier<String> {
  static const _key = 'arabicFontFamily';

  ArabicFontNotifier()
      : super((HiveBoxes.settingsBox.get(_key) as String?) ?? defaultArabicFontFamily);

  void setFamily(String familyName) {
    state = familyName;
    HiveBoxes.settingsBox.put(_key, familyName);
  }
}

final arabicFontFamilyProvider = StateNotifierProvider<ArabicFontNotifier, String>(
  (ref) => ArabicFontNotifier(),
);

class ReciterNotifier extends StateNotifier<String> {
  static const _key = 'reciterEdition';

  ReciterNotifier()
      : super((HiveBoxes.settingsBox.get(_key) as String?) ?? defaultReciterIdentifier);

  void setReciter(String identifier) {
    state = identifier;
    HiveBoxes.settingsBox.put(_key, identifier);
  }
}

/// Which reciter's audio to fetch — part of [SurahRequest], so changing
/// this in Settings naturally invalidates surahProvider's cached
/// FutureProvider entries (a new family key) and re-fetches with the new
/// reciter's audio, without needing any manual cache-busting.
final reciterEditionProvider = StateNotifierProvider<ReciterNotifier, String>(
  (ref) => ReciterNotifier(),
);

class ReadModeNotifier extends StateNotifier<bool> {
  static const _key = 'readMode';

  // Off by default — bookmarks/audio/translation are the normal
  // experience; Read Mode is an opt-in, distraction-free view.
  ReadModeNotifier() : super((HiveBoxes.settingsBox.get(_key) as bool?) ?? false);

  void setEnabled(bool enabled) {
    state = enabled;
    HiveBoxes.settingsBox.put(_key, enabled);
  }
}

/// When on, AyahRichText renders Arabic text only — no bookmark star, no
/// audio-play icon, no translation line — and SurahReaderScreen hides
/// its "play whole surah" action too, since that also drives per-ayah
/// audio. Font size and theme controls are unaffected: those aren't
/// ayah-level content actions.
final readModeProvider = StateNotifierProvider<ReadModeNotifier, bool>(
  (ref) => ReadModeNotifier(),
);

/// Whether auto-scroll is currently running. Deliberately NOT persisted
/// — this is a "start scrolling now" action, not a standing preference,
/// so a fresh app launch always starts stopped.
final autoScrollEnabledProvider = StateProvider<bool>((ref) => false);

class AutoScrollSpeedNotifier extends StateNotifier<double> {
  static const _key = 'autoScrollSpeed';
  static const double min = 10; // px/second — barely creeping
  static const double max = 120; // px/second — brisk

  AutoScrollSpeedNotifier() : super((HiveBoxes.settingsBox.get(_key) as double?) ?? 30);

  void setSpeed(double pixelsPerSecond) {
    state = pixelsPerSecond.clamp(min, max).toDouble();
    HiveBoxes.settingsBox.put(_key, state);
  }
}

/// Auto-scroll speed in pixels/second, persisted so a chosen pace
/// carries over between sessions even though "on/off" itself doesn't.
final autoScrollSpeedProvider = StateNotifierProvider<AutoScrollSpeedNotifier, double>(
  (ref) => AutoScrollSpeedNotifier(),
);
