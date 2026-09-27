import 'package:quran_flutter/l10n/app_localizations.dart';

/// One step of the in-app User Guide walkthrough — a real screenshot of
/// the app (with the relevant control highlighted, baked into the image
/// itself by docs/user_guide/annotate.py), a title, and a short caption
/// explaining what's highlighted.
///
/// [featureTopics] and [testingTopics] are the single source of truth for
/// [UserGuideScreen]'s PageView. docs/user_guide/guide.html (the PDF
/// version of this same walkthrough) mirrors these topics and captions by
/// hand — see docs/user_guide/README.md if the two ever need re-syncing
/// after a UI change.
///
/// Note: the screenshots themselves are static images captured once in
/// English and show English UI chrome baked into the pixels — only the
/// title/caption text below is localized; re-capturing screenshots per
/// language is a separate, much larger effort outside this pass.
class GuideTopic {
  final String assetPath;
  final String title;
  final String caption;

  /// True for the "Help Us Test IqraSpace" steps at the end — same
  /// section header styling, distinct from the feature walkthrough.
  final bool isTestingTask;

  const GuideTopic({
    required this.assetPath,
    required this.title,
    required this.caption,
    this.isTestingTask = false,
  });
}

const _assetBase = 'assets/user_guide';

/// The feature walkthrough — one topic per major screen/control that
/// actually exists in this build. Order matches how a first-time reader
/// would naturally move through the app: Home → Quran → Reading →
/// Settings → the settings-sheet sections → Bookmarks → Last Reads →
/// Audio → Tajweed → Theme → this guide itself.
List<GuideTopic> featureTopics(AppLocalizations l10n) => [
      GuideTopic(assetPath: '$_assetBase/home.png', title: l10n.guideHomeTitle, caption: l10n.guideHomeCaption),
      GuideTopic(
        assetPath: '$_assetBase/surah_nav.png',
        title: l10n.guideSurahNavTitle,
        caption: l10n.guideSurahNavCaption,
      ),
      GuideTopic(
        assetPath: '$_assetBase/surah_list.png',
        title: l10n.guideSurahListTitle,
        caption: l10n.guideSurahListCaption,
      ),
      GuideTopic(
        assetPath: '$_assetBase/jump_to_surah.png',
        title: l10n.guideJumpToSurahTitle,
        caption: l10n.guideJumpToSurahCaption,
      ),
      GuideTopic(
        assetPath: '$_assetBase/reading_ayah.png',
        title: l10n.guideReadingAyahTitle,
        caption: l10n.guideReadingAyahCaption,
      ),
      GuideTopic(
        assetPath: '$_assetBase/settings_entry.png',
        title: l10n.guideSettingsEntryTitle,
        caption: l10n.guideSettingsEntryCaption,
      ),
      GuideTopic(
        assetPath: '$_assetBase/settings_panel.png',
        title: l10n.guideSettingsPanelTitle,
        caption: l10n.guideSettingsPanelCaption,
      ),
      GuideTopic(assetPath: '$_assetBase/fonts.png', title: l10n.guideFontsTitle, caption: l10n.guideFontsCaption),
      GuideTopic(
        assetPath: '$_assetBase/font_size.png',
        title: l10n.guideFontSizeTitle,
        caption: l10n.guideFontSizeCaption,
      ),
      GuideTopic(
        assetPath: '$_assetBase/translation.png',
        title: l10n.guideTranslationTitle,
        caption: l10n.guideTranslationCaption,
      ),
      GuideTopic(
        assetPath: '$_assetBase/bookmarks_screen.png',
        title: l10n.guideBookmarksScreenTitle,
        caption: l10n.guideBookmarksScreenCaption,
      ),
      GuideTopic(
        assetPath: '$_assetBase/last_reads.png',
        title: l10n.guideLastReadsTitle,
        caption: l10n.guideLastReadsCaption,
      ),
      GuideTopic(assetPath: '$_assetBase/audio.png', title: l10n.guideAudioTitle, caption: l10n.guideAudioCaption),
      GuideTopic(
        assetPath: '$_assetBase/tajweed.png',
        title: l10n.guideTajweedTitle,
        caption: l10n.guideTajweedCaption,
      ),
      GuideTopic(assetPath: '$_assetBase/theme.png', title: l10n.guideThemeTitle, caption: l10n.guideThemeCaption),
      GuideTopic(
        assetPath: '$_assetBase/user_guide_entry.png',
        title: l10n.guideUserGuideEntryTitle,
        caption: l10n.guideUserGuideEntryCaption,
      ),
    ];

/// "Help Us Test IqraSpace" — numbered testing steps for the volunteer
/// testers, reusing the same screenshots as the walkthrough above.
List<GuideTopic> testingTopics(AppLocalizations l10n) => [
      GuideTopic(
        isTestingTask: true,
        assetPath: '$_assetBase/surah_nav.png',
        title: l10n.guideTestSurahNavTitle,
        caption: l10n.guideTestSurahNavCaption,
      ),
      GuideTopic(
        isTestingTask: true,
        assetPath: '$_assetBase/search_screen.png',
        title: l10n.guideTestSearchJumpTitle,
        caption: l10n.guideTestSearchJumpCaption,
      ),
      GuideTopic(
        isTestingTask: true,
        assetPath: '$_assetBase/fonts.png',
        title: l10n.guideTestFontsTitle,
        caption: l10n.guideTestFontsCaption,
      ),
      GuideTopic(
        isTestingTask: true,
        assetPath: '$_assetBase/font_size.png',
        title: l10n.guideTestFontSizeTitle,
        caption: l10n.guideTestFontSizeCaption,
      ),
      GuideTopic(
        isTestingTask: true,
        assetPath: '$_assetBase/translation.png',
        title: l10n.guideTestTranslationTitle,
        caption: l10n.guideTestTranslationCaption,
      ),
      GuideTopic(
        isTestingTask: true,
        assetPath: '$_assetBase/audio.png',
        title: l10n.guideTestAudioTitle,
        caption: l10n.guideTestAudioCaption,
      ),
      GuideTopic(
        isTestingTask: true,
        assetPath: '$_assetBase/bookmarks_screen.png',
        title: l10n.guideTestBookmarksTitle,
        caption: l10n.guideTestBookmarksCaption,
      ),
      GuideTopic(
        isTestingTask: true,
        assetPath: '$_assetBase/last_reads.png',
        title: l10n.guideTestLastReadsTitle,
        caption: l10n.guideTestLastReadsCaption,
      ),
      GuideTopic(
        isTestingTask: true,
        assetPath: '$_assetBase/tajweed.png',
        title: l10n.guideTestTajweedTitle,
        caption: l10n.guideTestTajweedCaption,
      ),
      GuideTopic(
        isTestingTask: true,
        assetPath: '$_assetBase/settings_panel.png',
        title: l10n.guideTestSettingsTitle,
        caption: l10n.guideTestSettingsCaption,
      ),
      GuideTopic(
        isTestingTask: true,
        assetPath: '$_assetBase/theme.png',
        title: l10n.guideTestThemeTitle,
        caption: l10n.guideTestThemeCaption,
      ),
      GuideTopic(
        isTestingTask: true,
        assetPath: '$_assetBase/home.png',
        title: l10n.guideTestClosingReopeningTitle,
        caption: l10n.guideTestClosingReopeningCaption,
      ),
    ];
