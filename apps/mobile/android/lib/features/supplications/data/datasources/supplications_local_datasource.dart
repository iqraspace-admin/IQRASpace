import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;
import 'package:quran_flutter/features/supplications/data/models/duas_snapshot.dart';
import 'package:quran_flutter/features/supplications/data/models/supplications_meta_model.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplications_meta.dart';
import 'package:quran_flutter/features/supplications/domain/repositories/supplications_repository.dart';

/// Builds a [SupplicationsContent] from [meta] (text only) and
/// [categories], computing the counts: `duaCount` is the number of
/// DISTINCT dua slugs, since one dua may appear in several categories.
SupplicationsContent buildContent(SupplicationsMeta meta, List<SupplicationCategory> categories) {
  final slugs = <String>{for (final c in categories) for (final d in c.duas) d.slug};
  return (
    meta: meta.withCounts(categoryCount: categories.length, duaCount: slugs.length),
    categories: categories,
  );
}

/// The bundled fallback — last in the resolution order (fresh remote ->
/// last good cache -> bundled), and the only source of the meta text
/// (the remote snapshot has none). Same snapshot shape as the remote
/// RPC plus a top-level `meta` object. [loader] is injectable so tests
/// do not depend on the real asset.
class SupplicationsLocalDataSource {
  static const _assetPath = 'assets/supplications.json';

  final Future<String> Function() _loader;

  SupplicationsLocalDataSource({Future<String> Function()? loader})
      : _loader = loader ?? (() => rootBundle.loadString(_assetPath));

  // Parsing is cheap but non-zero; caching the decoded result means every
  // caller after the first reuses the same parsed objects.
  Future<SupplicationsContent>? _cached;

  Future<SupplicationsContent> load() {
    return _cached ??= _load();
  }

  Future<SupplicationsContent> _load() async {
    final decoded = jsonDecode(await _loader());
    final snapshot = DuasSnapshot.parse(decoded);
    final rawMeta = (decoded as Map<String, dynamic>)['meta'];
    final meta = rawMeta is Map<String, dynamic> ? SupplicationsMetaModel.fromJson(rawMeta) : SupplicationsMeta.empty;
    return buildContent(meta, snapshot.categories);
  }
}
