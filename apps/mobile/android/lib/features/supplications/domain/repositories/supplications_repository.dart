import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplications_meta.dart';

/// One load's worth of Supplications content — the meta text always comes
/// from the bundled asset; the categories from the freshest valid source
/// (remote cache, else bundled). Counts in [meta] are computed from the
/// categories.
typedef SupplicationsContent = ({SupplicationsMeta meta, List<SupplicationCategory> categories});

abstract class SupplicationsRepository {
  /// Resolves immediately from the last good cache, else the bundled
  /// asset — never waits on the network. The first call also kicks off a
  /// background revalidation (see [refresh]).
  Future<SupplicationsContent> load();

  /// The bundled asset's content, regardless of cache — used to resolve
  /// legacy positional favorites.
  Future<SupplicationsContent> loadBundled();

  /// Emits whenever a newer validated snapshot has been fetched, cached
  /// and made current.
  Stream<SupplicationsContent> get updates;

  /// Checks the remote version and, if it differs from the cached one,
  /// downloads, validates and caches the new snapshot. Returns true when
  /// new content was applied. Never throws; a no-op when the remote is
  /// not configured. Without [force], at most one check per hour.
  Future<bool> refresh({bool force = false});
}
