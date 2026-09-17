import 'package:flutter/material.dart';

enum ReaderThemeMode { light, trueBlackDark, sepia }

/// IqraSpace's brand colors — the exact teal/gold from the logo mark
/// (assets/branding/icon.png), confirmed against apps/quran's own
/// `--color-primary`/`--color-accent` CSS tokens
/// (apps/quran/src/app/globals.css), which document them as matching
/// this same logo. Kept as one source of truth so every accent color in
/// this app (buttons, selected radios/sliders, the surah-list avatar,
/// the bookmark star, the search/bookmark highlight) ties back to the
/// same brand rather than ad hoc Material defaults.
class IqraSpaceBrand {
  IqraSpaceBrand._();

  static const tealLight = Color(0xFF0F5C4F);
  static const tealDark = Color(0xFF3BA98E);
  static const goldLight = Color(0xFFB8873A);
  static const goldDark = Color(0xFFD3A55C);

  static Color teal(ReaderThemeMode mode) =>
      mode == ReaderThemeMode.trueBlackDark ? tealDark : tealLight;

  static Color gold(ReaderThemeMode mode) =>
      mode == ReaderThemeMode.trueBlackDark ? goldDark : goldLight;
}

/// The comfort-mode palette. Kept separate from [ThemeData] so
/// [AyahRichText] can read plain background/text colors without pulling
/// in unrelated Material theme fields.
class ReaderColors {
  final Color background;
  final Color textColor;
  final Color chromeColor;

  const ReaderColors({
    required this.background,
    required this.textColor,
    required this.chromeColor,
  });

  static const light = ReaderColors(
    background: Color(0xFFFFFFFF),
    textColor: Color(0xFF1A1A1A),
    chromeColor: Color(0xFFF5F5F5),
  );

  // True black, not just "dark grey" — saves battery on OLED screens and
  // gives the highest contrast against colored Tajweed text.
  static const trueBlackDark = ReaderColors(
    background: Color(0xFF000000),
    textColor: Color(0xFFE0E0E0),
    chromeColor: Color(0xFF121212),
  );

  static const sepia = ReaderColors(
    background: Color(0xFFF4ECD8),
    textColor: Color(0xFF3B2F1E),
    chromeColor: Color(0xFFE9DFC4),
  );

  static ReaderColors forMode(ReaderThemeMode mode) {
    switch (mode) {
      case ReaderThemeMode.light:
        return light;
      case ReaderThemeMode.trueBlackDark:
        return trueBlackDark;
      case ReaderThemeMode.sepia:
        return sepia;
    }
  }
}

ThemeData buildAppTheme(ReaderThemeMode mode) {
  final colors = ReaderColors.forMode(mode);
  final brightness =
      mode == ReaderThemeMode.trueBlackDark ? Brightness.dark : Brightness.light;
  final brandPrimary = IqraSpaceBrand.teal(mode);
  final brandAccent = IqraSpaceBrand.gold(mode);

  return ThemeData(
    brightness: brightness,
    scaffoldBackgroundColor: colors.background,
    primaryColor: brandPrimary,
    appBarTheme: AppBarTheme(
      backgroundColor: colors.chromeColor,
      foregroundColor: colors.textColor,
      elevation: 0,
    ),
    colorScheme: ColorScheme.fromSeed(
      seedColor: brandPrimary,
      brightness: brightness,
      surface: colors.background,
      secondary: brandAccent,
    ),
  );
}
