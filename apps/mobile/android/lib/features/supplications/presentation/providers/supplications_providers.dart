import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/transliteration_script.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_local_datasource.dart';
import 'package:quran_flutter/features/supplications/data/repositories/supplications_repository_impl.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';
import 'package:quran_flutter/features/supplications/domain/repositories/supplications_repository.dart';

final supplicationsRepositoryProvider = Provider<SupplicationsRepository>((ref) {
  return SupplicationsRepositoryImpl(SupplicationsLocalDataSource());
});

/// Loads (and, via the repository's own caching, parses only once) the
/// bundled Supplications content.
final supplicationsContentProvider = FutureProvider<SupplicationsContent>((ref) {
  return ref.watch(supplicationsRepositoryProvider).load();
});

/// Looks up one category by [id] out of the already-loaded content — for
/// the category detail screen, which is only ever opened after the list
/// screen has successfully loaded categories.
final supplicationCategoryProvider = Provider.family<SupplicationCategory?, String>((ref, id) {
  final content = ref.watch(supplicationsContentProvider).valueOrNull;
  if (content == null) return null;
  for (final category in content.categories) {
    if (category.id == id) return category;
  }
  return null;
});

class TransliterationScriptNotifier extends StateNotifier<TransliterationScript> {
  static const _key = 'supplicationsScript';

  TransliterationScriptNotifier()
      : super(_fromName(HiveBoxes.settingsBox.get(_key) as String?));

  static TransliterationScript _fromName(String? name) {
    return TransliterationScript.values.firstWhere(
      (s) => s.name == name,
      orElse: () => defaultTransliterationScript,
    );
  }

  void setScript(TransliterationScript script) {
    state = script;
    HiveBoxes.settingsBox.put(_key, script.name);
  }
}

/// The Supplications feature's single, session-wide reading-script
/// choice (Latin/Telugu/Urdu) — persisted so it carries over between
/// launches. Deliberately global rather than per-card: see
/// TransliterationScript's doc comment.
final transliterationScriptProvider =
    StateNotifierProvider<TransliterationScriptNotifier, TransliterationScript>(
  (ref) => TransliterationScriptNotifier(),
);
