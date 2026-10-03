import 'dart:convert';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_local_datasource.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_remote_datasource.dart';
import 'package:quran_flutter/features/supplications/data/repositories/supplications_repository_impl.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';

const _fixturePath = 'test/features/supplications/fixtures/snapshot_fixture.json';

/// The bundled-asset stand-in: tests must not depend on the real
/// assets/supplications.json (it is regenerated independently).
Future<String> fixtureLoader() => File(_fixturePath).readAsString();

Map<String, dynamic> fixtureJson() => jsonDecode(File(_fixturePath).readAsStringSync()) as Map<String, dynamic>;

SupplicationsLocalDataSource fixtureBundled() => SupplicationsLocalDataSource(loader: fixtureLoader);

/// Overrides the repository provider with fixture-bundled, offline
/// (no cache, no remote) content.
Override fixtureRepositoryOverride() => supplicationsRepositoryProvider.overrideWithValue(
      SupplicationsRepositoryImpl(bundled: fixtureBundled()),
    );

/// A scripted remote: counts calls, returns/throws what it is told.
class FakeRemote implements SupplicationsRemoteDataSource {
  String version;
  Map<String, dynamic> content;
  Object? versionError;
  Object? contentError;
  int versionCalls = 0;
  int contentCalls = 0;

  FakeRemote({required this.version, required this.content});

  @override
  Future<String> fetchVersion() async {
    versionCalls++;
    if (versionError != null) throw versionError!;
    return version;
  }

  @override
  Future<Map<String, dynamic>> fetchContent() async {
    contentCalls++;
    if (contentError != null) throw contentError!;
    return content;
  }
}

SupplicationsLocalDataSource fixtureBundledWithoutMeta() => SupplicationsLocalDataSource(
      loader: () async => jsonEncode(fixtureJson()..remove('meta')),
    );
