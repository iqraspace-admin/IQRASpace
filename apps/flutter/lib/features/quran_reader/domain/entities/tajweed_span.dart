/// One run of ayah text tagged with the Tajweed rule that applies to it
/// (or untagged plain text when [ruleKey] is null).
///
/// [ruleKey] is the raw single-letter code Al Quran Cloud's
/// `quran-tajweed` edition uses in its bracket notation (e.g. `h`, `n`,
/// `p` — see lib/core/utils/tajweed_parser.dart for the source format).
/// lib/core/theme/tajweed_rule_colors.dart maps each code to a rule name
/// and color.
class TajweedSpan {
  final String text;
  final String? ruleKey;

  const TajweedSpan(this.text, this.ruleKey);

  Map<String, dynamic> toJson() => {'text': text, 'ruleKey': ruleKey};

  factory TajweedSpan.fromJson(Map<String, dynamic> json) =>
      TajweedSpan(json['text'] as String, json['ruleKey'] as String?);

  @override
  bool operator ==(Object other) =>
      other is TajweedSpan && other.text == text && other.ruleKey == ruleKey;

  @override
  int get hashCode => Object.hash(text, ruleKey);

  @override
  String toString() => 'TajweedSpan("$text", $ruleKey)';
}
