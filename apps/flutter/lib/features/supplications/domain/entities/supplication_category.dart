import 'package:quran_flutter/features/supplications/domain/entities/dua.dart';

/// One category of supplications (e.g. "Morning athkar"). [id] is the
/// JSON source's stable key — used as the list/route key instead of
/// [label], which is display text and could change wording without
/// [id] changing.
class SupplicationCategory {
  final String id;
  final String label;
  final String description;
  final List<Dua> duas;

  const SupplicationCategory({
    required this.id,
    required this.label,
    required this.description,
    required this.duas,
  });
}
