import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/constants/dua_translation_language.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart' show appLanguageProvider;
import 'package:quran_flutter/features/supplications/data/datasources/supplications_content_cache.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_local_datasource.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_remote_datasource.dart';
import 'package:quran_flutter/features/supplications/data/repositories/supplications_repository_impl.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';
import 'package:quran_flutter/features/supplications/domain/repositories/supplications_repository.dart';

/// UI -> repository -> (remote | Hive cache | bundled asset). Remote is
/// only wired up when both DUAS_SUPABASE_URL and DUAS_SUPABASE_ANON_KEY
/// were supplied via --dart-define; otherwise the app is purely offline.
final supplicationsRepositoryProvider = Provider<SupplicationsRepository>((ref) {
  const config = DuasRemoteConfig.fromEnvironment;
  final cacheBoxOpen = Hive.isBoxOpen(HiveBoxes.duasContentCacheBoxName);
  final repository = SupplicationsRepositoryImpl(
    bundled: SupplicationsLocalDataSource(),
    cache: cacheBoxOpen ? SupplicationsContentCache(HiveBoxes.duasContentCacheBox) : null,
    remote: config.isEnabled ? SupplicationsRemoteDataSource.create(config) : null,
  );
  return repository;
});

/// The active Duas content: emits the cached/bundled content first, then
/// again whenever a fresh remote snapshot has been validated and cached,
/// so screens refresh in place.
final supplicationsContentProvider = StreamProvider<SupplicationsContent>((ref) {
  final repository = ref.watch(supplicationsRepositoryProvider);
  final controller = StreamController<SupplicationsContent>();
  // Subscribe before load() so an update can never slip past.
  final sub = repository.updates.listen(controller.add);
  ref.onDispose(() {
    sub.cancel();
    controller.close();
  });
  repository.load().then(controller.add, onError: controller.addError);
  return controller.stream;
});

/// Looks up one category by [id] out of the already-loaded content.
final supplicationCategoryProvider = Provider.family<SupplicationCategory?, String>((ref, id) {
  final content = ref.watch(supplicationsContentProvider).valueOrNull;
  if (content == null) return null;
  for (final category in content.categories) {
    if (category.id == id) return category;
  }
  return null;
});

/// Whether the Duas categories screen shows a grid-of-tiles or a flat
/// list — toggled from that screen's AppBar, persisted the same way as
/// [DuaTasbeehEnabledNotifier].
enum DuaCategoryViewMode { grid, list }

class DuaCategoryViewModeNotifier extends StateNotifier<DuaCategoryViewMode> {
  static const _key = 'supplicationsCategoryViewMode';

  DuaCategoryViewModeNotifier() : super(_fromName(HiveBoxes.settingsBox.get(_key) as String?));

  static DuaCategoryViewMode _fromName(String? name) {
    return DuaCategoryViewMode.values.firstWhere(
      (m) => m.name == name,
      orElse: () => DuaCategoryViewMode.grid,
    );
  }

  void setMode(DuaCategoryViewMode mode) {
    state = mode;
    HiveBoxes.settingsBox.put(_key, mode.name);
  }
}

final duaCategoryViewModeProvider =
    StateNotifierProvider<DuaCategoryViewModeNotifier, DuaCategoryViewMode>(
  (ref) => DuaCategoryViewModeNotifier(),
);

/// Whether the Duas reading screen shows its tap-to-count tasbeeh badge
/// — off by default (the badge is a lightweight extra, not every reader
/// wants it on screen), toggled from the reading-settings sheet.
class DuaTasbeehEnabledNotifier extends StateNotifier<bool> {
  static const _key = 'supplicationsTasbeehEnabled';

  DuaTasbeehEnabledNotifier() : super(HiveBoxes.settingsBox.get(_key) as bool? ?? false);

  void setEnabled(bool enabled) {
    state = enabled;
    HiveBoxes.settingsBox.put(_key, enabled);
  }
}

final duaTasbeehEnabledProvider = StateNotifierProvider<DuaTasbeehEnabledNotifier, bool>(
  (ref) => DuaTasbeehEnabledNotifier(),
);

/// Which translation the Duas screens show. Persisted. When the user has
/// never chosen, defaults to Urdu for an Urdu-language app and English
/// otherwise (what the screen did before this became a setting).
class DuaTranslationLanguageNotifier extends StateNotifier<DuaTranslationLanguage> {
  static const _key = 'supplicationsTranslationLanguage';

  DuaTranslationLanguageNotifier(DuaTranslationLanguage fallback)
      : super(_fromName(HiveBoxes.settingsBox.get(_key) as String?, fallback));

  static DuaTranslationLanguage _fromName(String? name, DuaTranslationLanguage fallback) {
    return DuaTranslationLanguage.values.firstWhere((l) => l.name == name, orElse: () => fallback);
  }

  void setLanguage(DuaTranslationLanguage language) {
    state = language;
    HiveBoxes.settingsBox.put(_key, language.name);
  }
}

final duaTranslationLanguageProvider =
    StateNotifierProvider<DuaTranslationLanguageNotifier, DuaTranslationLanguage>((ref) {
  final appLanguage = ref.read(appLanguageProvider);
  return DuaTranslationLanguageNotifier(
    appLanguage == AppLanguage.urdu ? DuaTranslationLanguage.urdu : DuaTranslationLanguage.english,
  );
});

/// Show/hide the transliteration line on every Dua. Persisted; default on.
class DuaTransliterationEnabledNotifier extends StateNotifier<bool> {
  static const _key = 'supplicationsTransliterationEnabled';

  DuaTransliterationEnabledNotifier() : super(HiveBoxes.settingsBox.get(_key) as bool? ?? true);

  void setEnabled(bool enabled) {
    state = enabled;
    HiveBoxes.settingsBox.put(_key, enabled);
  }
}

final duaTransliterationEnabledProvider =
    StateNotifierProvider<DuaTransliterationEnabledNotifier, bool>(
  (ref) => DuaTransliterationEnabledNotifier(),
);
