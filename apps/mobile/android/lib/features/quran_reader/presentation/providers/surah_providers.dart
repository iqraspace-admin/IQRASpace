import 'dart:convert';

import 'dart:ui';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/constants/reader_mode.dart';
import 'package:quran_flutter/core/constants/reciters.dart';
import 'package:quran_flutter/core/constants/translation_languages.dart';
import 'package:quran_flutter/core/network/dio_client.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/theme/arabic_fonts.dart';
import 'package:quran_flutter/features/quran_reader/data/datasources/surah_local_datasource.dart';
import 'package:quran_flutter/features/quran_reader/data/datasources/surah_remote_datasource.dart';
import 'package:quran_flutter/features/quran_reader/data/repositories/surah_repository_impl.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/ayah.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/last_read.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/surah_summary.dart';
import 'package:quran_flutter/features/quran_reader/domain/repositories/surah_repository.dart';
import 'package:quran_flutter/features/quran_reader/domain/usecases/get_surah.dart';
import 'package:quran_flutter/features/quran_reader/domain/usecases/get_surah_list.dart';

final dioProvider = Provider<Dio>((ref) => buildDioClient());

/// Second client for Quran.com's public v4 API — Roman Urdu translation
/// only (see dio_client.dart's buildQuranComDioClient for why this isn't
/// the same host as [dioProvider]).
final quranComDioProvider = Provider<Dio>((ref) => buildQuranComDioClient());

final surahRepositoryProvider = Provider<SurahRepository>((ref) {
  final dio = ref.watch(dioProvider);
  final quranComDio = ref.watch(quranComDioProvider);
  return SurahRepositoryImpl(
    remote: SurahRemoteDataSource(dio, quranComDio),
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

class TranslationLanguageNotifier extends StateNotifier<TranslationLanguage> {
  static const _key = 'translationLanguage';

  // Defaults to OFF — the Quran text is the reader's primary focus;
  // Reader Settings > Translation turns it on and picks a language.
  TranslationLanguageNotifier()
      : super(_fromName(HiveBoxes.settingsBox.get(_key) as String?));

  static TranslationLanguage _fromName(String? name) {
    return TranslationLanguage.values.firstWhere(
      (l) => l.name == name,
      orElse: () => defaultTranslationLanguage,
    );
  }

  void setLanguage(TranslationLanguage language) {
    state = language;
    HiveBoxes.settingsBox.put(_key, language.name);
  }
}

/// Off, English, or Roman Urdu — the single source of truth for whether
/// and which translation renders under each ayah.
final translationLanguageProvider =
    StateNotifierProvider<TranslationLanguageNotifier, TranslationLanguage>(
  (ref) => TranslationLanguageNotifier(),
);

class TajweedEnabledNotifier extends StateNotifier<bool> {
  static const _key = 'tajweedEnabled';

  // On by default — Tajweed coloring is a headline feature of this
  // reader.
  TajweedEnabledNotifier() : super((HiveBoxes.settingsBox.get(_key) as bool?) ?? true);

  void setEnabled(bool enabled) {
    state = enabled;
    HiveBoxes.settingsBox.put(_key, enabled);
  }
}

final tajweedEnabledProvider = StateNotifierProvider<TajweedEnabledNotifier, bool>(
  (ref) => TajweedEnabledNotifier(),
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

/// A short history of recently-read surahs, most-recent-first — powers
/// both the Home screen's "Continue Reading" hero card (the first entry)
/// and its "Last Reads" row (the rest). One entry per surah: reading it
/// again moves its existing entry to the front instead of adding a
/// duplicate.
class LastReadNotifier extends StateNotifier<List<LastRead>> {
  static const _key = 'lastReadHistory';
  static const _maxEntries = 8;

  LastReadNotifier() : super(_load());

  static List<LastRead> _load() {
    final raw = HiveBoxes.settingsBox.get(_key) as String?;
    if (raw == null) return const [];
    try {
      final list = jsonDecode(raw) as List;
      return list.map((e) => LastRead.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      // Corrupt/old-shape entry (including the single-object shape this
      // key used before "Last Reads" became a history) — treat as
      // "nothing read yet" rather than crashing the Home screen.
      return const [];
    }
  }

  void update({
    required int surahNumber,
    required int ayahNumber,
    required String surahEnglishName,
    required int surahTotalAyahs,
  }) {
    final entry = LastRead(
      surahNumber: surahNumber,
      ayahNumber: ayahNumber,
      surahEnglishName: surahEnglishName,
      surahTotalAyahs: surahTotalAyahs,
      updatedAt: DateTime.now(),
    );
    final withoutThisSurah = state.where((e) => e.surahNumber != surahNumber);
    state = [entry, ...withoutThisSurah].take(_maxEntries).toList();
    HiveBoxes.settingsBox.put(_key, jsonEncode(state.map((e) => e.toJson()).toList()));
  }
}

/// Recently-read surahs, most-recent-first. SurahReaderScreen updates
/// this as the reader scrolls (see its ItemPositionsListener) and once
/// more on dispose.
final lastReadProvider = StateNotifierProvider<LastReadNotifier, List<LastRead>>(
  (ref) => LastReadNotifier(),
);

class AppLanguageNotifier extends StateNotifier<AppLanguage> {
  static const _key = 'appLanguage';

  AppLanguageNotifier() : super(_initial());

  static AppLanguage _initial() {
    final stored = HiveBoxes.settingsBox.get(_key) as String?;
    if (stored != null) {
      return AppLanguage.values.firstWhere(
        (l) => l.name == stored,
        orElse: () => defaultAppLanguage,
      );
    }
    // First run, nothing stored yet — use the device's language if it's
    // one of the three this app supports, else English (per spec).
    return appLanguageForLocale(PlatformDispatcher.instance.locale) ?? defaultAppLanguage;
  }

  void setLanguage(AppLanguage language) {
    state = language;
    HiveBoxes.settingsBox.put(_key, language.name);
  }
}

/// The app's UI language (English/Telugu/Urdu) — drives MaterialApp's
/// locale (see main.dart) and every AppLocalizations lookup. Entirely
/// separate from [translationLanguageProvider], which only controls the
/// ayah-translation line.
final appLanguageProvider = StateNotifierProvider<AppLanguageNotifier, AppLanguage>(
  (ref) => AppLanguageNotifier(),
);

/// The 114-surah list keyed by number, once loaded — lets a widget that
/// only holds a `surahNumber` (a bookmark, a last-read entry, a search
/// hit) resolve the Arabic Surah name live via [SurahNameLabel], without
/// each of those entities needing to store it themselves.
final surahByNumberProvider = Provider<Map<int, SurahSummary>>((ref) {
  final list = ref.watch(surahListProvider).valueOrNull ?? const [];
  return {for (final s in list) s.number: s};
});

class ReaderModeNotifier extends StateNotifier<ReaderMode> {
  static const _key = 'readerMode';

  ReaderModeNotifier() : super(_fromName(HiveBoxes.settingsBox.get(_key) as String?));

  static ReaderMode _fromName(String? name) {
    return ReaderMode.values.firstWhere((m) => m.name == name, orElse: () => defaultReaderMode);
  }

  void setMode(ReaderMode mode) {
    state = mode;
    HiveBoxes.settingsBox.put(_key, mode.name);
  }
}

/// The Surah Reader's top-level Listening / Reading / Reading+Listening
/// choice — see `lib/core/constants/reader_mode.dart`.
final readerModeProvider = StateNotifierProvider<ReaderModeNotifier, ReaderMode>(
  (ref) => ReaderModeNotifier(),
);

class ListeningTrackNotifier extends StateNotifier<ListeningTrack> {
  static const _key = 'listeningTrack';

  ListeningTrackNotifier() : super(_fromName(HiveBoxes.settingsBox.get(_key) as String?));

  static ListeningTrack _fromName(String? name) {
    return ListeningTrack.values.firstWhere((t) => t.name == name, orElse: () => defaultListeningTrack);
  }

  void setTrack(ListeningTrack track) {
    state = track;
    HiveBoxes.settingsBox.put(_key, track.name);
  }
}

/// Listening Mode's "Recitation Only" vs "Recitation + Urdu Translation"
/// choice — see `lib/core/constants/urdu_surah_audio.dart`.
final listeningTrackProvider = StateNotifierProvider<ListeningTrackNotifier, ListeningTrack>(
  (ref) => ListeningTrackNotifier(),
);
