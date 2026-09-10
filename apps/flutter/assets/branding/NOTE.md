# App icon source

`icon.png` is the IqraSpace brand mark (open book + star, teal/gold, no
text) — copied from `apps/quran/assets/icon.png` so this app has its own
copy and no file-path dependency on `apps/quran`. Both apps render the
same brand consistently while staying fully isolated codebases.

Brand colors (confirmed from `apps/quran/src/app/globals.css`, which
documents them as matching this exact logo):
- Primary teal: `#0F5C4F` (light) / `#3BA98E` (dark)
- Accent gold: `#B8873A` (light) / `#D3A55C` (dark)

Used by `flutter_launcher_icons` (see `pubspec.yaml`) to generate the
Android launcher icon and web favicon/PWA icons, and by
`lib/core/theme/app_theme.dart` for the app's `ColorScheme` seed and
accent colors.
