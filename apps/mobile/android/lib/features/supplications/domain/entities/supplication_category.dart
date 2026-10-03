import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/features/supplications/domain/entities/dua.dart';

/// One category of supplications (e.g. "Morning athkar"). [id] is the
/// JSON source's stable key — used as the list/route key instead of
/// [label], which is display text and could change wording without
/// [id] changing.
///
/// [labelUrdu]/[labelTelugu] and [descriptionUrdu]/[descriptionTelugu]
/// are standard-terminology translations (not hadith/quote text) — see
/// SupplicationsMeta's category_labels_note for provenance. Use
/// [labelFor]/[descriptionFor] rather than the raw English fields
/// directly, so a category's display text follows the app's language.
class SupplicationCategory {
  final String id;
  final String label;
  final String description;
  final List<Dua> duas;
  final String? labelUrdu;
  final String? labelTelugu;
  final String? descriptionUrdu;
  final String? descriptionTelugu;

  const SupplicationCategory({
    required this.id,
    required this.label,
    required this.description,
    required this.duas,
    this.labelUrdu,
    this.labelTelugu,
    this.descriptionUrdu,
    this.descriptionTelugu,
  });

  String labelFor(AppLanguage language) {
    switch (language) {
      case AppLanguage.urdu:
        return labelUrdu ?? label;
      case AppLanguage.telugu:
        return labelTelugu ?? label;
      case AppLanguage.english:
        return label;
    }
  }

  String descriptionFor(AppLanguage language) {
    switch (language) {
      case AppLanguage.urdu:
        return descriptionUrdu ?? description;
      case AppLanguage.telugu:
        return descriptionTelugu ?? description;
      case AppLanguage.english:
        return description;
    }
  }
}
