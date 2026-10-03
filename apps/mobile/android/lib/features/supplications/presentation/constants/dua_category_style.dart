import 'package:flutter/material.dart';

/// A category's accent color + icon for the Duas grid/list browser —
/// purely a presentation concern (the bundled JSON itself carries no
/// color/icon data). Colors are fixed, not mode-swapped like
/// [IqraSpaceBrand] — matching this app's existing precedent for other
/// non-brand accents (e.g. the bookmark-delete red) — chosen at a
/// mid-lightness/moderate-saturation so each stays legible against the
/// light, trueBlackDark and sepia backgrounds alike. Icons are stock
/// `Icons.*` only (no custom SVG/icon fonts anywhere else in this app).
class DuaCategoryStyle {
  final Color accent;
  final IconData icon;

  const DuaCategoryStyle({required this.accent, required this.icon});
}

abstract final class DuaCategoryStyles {
  /// Looks up [id]'s style, falling back to a hash-cycled entry from
  /// [_fallbackPalette] for any id not in [_byId] — so a future addition
  /// to assets/supplications.json's category list never renders blank.
  /// See dua_category_style_test.dart, which asserts every id currently
  /// bundled in the JSON resolves to an explicit (non-fallback) entry.
  static DuaCategoryStyle forId(String id) => _byId[id] ?? _fallbackFor(id);

  static DuaCategoryStyle _fallbackFor(String id) {
    final palette = _fallbackPalette;
    return palette[id.hashCode.abs() % palette.length];
  }

  static const _fallbackPalette = [
    DuaCategoryStyle(accent: Color(0xFF5B6B8C), icon: Icons.auto_awesome_outlined),
    DuaCategoryStyle(accent: Color(0xFF7D5BA6), icon: Icons.auto_awesome_outlined),
    DuaCategoryStyle(accent: Color(0xFF3E8E7E), icon: Icons.auto_awesome_outlined),
  ];

  static final _byId = <String, DuaCategoryStyle>{
    'waking': const DuaCategoryStyle(accent: Color(0xFFC77C2E), icon: Icons.wb_twilight),
    'morning': const DuaCategoryStyle(accent: Color(0xFFB8873A), icon: Icons.wb_sunny_outlined),
    'evening': const DuaCategoryStyle(accent: Color(0xFF4A5A8C), icon: Icons.nights_stay_outlined),
    'sleep': const DuaCategoryStyle(accent: Color(0xFF3F3B78), icon: Icons.bedtime_outlined),
    'wudu': const DuaCategoryStyle(accent: Color(0xFF2E7D9E), icon: Icons.water_drop_outlined),
    'masjid': const DuaCategoryStyle(accent: Color(0xFF0F5C4F), icon: Icons.mosque),
    'salah': const DuaCategoryStyle(accent: Color(0xFF1C7A6A), icon: Icons.self_improvement),
    'witr': const DuaCategoryStyle(accent: Color(0xFF42397A), icon: Icons.nightlight_round),
    'home': const DuaCategoryStyle(accent: Color(0xFF8C5A3C), icon: Icons.home_outlined),
    'food': const DuaCategoryStyle(accent: Color(0xFFC06A2C), icon: Icons.restaurant_outlined),
    'fasting': const DuaCategoryStyle(accent: Color(0xFFB0501F), icon: Icons.no_meals_outlined),
    'dressing': const DuaCategoryStyle(accent: Color(0xFF55637A), icon: Icons.checkroom_outlined),
    'travel': const DuaCategoryStyle(accent: Color(0xFF2E6B9E), icon: Icons.luggage_outlined),
    'weather': const DuaCategoryStyle(accent: Color(0xFF3E8FB0), icon: Icons.cloud_outlined),
    'anxiety': const DuaCategoryStyle(accent: Color(0xFF2E8C7D), icon: Icons.spa_outlined),
    'anger': const DuaCategoryStyle(accent: Color(0xFF9E3A3A), icon: Icons.mood_bad_outlined),
    'sickness': const DuaCategoryStyle(accent: Color(0xFF2F8F4E), icon: Icons.healing_outlined),
    'grief': const DuaCategoryStyle(accent: Color(0xFF6B5B7A), icon: Icons.local_florist_outlined),
    'knowledge': const DuaCategoryStyle(accent: Color(0xFFA37A1F), icon: Icons.school_outlined),
    'repentance': const DuaCategoryStyle(accent: Color(0xFF1C7A6A), icon: Icons.volunteer_activism_outlined),
    'hajj': const DuaCategoryStyle(accent: Color(0xFF8C6A1F), icon: Icons.location_on_outlined),
    'social': const DuaCategoryStyle(accent: Color(0xFF2E6B9E), icon: Icons.groups_outlined),
    'quranic': const DuaCategoryStyle(accent: Color(0xFF0F5C4F), icon: Icons.auto_stories_outlined),
    'market': const DuaCategoryStyle(accent: Color(0xFFB8873A), icon: Icons.storefront_outlined),
    'faith': const DuaCategoryStyle(accent: Color(0xFF6E4E96), icon: Icons.help_outline),
  };
}
