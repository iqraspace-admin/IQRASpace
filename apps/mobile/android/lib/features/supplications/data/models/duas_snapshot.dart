import 'package:quran_flutter/features/supplications/data/models/supplication_category_model.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';

/// The content snapshot shape shared by the remote `get_dua_content` RPC,
/// the Hive cache and the bundled asset:
/// `{ version?, generated_at?, categories: [...] }`.
///
/// [DuasSnapshot.parse] is also the validator: anything that does not
/// look like a complete, displayable snapshot throws [FormatException]
/// and must be rejected by callers (never partially applied).
class DuasSnapshot {
  final String? version;
  final List<SupplicationCategory> categories;

  const DuasSnapshot({required this.version, required this.categories});

  factory DuasSnapshot.parse(Object? json) {
    try {
      if (json is! Map<String, dynamic>) throw const FormatException('snapshot is not an object');
      final cats = json['categories'];
      if (cats is! List || cats.isEmpty) throw const FormatException('snapshot has no categories');
      final categories = cats.map((e) {
        if (e is! Map<String, dynamic>) throw const FormatException('category is not an object');
        return SupplicationCategoryModel.fromJson(e);
      }).toList();
      final v = json['version'];
      return DuasSnapshot(version: v is String && v.isNotEmpty ? v : null, categories: categories);
    } on FormatException {
      rethrow;
    } catch (e) {
      throw FormatException('malformed snapshot: $e');
    }
  }
}
