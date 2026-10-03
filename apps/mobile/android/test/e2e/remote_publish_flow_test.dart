// End-to-end: admin edit -> backend -> the app's real remote data source +
// repository -> updated Dua shows up, with no app release.
//
// Needs the local dev backend (it runs the real Supabase migrations):
//   node apps/site/supabase/duas/e2e_publish_flow.mjs
// which starts it, sets DUAS_E2E_URL and runs this file. Skipped otherwise.
import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_local_datasource.dart';
import 'package:quran_flutter/features/supplications/data/datasources/supplications_remote_datasource.dart';
import 'package:quran_flutter/features/supplications/data/repositories/supplications_repository_impl.dart';
import 'package:quran_flutter/features/supplications/domain/entities/dua.dart';
import 'package:quran_flutter/features/supplications/domain/repositories/supplications_repository.dart';

Future<Map<String, dynamic>?> adminUpdate(String base, Map<String, Object?> body) async {
  final r = await Dio().post<String>(
    '$base/__dev/admin-update',
    data: jsonEncode(body),
    options: Options(headers: {'Content-Type': 'application/json'}, responseType: ResponseType.plain),
  );
  return jsonDecode(r.data!) as Map<String, dynamic>?;
}

Dua? findDua(SupplicationsContent c, String slug) {
  for (final cat in c.categories) {
    for (final d in cat.duas) {
      if (d.slug == slug) return d;
    }
  }
  return null;
}

void main() {
  final base = Platform.environment['DUAS_E2E_URL'];

  test('an admin edit reaches the app without a release; unpublish removes it', () async {
    final remote = SupplicationsRemoteDataSource.create(
      DuasRemoteConfig(url: base!, anonKey: 'public-anon-key-for-test'),
    );
    final repo = SupplicationsRepositoryImpl(
      bundled: SupplicationsLocalDataSource(
        loader: () => File('assets/supplications.json').readAsString(),
      ),
      remote: remote,
    );

    // The app starts from the bundled data.
    final bundled = await repo.load();
    final slug = bundled.categories.firstWhere((c) => c.id == 'waking').duas.first.slug;
    final original = findDua(bundled, slug)!.translationEnglish;

    SupplicationsContent? latest;
    final sub = repo.updates.listen((c) => latest = c);

    // 1. First refresh pulls the published content from the backend.
    expect(await repo.refresh(force: true), isTrue, reason: 'first remote fetch applies');
    await pumpEventQueue();
    expect(findDua(latest!, slug)!.translationEnglish, original);

    // 2. Nothing changed on the backend -> no re-download.
    expect(await repo.refresh(force: true), isFalse);

    // 3. Admin edits + publishes a correction (real triggers/RLS run in the backend).
    final edited = 'E2E-EDIT ${DateTime.now().microsecondsSinceEpoch}: corrected translation';
    final row = await adminUpdate(base, {'slug': slug, 'translation_en': edited, 'status': 'published'});
    expect(row?['translation_en'], edited);

    // 4. The app refreshes (no new APK) and shows the new text.
    expect(await repo.refresh(force: true), isTrue);
    await pumpEventQueue();
    expect(findDua(latest!, slug)!.translationEnglish, edited);

    // 5. Admin unpublishes it -> it disappears from the app after the next refresh.
    await adminUpdate(base, {'slug': slug, 'status': 'draft'});
    expect(await repo.refresh(force: true), isTrue);
    await pumpEventQueue();
    expect(findDua(latest!, slug), isNull);

    await sub.cancel();
  }, skip: base == null ? 'DUAS_E2E_URL not set (run apps/site/supabase/duas/e2e_publish_flow.mjs)' : false);
}
