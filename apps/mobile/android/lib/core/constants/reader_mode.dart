import 'package:flutter/material.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// The Surah Reader's top-level mode — replaces "toggle Read Mode, toggle
/// auto-scroll, tap play" with one clear choice. See
/// `lib/features/quran_reader/presentation/providers/surah_providers.dart`'s
/// `readerModeProvider` for the persisted state, and
/// `surah_reader_screen.dart` for how each mode maps onto the existing
/// Read Mode / auto-scroll / audio toggles (reused, not duplicated).
enum ReaderMode {
  /// Audio-first: plays in the background/on the lock screen (Android).
  /// The reading list stays visible but the manual auto-scroll-speed
  /// slider is irrelevant here — the existing "follow the playing ayah"
  /// auto-scroll takes over.
  listening,

  /// No audio ever auto-plays. Today's auto-scroll/reading tools apply
  /// unchanged.
  reading,

  /// Audio plays AND the current ayah is highlighted/auto-scrolled to,
  /// same mechanism as [listening]'s follow-scroll — but any manual
  /// navigation (Jump-to-Surah, Previous/Next Surah, a bookmark/search
  /// deep link) pauses playback instead of stopping it.
  readingListening,
}

extension ReaderModeX on ReaderMode {
  IconData get icon => switch (this) {
        ReaderMode.listening => Icons.headphones,
        ReaderMode.reading => Icons.menu_book,
        ReaderMode.readingListening => Icons.auto_stories,
      };

  String label(AppLocalizations l10n) => switch (this) {
        ReaderMode.listening => l10n.modeListening,
        ReaderMode.reading => l10n.modeReading,
        ReaderMode.readingListening => l10n.modeReadingListening,
      };
}

const defaultReaderMode = ReaderMode.readingListening;

/// Listening Mode's audio-track choice — "Recitation Only" or
/// "Recitation + Urdu Translation" (the latter appended after a Surah's
/// Arabic ayahs once a Urdu audio URL exists for it — see
/// `lib/core/constants/urdu_surah_audio.dart`).
enum ListeningTrack { arabicOnly, arabicPlusUrdu }

extension ListeningTrackX on ListeningTrack {
  String label(AppLocalizations l10n) => switch (this) {
        ListeningTrack.arabicOnly => l10n.listeningTrackArabicOnly,
        ListeningTrack.arabicPlusUrdu => l10n.listeningTrackArabicPlusUrdu,
      };
}

const defaultListeningTrack = ListeningTrack.arabicOnly;
