import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplications_meta.dart';

/// One load's worth of Supplications content — meta and categories
/// always come from the same bundled asset, so they're fetched together.
typedef SupplicationsContent = ({SupplicationsMeta meta, List<SupplicationCategory> categories});

abstract class SupplicationsRepository {
  Future<SupplicationsContent> load();
}
