import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_content_cache.dart';
import 'package:quran_flutter/features/supplications/data/repositories/supplications_repository_impl.dart';

import '../../../../test_helpers/hive_test_env.dart';
import '../../test_support.dart';

Map<String, dynamic> remoteSnapshot({String version = 'remote-v2', String title = 'Remote title'}) {
  final json = fixtureJson();
  json['version'] = version;
  ((json['categories'] as List).first['duas'] as List).first['title'] = title;
  return json;
}

String firstTitle(content) => content.categories.first.duas.first.title as String;

void main() {
  late SupplicationsContentCache cache;
  late DateTime now;

  setUp(() async {
    await setUpTestHive();
    cache = SupplicationsContentCache(Hive.box<String>(HiveBoxes.duasContentCacheBoxName));
    now = DateTime(2026, 10, 1, 12);
  });
  tearDown(tearDownTestHive);

  SupplicationsRepositoryImpl build({FakeRemote? remote, bool withCache = true}) => SupplicationsRepositoryImpl(
        bundled: fixtureBundled(),
        cache: withCache ? cache : null,
        remote: remote,
        now: () => now,
      );

  test('no cache and no remote: serves the bundled content with computed counts and bundled meta', () async {
    final content = await build().load();
    expect(firstTitle(content), 'Upon waking');
    expect(content.meta.title, 'Fixture Duas');
    expect(content.meta.categoryCount, 3);
    // 4 category entries' worth of duas, but the shared slug counts once.
    expect(content.categories.fold<int>(0, (s, c) => s + c.duas.length), 4);
    expect(content.meta.duaCount, 3);
  });

  test('remote disabled (null): never touches the network and refresh is a no-op', () async {
    final repo = build();
    await repo.load();
    expect(await repo.refresh(force: true), isFalse);
  });

  test('remote ok: caches the validated snapshot and emits it on updates', () async {
    final remote = FakeRemote(version: 'remote-v2', content: remoteSnapshot());
    final repo = build(remote: remote);

    final emitted = <String>[];
    repo.updates.listen((c) => emitted.add(firstTitle(c)));

    final first = await repo.load();
    expect(firstTitle(first), 'Upon waking'); // immediate answer is bundled

    expect(await repo.refresh(force: true), isTrue);
    await Future<void>.delayed(Duration.zero);

    expect(emitted, ['Remote title']);
    final cached = cache.read()!;
    expect(cached.version, 'remote-v2');
    expect(cached.snapshot.categories.first.duas.first.title, 'Remote title');
    // Meta text stays the bundled one.
    expect((await repo.load()).meta.title, 'Fixture Duas');
  });

  test('load() returns the cache immediately and revalidates in the background', () async {
    await cache.write(version: 'old', fetchedAt: now, json: remoteSnapshot(version: 'old', title: 'Cached title'));
    final remote = FakeRemote(version: 'remote-v2', content: remoteSnapshot(title: 'Fresh title'));
    final repo = build(remote: remote);

    final updated = repo.updates.first;
    expect(firstTitle(await repo.load()), 'Cached title');
    expect(firstTitle(await updated), 'Fresh title');
    expect(cache.read()!.version, 'remote-v2');
  });

  test('remote failure keeps the existing cache untouched', () async {
    await cache.write(version: 'old', fetchedAt: now, json: remoteSnapshot(version: 'old', title: 'Cached title'));
    final remote = FakeRemote(version: 'remote-v2', content: remoteSnapshot())..contentError = Exception('offline');
    final repo = build(remote: remote);
    await repo.load();

    expect(await repo.refresh(force: true), isFalse);
    expect(cache.read()!.version, 'old');
    expect(cache.read()!.snapshot.categories.first.duas.first.title, 'Cached title');
  });

  test('version check failure is swallowed', () async {
    final remote = FakeRemote(version: 'x', content: remoteSnapshot())..versionError = TimeoutException('t');
    final repo = build(remote: remote);
    final content = await repo.load();
    expect(await repo.refresh(force: true), isFalse);
    expect(firstTitle(content), 'Upon waking');
    expect(cache.read(), isNull);
  });

  test('an invalid remote snapshot is rejected and not cached', () async {
    final bad = remoteSnapshot();
    ((bad['categories'] as List).first as Map<String, dynamic>)['duas'] = [];
    final remote = FakeRemote(version: 'remote-v2', content: bad);
    final repo = build(remote: remote);
    await repo.load();

    expect(await repo.refresh(force: true), isFalse);
    expect(cache.read(), isNull);
    expect(remote.contentCalls, 1);
  });

  test('unchanged version: no second download, even when forced', () async {
    final remote = FakeRemote(version: 'remote-v2', content: remoteSnapshot());
    final repo = build(remote: remote);
    await repo.load();
    expect(await repo.refresh(force: true), isTrue);

    expect(await repo.refresh(force: true), isFalse);
    expect(remote.versionCalls, 2);
    expect(remote.contentCalls, 1);
  });

  test('a cache already at the remote version is not re-downloaded', () async {
    await cache.write(version: 'remote-v2', fetchedAt: now, json: remoteSnapshot());
    final remote = FakeRemote(version: 'remote-v2', content: remoteSnapshot());
    final repo = build(remote: remote);
    await repo.load();

    expect(await repo.refresh(force: true), isFalse);
    expect(remote.contentCalls, 0);
  });

  test('checks are rate-limited to once per hour unless forced', () async {
    final remote = FakeRemote(version: 'remote-v2', content: remoteSnapshot());
    final repo = build(remote: remote);
    await repo.load();
    await repo.refresh(); // first check of the process always runs
    expect(remote.versionCalls, 1);

    now = now.add(const Duration(minutes: 30));
    await repo.refresh();
    expect(remote.versionCalls, 1);

    await repo.refresh(force: true);
    expect(remote.versionCalls, 2);

    now = now.add(const Duration(minutes: 61));
    await repo.refresh();
    expect(remote.versionCalls, 3);
  });

  test('corrupt cache is ignored: falls back to bundled', () async {
    await Hive.box<String>(HiveBoxes.duasContentCacheBoxName).put('snapshot', '{not json');
    final content = await build().load();
    expect(firstTitle(content), 'Upon waking');
  });

  test('cache with an unknown schema_version is ignored', () async {
    await Hive.box<String>(HiveBoxes.duasContentCacheBoxName).put(
      'snapshot',
      jsonEncode({
        'schema_version': 999,
        'version': 'v',
        'fetched_at': now.toIso8601String(),
        'json': remoteSnapshot(title: 'Future cache'),
      }),
    );
    expect(cache.read(), isNull);
    expect(firstTitle(await build().load()), 'Upon waking');
  });

  test('cache whose content no longer validates is ignored', () async {
    await Hive.box<String>(HiveBoxes.duasContentCacheBoxName).put(
      'snapshot',
      jsonEncode({
        'schema_version': SupplicationsContentCache.schemaVersion,
        'version': 'v',
        'fetched_at': now.toIso8601String(),
        'json': {'categories': []},
      }),
    );
    expect(firstTitle(await build().load()), 'Upon waking');
  });
}
