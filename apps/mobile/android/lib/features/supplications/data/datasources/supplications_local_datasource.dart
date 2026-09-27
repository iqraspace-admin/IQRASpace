import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;
import 'package:quran_flutter/features/supplications/data/models/supplication_category_model.dart';
import 'package:quran_flutter/features/supplications/data/models/supplications_meta_model.dart';
import 'package:quran_flutter/features/supplications/domain/repositories/supplications_repository.dart';

/// Reads the Supplications content from the bundled asset
/// (assets/supplications.json — see pubspec.yaml) — offline-first by
/// construction, since there is no remote counterpart to fall back to or
/// go stale against.
class SupplicationsLocalDataSource {
  static const _assetPath = 'assets/supplications.json';

  // Parsing 88 duas' worth of JSON is cheap but non-zero; caching the
  // decoded result means every screen/rebuild that asks for it after the
  // first reuses the same parsed objects instead of re-reading the asset
  // and re-parsing.
  Future<SupplicationsContent>? _cached;

  Future<SupplicationsContent> load() {
    return _cached ??= _load();
  }

  Future<SupplicationsContent> _load() async {
    final raw = await rootBundle.loadString(_assetPath);
    final decoded = jsonDecode(raw) as Map<String, dynamic>;

    final meta = SupplicationsMetaModel.fromJson(decoded['meta'] as Map<String, dynamic>);
    final categories = (decoded['categories'] as List)
        .map((e) => SupplicationCategoryModel.fromJson(e as Map<String, dynamic>))
        .toList();

    return (meta: meta, categories: categories);
  }
}
