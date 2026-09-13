import 'package:flutter/material.dart';

/// The one IqraSpace brand mark used everywhere in this app — the same
/// `assets/branding/icon.png` that generates the Android launcher icon
/// and web favicon/PWA icons (see pubspec.yaml's flutter_launcher_icons
/// config and assets/branding/NOTE.md for provenance). Use this instead
/// of a bare `Image.asset(...)` call so every header, nav bar, and
/// loading state stays pinned to the one approved asset — never a
/// placeholder, a generic Material icon, or a copy that could drift out
/// of sync if the brand mark is ever replaced.
class BrandMark extends StatelessWidget {
  final double size;

  const BrandMark({this.size = 22, super.key});

  @override
  Widget build(BuildContext context) {
    return Image.asset('assets/branding/icon.png', width: size, height: size);
  }
}

/// A branded stand-in for a bare `CircularProgressIndicator` on screens
/// that fetch over the network (the surah list, a surah's ayahs) — the
/// brand mark is the first thing a reader sees while IqraSpace is
/// working, on every loading state, not just the Home screen.
class BrandedLoadingIndicator extends StatelessWidget {
  const BrandedLoadingIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          BrandMark(size: 48),
          SizedBox(height: 16),
          CircularProgressIndicator(strokeWidth: 2.5),
        ],
      ),
    );
  }
}
