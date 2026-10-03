import 'dart:async';

import 'package:flutter/foundation.dart' show debugPrint, kDebugMode;
import 'package:quran_flutter/features/supplications/data/datasources/supplications_content_cache.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_local_datasource.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_remote_datasource.dart';
import 'package:quran_flutter/features/supplications/data/models/duas_snapshot.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplications_meta.dart';
import 'package:quran_flutter/features/supplications/domain/repositories/supplications_repository.dart';

/// Resolution order: fresh remote (validated) -> last good cache ->
/// bundled asset, stale-while-revalidate: [load] answers from cache/
/// bundled immediately and the remote is checked in the background.
class SupplicationsRepositoryImpl implements SupplicationsRepository {
  static const minCheckInterval = Duration(hours: 1);

  final SupplicationsLocalDataSource bundled;
  final SupplicationsContentCache? cache;
  final SupplicationsRemoteDataSource? remote;
  final DateTime Function() _now;

  final _updates = StreamController<SupplicationsContent>.broadcast();
  Future<SupplicationsContent>? _initial;
  Future<bool>? _inflight;
  String? _currentVersion;
  DateTime? _lastCheck;

  SupplicationsRepositoryImpl({
    required this.bundled,
    this.cache,
    this.remote,
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;

  @override
  Stream<SupplicationsContent> get updates => _updates.stream;

  @override
  Future<SupplicationsContent> loadBundled() => bundled.load();

  @override
  Future<SupplicationsContent> load() {
    return _initial ??= _loadInitial().then((content) {
      scheduleMicrotask(() => refresh());
      return content;
    });
  }

  Future<SupplicationsMeta> _bundledMeta() async {
    try {
      return (await bundled.load()).meta;
    } catch (e) {
      _log('bundled meta unavailable: $e');
      return SupplicationsMeta.empty;
    }
  }

  Future<SupplicationsContent> _loadInitial() async {
    final cached = cache?.read();
    if (cached != null) {
      _currentVersion = cached.version;
      return buildContent(await _bundledMeta(), cached.snapshot.categories);
    }
    return await bundled.load();
  }

  @override
  Future<bool> refresh({bool force = false}) {
    if (remote == null) return Future.value(false);
    final inflight = _inflight;
    if (inflight != null) return inflight;
    final last = _lastCheck;
    if (!force && last != null && _now().difference(last) < minCheckInterval) return Future.value(false);
    _lastCheck = _now();
    return _inflight = _doRefresh().whenComplete(() => _inflight = null);
  }

  Future<bool> _doRefresh() async {
    try {
      // Make sure the cached version is known before comparing.
      if (_initial == null) {
        await load();
      } else {
        await _initial;
      }
      final remoteVersion = await remote!.fetchVersion();
      if (remoteVersion == _currentVersion) return false;

      final json = await remote!.fetchContent();
      final snapshot = DuasSnapshot.parse(json); // validates; throws on bad content
      final version = snapshot.version ?? remoteVersion;

      await cache?.write(version: version, fetchedAt: _now(), json: json);
      _currentVersion = version;
      final content = buildContent(await _bundledMeta(), snapshot.categories);
      if (!_updates.isClosed) _updates.add(content);
      return true;
    } catch (e) {
      _log('duas refresh failed: $e');
      return false;
    }
  }

  void _log(String message) {
    if (kDebugMode) debugPrint('[duas] $message');
  }
}
