// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get navHome => 'Home';

  @override
  String get navQuran => 'Quran';

  @override
  String get navLearn => 'Learn';

  @override
  String get navBookmarks => 'Bookmarks';

  @override
  String get navSettings => 'Settings';

  @override
  String get homeTagline => 'Read. Listen. Learn. Reflect.';

  @override
  String get homeReadQuranTitle => 'Read Quran';

  @override
  String get homeReadQuranSubtitle => '114 Surahs, Tajweed & translation';

  @override
  String get homeLearningTitle => 'Learning';

  @override
  String get homeLearningSubtitle => 'Courses & guided lessons';

  @override
  String get homeLastReads => 'Last Reads';

  @override
  String homeAyahOfTotal(Object current, Object total) {
    return 'Ayah $current of $total';
  }

  @override
  String get homeQuickLinks => 'Quick Links';

  @override
  String get homeSearch => 'Search';

  @override
  String get homeTajweedRules => 'Tajweed Rules';

  @override
  String get homeReaderSettings => 'Reader Settings';

  @override
  String get homeBookmarks => 'Bookmarks';

  @override
  String get homeSeeAll => 'See all';

  @override
  String get homeNoBookmarksYet =>
      'No bookmarks yet — tap the star icon while reading to save an ayah.';

  @override
  String get homeContinueReading => 'CONTINUE READING';

  @override
  String homeBeginWithSurah(Object surahName) {
    return 'Begin with $surahName';
  }

  @override
  String homeAyahCount(Object ayah) {
    return 'Ayah $ayah';
  }

  @override
  String get bookmarksTitle => 'Bookmarks';

  @override
  String get bookmarksEmpty => 'No bookmarks yet.';

  @override
  String get searchHint => 'Search translation (e.g. mercy, patience)…';

  @override
  String get searchPrompt => 'Type a word and press search.';

  @override
  String get searchNoMatches => 'No matches found.';

  @override
  String searchFailed(Object error) {
    return 'Search failed.\n$error';
  }

  @override
  String get learnTitle => 'Learn';

  @override
  String get learnHeading => 'IqraSpace Learning';

  @override
  String get learnBody =>
      'Courses and guided lessons are coming in a future update. For now, dive into the Quran Reader.';

  @override
  String get quranTitle => 'Quran';

  @override
  String get commonRetry => 'Retry';

  @override
  String get commonDone => 'Done';

  @override
  String commonAyahsCount(Object count) {
    return '$count ayahs';
  }

  @override
  String get commonCouldNotReachReader =>
      'Could not reach the Quran Reader.\nCheck your connection and try again.';

  @override
  String get readerStop => 'Stop';

  @override
  String get readerPlayWholeSurah => 'Play whole surah';

  @override
  String get readerReadingSettings => 'Reading Settings';

  @override
  String get readerMore => 'More';

  @override
  String get readerStopAutoScroll => 'Stop auto-scroll';

  @override
  String get readerStartAutoScroll => 'Start auto-scroll';

  @override
  String get readerExitReadMode => 'Exit Read Mode';

  @override
  String get readerReadModeArabicOnly => 'Read Mode (Arabic only)';

  @override
  String get readerFirstSurah => 'First Surah';

  @override
  String get readerLastSurah => 'Last Surah';

  @override
  String get readerPause => 'Pause';

  @override
  String get readerPlayRecitation => 'Play recitation';

  @override
  String get readerRemoveBookmark => 'Remove bookmark';

  @override
  String get readerAddBookmark => 'Add bookmark';

  @override
  String get modeListening => 'Listening';

  @override
  String get modeReading => 'Reading';

  @override
  String get modeReadingListening => 'Reading + Listening';

  @override
  String get listeningTrackArabicOnly => 'Recitation Only';

  @override
  String get listeningTrackArabicPlusUrdu => 'Recitation + Urdu Translation';

  @override
  String get listeningTrackComingSoon =>
      'Urdu translation audio is coming soon for this Surah.';

  @override
  String get playbackPlay => 'Play';

  @override
  String get playbackPause => 'Pause';

  @override
  String get playbackPreviousSurah => 'Previous Surah';

  @override
  String get playbackNextSurah => 'Next Surah';

  @override
  String get jumpToSura => 'Sura';

  @override
  String get jumpToAyah => 'Ayah';

  @override
  String get jumpToSurahSearchHint => 'Aa..';

  @override
  String get jumpToAyahSearchHint => '1, 2..';

  @override
  String jumpToCouldNotLoad(Object error) {
    return 'Could not load the Surah list.\n$error';
  }

  @override
  String get tajweedRulesScreenTitle => 'Tajweed Rules';

  @override
  String get settingsClose => 'Close';

  @override
  String get settingsReadingSettings => 'Reading Settings';

  @override
  String get settingsTheme => 'Theme';

  @override
  String get settingsLight => 'Light';

  @override
  String get settingsDark => 'Dark';

  @override
  String get settingsSepia => 'Sepia';

  @override
  String get settingsArabicFont => 'Arabic Font';

  @override
  String get settingsArabicTextSize => 'Arabic text size';

  @override
  String get settingsTranslation => 'Translation';

  @override
  String get settingsLanguage => 'Language';

  @override
  String get settingsTajweed => 'Tajweed';

  @override
  String get settingsTajweedColoring => 'Tajweed coloring';

  @override
  String get settingsTajweedColoringDesc =>
      'Highlights recitation rules in the Arabic text.';

  @override
  String get settingsTajweedRules => 'Tajweed Rules';

  @override
  String get settingsTajweedRulesDesc => 'What each color means';

  @override
  String get settingsReciter => 'Reciter';

  @override
  String get settingsReading => 'Reading';

  @override
  String get settingsReadMode => 'Read Mode';

  @override
  String get settingsReadModeDesc =>
      'Arabic text only — hides bookmark, audio, and translation controls.';

  @override
  String get settingsShowBookmarkIcons => 'Show bookmark icons';

  @override
  String get settingsAutoScrollSpeed => 'Auto-scroll speed';

  @override
  String get settingsUserGuide => 'User Guide';

  @override
  String get settingsUserGuideDesc =>
      'A screenshot walkthrough of every feature';

  @override
  String get settingsAboutIqraSpace => 'About IqraSpace';

  @override
  String get settingsAboutIqraSpaceDesc => 'Our mission, vision, and values';

  @override
  String get settingsAttribution =>
      'Text, Tajweed, translation, and audio: Al Quran Cloud (alquran.cloud). Roman Urdu translation: Quran.com. Fonts: the Amiri family (SIL OFL 1.1).';

  @override
  String get translationLangOff => 'Off';

  @override
  String get translationLangEnglish => 'English (Sahih International)';

  @override
  String get translationLangRomanUrdu => 'Roman Urdu (Abul Ala Maududi)';

  @override
  String get arabicFontAmiriQuran => 'Amiri Quran (Uthmani)';

  @override
  String get arabicFontAmiri => 'Amiri (general-purpose)';

  @override
  String get arabicFontAmiriQuranColored => 'Amiri Quran Colored';

  @override
  String get arabicFontColoredCaveat =>
      'Has its own built-in colors — this app\'s Tajweed coloring won\'t be visible on top of it.';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageTelugu => 'తెలుగు';

  @override
  String get languageUrdu => 'اردو';

  @override
  String get tajweedRuleGhnName => 'Ghunnah';

  @override
  String get tajweedRuleGhnDesc =>
      'A nasal sound of about two counts on a stressed م or ن.';

  @override
  String get tajweedRuleIkhfName => 'Ikhfa (Hiding)';

  @override
  String get tajweedRuleIkhfDesc =>
      'A silent ن or tanween before certain letters is hidden — pronounced with a light nasal sound rather than fully sounded out.';

  @override
  String get tajweedRuleIkhfShfwName => 'Ikhfa Shafawi (Labial Hiding)';

  @override
  String get tajweedRuleIkhfShfwDesc =>
      'A silent م before ب is hidden with a light nasal sound.';

  @override
  String get tajweedRuleIqlbName => 'Iqlab (Conversion)';

  @override
  String get tajweedRuleIqlbDesc =>
      'A silent ن or tanween followed by ب is converted into a م sound.';

  @override
  String get tajweedRuleIdghGhnName => 'Idgham with Ghunnah';

  @override
  String get tajweedRuleIdghGhnDesc =>
      'A silent ن or tanween followed by ي ن م و merges into the next letter, with nasalisation.';

  @override
  String get tajweedRuleIdghWGhnName => 'Idgham without Ghunnah';

  @override
  String get tajweedRuleIdghWGhnDesc =>
      'A silent ن or tanween followed by ل or ر merges into the next letter, no nasalisation.';

  @override
  String get tajweedRuleIdghmShfwName => 'Idgham Shafawi (Labial Merging)';

  @override
  String get tajweedRuleIdghmShfwDesc =>
      'A silent م followed by another م merges together with a nasal sound.';

  @override
  String get tajweedRuleIdghMusName => 'Idgham Mutajanisayn / Mutaqaribayn';

  @override
  String get tajweedRuleIdghMusDesc =>
      'Two similar or closely-articulated letters merge into one.';

  @override
  String get tajweedRuleQlqName => 'Qalqala (Echoing)';

  @override
  String get tajweedRuleQlqDesc =>
      'ق ط ب ج د with a sukun are pronounced with a slight echoing, bouncing sound.';

  @override
  String get tajweedRuleMaddaNormalName => 'Natural Madd';

  @override
  String get tajweedRuleMaddaNormalDesc =>
      'A vowel held for the standard two counts — no extra stretching.';

  @override
  String get tajweedRuleMaddaPermissibleName => 'Permissible Madd';

  @override
  String get tajweedRuleMaddaPermissibleDesc =>
      'A vowel that may be stretched 2, 4, or 5 counts, at the reciter\'s choice.';

  @override
  String get tajweedRuleMaddaNecessaryName => 'Necessary Madd';

  @override
  String get tajweedRuleMaddaNecessaryDesc =>
      'A vowel that must be stretched a full 6 counts.';

  @override
  String get tajweedRuleMaddaObligatoryName => 'Obligatory Madd';

  @override
  String get tajweedRuleMaddaObligatoryDesc =>
      'A vowel followed by a hamzah in the same word, stretched 4 to 5 counts.';

  @override
  String get tajweedRuleHamWaslName => 'Hamzat ul Wasl (Connecting Hamzah)';

  @override
  String get tajweedRuleHamWaslDesc =>
      'Dropped in pronunciation when preceded by a vowel — sounded only when starting recitation here.';

  @override
  String get tajweedRuleSlntName => 'Silent Letter';

  @override
  String get tajweedRuleSlntDesc => 'A written letter that is not pronounced.';

  @override
  String get guideTitle => 'User Guide';

  @override
  String get guideSkip => 'Skip';

  @override
  String get guideHelpUsTest => 'Help Us Test IqraSpace';

  @override
  String get guideScreenshotUnavailable => 'Screenshot not available yet';

  @override
  String get guideBack => 'Back';

  @override
  String get guideNext => 'Next';

  @override
  String get guideHomeTitle => 'Home';

  @override
  String get guideHomeCaption =>
      'Tap \"Read Quran\" to start reading, \"Last Reads\" to resume a Surah, or a Quick Link to jump straight to Search, Tajweed Rules, or Reading Settings.';

  @override
  String get guideSurahNavTitle => 'The Surah screen';

  @override
  String get guideSurahNavCaption =>
      'The Surah name at the top opens Go To Surah. Use the Previous/Next row to move between Surahs, and the play icon to hear the whole Surah recited.';

  @override
  String get guideSurahListTitle => 'Choosing a Surah';

  @override
  String get guideSurahListCaption =>
      'The Quran tab lists all 114 Surahs — scroll or tap the search icon to find one by name.';

  @override
  String get guideJumpToSurahTitle => 'Go To Surah';

  @override
  String get guideJumpToSurahCaption =>
      'Spin or search either wheel to jump straight to any Surah and Ayah.';

  @override
  String get guideReadingAyahTitle => 'Reading an Ayah';

  @override
  String get guideReadingAyahCaption =>
      'Each Ayah has its own play button and bookmark star. Turn on a translation in Reading Settings to see it appear beneath the Arabic text.';

  @override
  String get guideSettingsEntryTitle => 'Opening Settings';

  @override
  String get guideSettingsEntryCaption =>
      'Reading Settings opens from the Settings tab in the bottom bar, or the tune icon while reading — both open the same panel.';

  @override
  String get guideSettingsPanelTitle => 'Reading Settings';

  @override
  String get guideSettingsPanelCaption =>
      'Theme and Arabic Font are the first two sections in the Reading Settings panel.';

  @override
  String get guideFontsTitle => 'Arabic Font';

  @override
  String get guideFontsCaption =>
      'Pick between three Arabic scripts under Arabic Font in Reading Settings — the Quran text updates immediately.';

  @override
  String get guideFontSizeTitle => 'Reading size';

  @override
  String get guideFontSizeCaption =>
      'Drag the \"Arabic text size\" slider in Reading Settings to make the script larger or smaller.';

  @override
  String get guideTranslationTitle => 'Translation';

  @override
  String get guideTranslationCaption =>
      'Choose English or Roman Urdu under Translation in Reading Settings — or Off to read Arabic only.';

  @override
  String get guideBookmarksScreenTitle => 'Bookmarks';

  @override
  String get guideBookmarksScreenCaption =>
      'Every Ayah you star is saved here — tap one to jump straight back to it.';

  @override
  String get guideLastReadsTitle => 'Last Reads';

  @override
  String get guideLastReadsCaption =>
      'Home keeps a short history of recent Surahs — tap one to pick up right where you left off.';

  @override
  String get guideAudioTitle => 'Audio';

  @override
  String get guideAudioCaption =>
      'Play a single Ayah with its own play icon, or the whole Surah with the play icon in the Surah bar.';

  @override
  String get guideTajweedTitle => 'Tajweed';

  @override
  String get guideTajweedCaption =>
      'Turn on Tajweed coloring in Reading Settings, then open \"Tajweed Rules\" to see what each color means.';

  @override
  String get guideThemeTitle => 'Theme';

  @override
  String get guideThemeCaption =>
      'Switch between Light, Dark, and Sepia at the top of Reading Settings.';

  @override
  String get guideUserGuideEntryTitle => 'Reopening this guide';

  @override
  String get guideUserGuideEntryCaption =>
      'Come back to this walkthrough any time from \"User Guide\" in Reading Settings.';

  @override
  String get guideTestSurahNavTitle => 'Test: Surah navigation';

  @override
  String get guideTestSurahNavCaption =>
      '1. Open any Surah.\n2. Use Previous/Next to move to another Surah.\n3. Confirm the Arabic name and translation both update.';

  @override
  String get guideTestSearchJumpTitle => 'Test: Search & jump to Surah';

  @override
  String get guideTestSearchJumpCaption =>
      '1. From the Quran tab, tap Search and look up a word (e.g. \"mercy\").\n2. Open a result and confirm it lands on the right Ayah.\n3. Tap the Surah name in the reader and use Go To Surah to jump elsewhere.';

  @override
  String get guideTestFontsTitle => 'Test: Reading & fonts';

  @override
  String get guideTestFontsCaption =>
      '1. Open a Surah and read a few Ayahs.\n2. In Reading Settings, try each Arabic Font.\n3. Confirm the script stays legible in all three.';

  @override
  String get guideTestFontSizeTitle => 'Test: Font size';

  @override
  String get guideTestFontSizeCaption =>
      '1. Open Reading Settings.\n2. Drag the Arabic text size slider to its smallest and largest ends.\n3. Confirm the reading screen updates immediately.';

  @override
  String get guideTestTranslationTitle => 'Test: Translation & Roman Urdu';

  @override
  String get guideTestTranslationCaption =>
      '1. In Reading Settings, set Translation to English — confirm it appears under each Ayah.\n2. Switch to Roman Urdu (Abul Ala Maududi) — confirm it replaces the English line.\n3. Set it back to Off.';

  @override
  String get guideTestAudioTitle => 'Test: Audio';

  @override
  String get guideTestAudioCaption =>
      '1. Play a single Ayah with its play icon — confirm it stops when you tap it again.\n2. Play the whole Surah from the Surah bar\'s play icon.\n3. Confirm the reading screen scrolls to follow along.';

  @override
  String get guideTestBookmarksTitle => 'Test: Bookmarks';

  @override
  String get guideTestBookmarksCaption =>
      '1. Open any Surah and find an Ayah.\n2. Tap its bookmark star.\n3. Open Bookmarks and confirm the Ayah appears.\n4. Remove the bookmark and confirm it disappears.';

  @override
  String get guideTestLastReadsTitle => 'Test: Last Reads';

  @override
  String get guideTestLastReadsCaption =>
      '1. Read a little in two different Surahs, then return Home.\n2. Confirm both appear under Last Reads.\n3. Tap one and confirm it resumes at the right Ayah.';

  @override
  String get guideTestTajweedTitle => 'Test: Tajweed';

  @override
  String get guideTestTajweedCaption =>
      '1. Turn on Tajweed coloring in Reading Settings.\n2. Confirm colored letters appear in the Arabic text.\n3. Open Tajweed Rules and confirm each color is explained.';

  @override
  String get guideTestSettingsTitle => 'Test: Settings';

  @override
  String get guideTestSettingsCaption =>
      '1. Open Reading Settings from the bottom bar.\n2. Open it again from the tune icon while reading.\n3. Confirm both open the same panel, and Done/swipe-down closes it.';

  @override
  String get guideTestThemeTitle => 'Test: Theme';

  @override
  String get guideTestThemeCaption =>
      '1. Switch between Light, Dark, and Sepia in Reading Settings.\n2. Confirm the reading screen and its Tajweed colors stay legible in each.';

  @override
  String get guideTestClosingReopeningTitle =>
      'Test: Closing & reopening the app';

  @override
  String get guideTestClosingReopeningCaption =>
      '1. Set a theme, translation, and a bookmark, then fully close IqraSpace.\n2. Reopen it and confirm your theme, translation, and bookmark are all still there.';

  @override
  String get aboutTitle => 'About IqraSpace';

  @override
  String get aboutTagline => 'Read. Reflect. Connect.';

  @override
  String get aboutIntro =>
      'IqraSpace is a digital Quran space designed to make reading and connecting with the Quran simple, beautiful, and accessible.';

  @override
  String get aboutMissionHeading => 'Our Mission';

  @override
  String get aboutMissionBody =>
      'Our mission is to create a peaceful, easy-to-use Quran experience for everyone. We focus on simplicity, accessibility, thoughtful design, and features that support meaningful daily Quran reading.';

  @override
  String get aboutVisionHeading => 'Our Vision';

  @override
  String get aboutVisionBody =>
      'We envision IqraSpace as a trusted digital space for Quran engagement — bringing together reading, reflection, understanding, and meaningful learning experiences in the future.';

  @override
  String get aboutValuesHeading => 'Our Values';

  @override
  String get aboutValueSimplicityTitle => 'Simplicity';

  @override
  String get aboutValueSimplicityDesc =>
      'A clean, focused experience that keeps attention on the Quran.';

  @override
  String get aboutValueAccessibilityTitle => 'Accessibility';

  @override
  String get aboutValueAccessibilityDesc =>
      'A comfortable reading experience across devices and screen sizes.';

  @override
  String get aboutValueRespectTitle => 'Respect';

  @override
  String get aboutValueRespectDesc =>
      'Every feature and design decision is made with respect for the Quran and its importance.';

  @override
  String get aboutValueContinuousTitle => 'Continuous Improvement';

  @override
  String get aboutValueContinuousDesc =>
      'We continuously learn and improve to better serve our users.';

  @override
  String get aboutAuthenticHeading => 'Authentic Quranic Content';

  @override
  String get aboutAuthenticBody1 =>
      'Accuracy and authenticity are our highest priorities. The Quranic text in IqraSpace is obtained from a trusted and authenticated Quran data source. We do not alter, rewrite, or modify the original Arabic Quranic text.';

  @override
  String get aboutAuthenticBody2 =>
      'Fonts, display settings, bookmarks, translations, and other features are designed to enhance the reading experience while preserving the integrity of the Quranic text. Translations and supporting content are kept distinct from the original Arabic text.';

  @override
  String get aboutBuiltForHeading => 'Built for Quran Readers';

  @override
  String get aboutBuiltForBody =>
      'IqraSpace provides a focused Quran reading experience with customizable fonts, reading preferences, bookmarks, translations, and Tajweed support.';

  @override
  String get aboutLookingAheadHeading => 'Looking Ahead';

  @override
  String get aboutLookingAheadBody =>
      'Our current focus is building an excellent Quran Reader. In the future, we hope to introduce thoughtfully designed learning experiences while keeping the Quran at the heart of IqraSpace.';

  @override
  String get aboutCommitmentHeading => 'Our Commitment';

  @override
  String get aboutCommitmentBody1 =>
      'We are committed to building IqraSpace with care, simplicity, and purpose.';

  @override
  String get aboutCommitmentBody2 =>
      'Our goal is simple: make it easier to read, reflect on, and connect with the Quran.';

  @override
  String get aboutContactHeading => 'Contact Us';

  @override
  String get aboutContactBody => 'For questions or feedback, contact us at:';

  @override
  String get aboutReachUsHeading => 'Reach Us';

  @override
  String get aboutReachX => 'X';

  @override
  String get aboutReachInstagram => 'Instagram';

  @override
  String get aboutReachWebsite => 'Website';

  @override
  String aboutCouldNotOpen(Object label) {
    return 'Could not open $label.';
  }
}
