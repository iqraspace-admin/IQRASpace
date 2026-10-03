import 'dart:convert';

import 'package:hive/hive.dart';
import 'package:quran_flutter/features/supplications/data/models/duas_snapshot.dart';

/// A validated snapshot read back from the cache.
class CachedDuas {
  final String version;
  final DateTime fetchedAt;
  final Map<String, dynamic> json;
  final DuasSnapshot snapshot;

  const CachedDuas({required this.version, required this.fetchedAt, required this.json, required this.snapshot});
}

/// Last-good remote snapshot, in one Hive entry (key [_key], so a write is
/// atomic): `{schema_version, version, fetched_at, json}`. Anything that
/// is unreadable, has a different [schemaVersion] (e.g. written by an
/// older/newer app version) or no longer validates reads as "no cache" —
/// the caller then falls back to the bundled asset.
class SupplicationsContentCache {
  static const schemaVersion = 1;
  static const _key = 'snapshot';

  final Box<String> _box;

  SupplicationsContentCache(this._box);

  CachedDuas? read() {
    try {
      final raw = _box.get(_key);
      if (raw == null) return null;
      final envelope = jsonDecode(raw);
      if (envelope is! Map<String, dynamic> || envelope['schema_version'] != schemaVersion) return null;
      final version = envelope['version'];
      final json = envelope['json'];
      if (version is! String || version.isEmpty || json is! Map<String, dynamic>) return null;
      return CachedDuas(
        version: version,
        fetchedAt: DateTime.tryParse('${envelope['fetched_at']}') ?? DateTime.fromMillisecondsSinceEpoch(0),
        json: json,
        snapshot: DuasSnapshot.parse(json),
      );
    } catch (_) {
      return null;
    }
  }

  Future<void> write({required String version, required DateTime fetchedAt, required Map<String, dynamic> json}) {
    return _box.put(
      _key,
      jsonEncode({
        'schema_version': schemaVersion,
        'version': version,
        'fetched_at': fetchedAt.toUtc().toIso8601String(),
        'json': json,
      }),
    );
  }
}
