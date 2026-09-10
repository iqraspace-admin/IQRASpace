import 'package:flutter/material.dart';

/// Maps a Tajweed rule code (the bracket-notation letter Al Quran Cloud's
/// `quran-tajweed` edition uses, e.g. `h` in `[h:1[ٱ]`) to the CSS-class-
/// style key and color used to render it.
///
/// Source of truth: the `alquran-tools` PHP library
/// (github.com/islamic-network/alquran-tools,
/// src/AlQuranCloud/Tools/Parser/Tajweed.php) — the library Al Quran
/// Cloud's own developer guide (alquran.cloud/tajweed-guide) cites for
/// turning this exact bracket markup into colored HTML. Keys below are
/// that library's `default_css_class` values (one typo fixed:
/// "madda_pbligatory" -> "madda_obligatory"); colors are its
/// `html_color` values, cross-checked against its `examples/css/
/// tajweed.css`. `idgh_ghn` (with ghunnah) and `idgh_w_ghn` (without)
/// share one color in that source (#169200) — deliberately given
/// distinct shades here so the two rules stay visually distinguishable,
/// which matters more for a reading aid than matching the reference
/// implementation's quirk exactly.
const Map<String, String> tajweedCodeToRuleKey = {
  'h': 'ham_wasl',
  's': 'slnt',
  'l': 'slnt', // Laam Shamsiyyah renders identically to Silent in the source.
  'n': 'madda_normal',
  'p': 'madda_permissible',
  'm': 'madda_necessary',
  'q': 'qlq',
  'o': 'madda_obligatory',
  'c': 'ikhf_shfw',
  'f': 'ikhf',
  'w': 'idghm_shfw',
  'i': 'iqlb',
  'a': 'idgh_ghn',
  'u': 'idgh_w_ghn',
  'b': 'idgh_mus',
  'd': 'idgh_mus',
  'g': 'ghn',
};

const Map<String, Color> tajweedRuleColors = {
  'ham_wasl': Color(0xFFAAAAAA),
  'slnt': Color(0xFFAAAAAA),
  'madda_normal': Color(0xFF537FFF),
  'madda_permissible': Color(0xFF4050FF),
  'madda_necessary': Color(0xFF000EBC),
  'qlq': Color(0xFFDD0008),
  'madda_obligatory': Color(0xFF2144C1),
  'ikhf_shfw': Color(0xFFD500B7),
  'ikhf': Color(0xFF9400A8),
  'idghm_shfw': Color(0xFF58B800),
  'iqlb': Color(0xFF26BFFD),
  'idgh_ghn': Color(0xFF169200),
  // Deliberately distinct from idgh_ghn (source uses the same #169200 for
  // both) — a darker, cooler green keeps them tellable apart at a glance.
  'idgh_w_ghn': Color(0xFF1B6E3C),
  'idgh_mus': Color(0xFFA1A1A1),
  'ghn': Color(0xFFFF7E1E),
};

/// [rawCode] is the raw single-letter code straight from TajweedParser
/// (e.g. `h`, `l`, `n`) — this looks it up via [tajweedCodeToRuleKey]
/// first, so callers never need to know the rule-key indirection exists.
Color? colorForTajweedCode(String? rawCode) {
  if (rawCode == null) return null;
  final ruleKey = tajweedCodeToRuleKey[rawCode];
  if (ruleKey == null) return null;
  return tajweedRuleColors[ruleKey];
}
