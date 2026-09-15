import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_te.dart';
import 'app_localizations_ur.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('te'),
    Locale('ur')
  ];

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navQuran.
  ///
  /// In en, this message translates to:
  /// **'Quran'**
  String get navQuran;

  /// No description provided for @navLearn.
  ///
  /// In en, this message translates to:
  /// **'Learn'**
  String get navLearn;

  /// No description provided for @navBookmarks.
  ///
  /// In en, this message translates to:
  /// **'Bookmarks'**
  String get navBookmarks;

  /// No description provided for @navSettings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get navSettings;

  /// No description provided for @homeTagline.
  ///
  /// In en, this message translates to:
  /// **'Read. Listen. Learn. Reflect.'**
  String get homeTagline;

  /// No description provided for @homeReadQuranTitle.
  ///
  /// In en, this message translates to:
  /// **'Read Quran'**
  String get homeReadQuranTitle;

  /// No description provided for @homeReadQuranSubtitle.
  ///
  /// In en, this message translates to:
  /// **'114 Surahs, Tajweed & translation'**
  String get homeReadQuranSubtitle;

  /// No description provided for @homeLearningTitle.
  ///
  /// In en, this message translates to:
  /// **'Learning'**
  String get homeLearningTitle;

  /// No description provided for @homeLearningSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Courses & guided lessons'**
  String get homeLearningSubtitle;

  /// No description provided for @homeLastReads.
  ///
  /// In en, this message translates to:
  /// **'Last Reads'**
  String get homeLastReads;

  /// No description provided for @homeAyahOfTotal.
  ///
  /// In en, this message translates to:
  /// **'Ayah {current} of {total}'**
  String homeAyahOfTotal(Object current, Object total);

  /// No description provided for @homeQuickLinks.
  ///
  /// In en, this message translates to:
  /// **'Quick Links'**
  String get homeQuickLinks;

  /// No description provided for @homeSearch.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get homeSearch;

  /// No description provided for @homeTajweedRules.
  ///
  /// In en, this message translates to:
  /// **'Tajweed Rules'**
  String get homeTajweedRules;

  /// No description provided for @homeReaderSettings.
  ///
  /// In en, this message translates to:
  /// **'Reader Settings'**
  String get homeReaderSettings;

  /// No description provided for @homeBookmarks.
  ///
  /// In en, this message translates to:
  /// **'Bookmarks'**
  String get homeBookmarks;

  /// No description provided for @homeSeeAll.
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get homeSeeAll;

  /// No description provided for @homeNoBookmarksYet.
  ///
  /// In en, this message translates to:
  /// **'No bookmarks yet — tap the star icon while reading to save an ayah.'**
  String get homeNoBookmarksYet;

  /// No description provided for @homeContinueReading.
  ///
  /// In en, this message translates to:
  /// **'CONTINUE READING'**
  String get homeContinueReading;

  /// No description provided for @homeBeginWithSurah.
  ///
  /// In en, this message translates to:
  /// **'Begin with {surahName}'**
  String homeBeginWithSurah(Object surahName);

  /// No description provided for @homeAyahCount.
  ///
  /// In en, this message translates to:
  /// **'Ayah {ayah}'**
  String homeAyahCount(Object ayah);

  /// No description provided for @bookmarksTitle.
  ///
  /// In en, this message translates to:
  /// **'Bookmarks'**
  String get bookmarksTitle;

  /// No description provided for @bookmarksEmpty.
  ///
  /// In en, this message translates to:
  /// **'No bookmarks yet.'**
  String get bookmarksEmpty;

  /// No description provided for @searchHint.
  ///
  /// In en, this message translates to:
  /// **'Search translation (e.g. mercy, patience)…'**
  String get searchHint;

  /// No description provided for @searchPrompt.
  ///
  /// In en, this message translates to:
  /// **'Type a word and press search.'**
  String get searchPrompt;

  /// No description provided for @searchNoMatches.
  ///
  /// In en, this message translates to:
  /// **'No matches found.'**
  String get searchNoMatches;

  /// No description provided for @searchFailed.
  ///
  /// In en, this message translates to:
  /// **'Search failed.\n{error}'**
  String searchFailed(Object error);

  /// No description provided for @learnTitle.
  ///
  /// In en, this message translates to:
  /// **'Learn'**
  String get learnTitle;

  /// No description provided for @learnHeading.
  ///
  /// In en, this message translates to:
  /// **'IqraSpace Learning'**
  String get learnHeading;

  /// No description provided for @learnBody.
  ///
  /// In en, this message translates to:
  /// **'Courses and guided lessons are coming in a future update. For now, dive into the Quran Reader.'**
  String get learnBody;

  /// No description provided for @quranTitle.
  ///
  /// In en, this message translates to:
  /// **'Quran'**
  String get quranTitle;

  /// No description provided for @commonRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get commonRetry;

  /// No description provided for @commonDone.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get commonDone;

  /// No description provided for @commonAyahsCount.
  ///
  /// In en, this message translates to:
  /// **'{count} ayahs'**
  String commonAyahsCount(Object count);

  /// No description provided for @commonCouldNotReachReader.
  ///
  /// In en, this message translates to:
  /// **'Could not reach the Quran Reader.\nCheck your connection and try again.'**
  String get commonCouldNotReachReader;

  /// No description provided for @readerStop.
  ///
  /// In en, this message translates to:
  /// **'Stop'**
  String get readerStop;

  /// No description provided for @readerPlayWholeSurah.
  ///
  /// In en, this message translates to:
  /// **'Play whole surah'**
  String get readerPlayWholeSurah;

  /// No description provided for @readerLoadingAudio.
  ///
  /// In en, this message translates to:
  /// **'Loading audio…'**
  String get readerLoadingAudio;

  /// No description provided for @readerReadingSettings.
  ///
  /// In en, this message translates to:
  /// **'Reading Settings'**
  String get readerReadingSettings;

  /// No description provided for @readerMore.
  ///
  /// In en, this message translates to:
  /// **'More'**
  String get readerMore;

  /// No description provided for @readerStopAutoScroll.
  ///
  /// In en, this message translates to:
  /// **'Stop auto-scroll'**
  String get readerStopAutoScroll;

  /// No description provided for @readerStartAutoScroll.
  ///
  /// In en, this message translates to:
  /// **'Start auto-scroll'**
  String get readerStartAutoScroll;

  /// No description provided for @readerExitReadMode.
  ///
  /// In en, this message translates to:
  /// **'Exit Read Mode'**
  String get readerExitReadMode;

  /// No description provided for @readerReadModeArabicOnly.
  ///
  /// In en, this message translates to:
  /// **'Read Mode (Arabic only)'**
  String get readerReadModeArabicOnly;

  /// No description provided for @readerFirstSurah.
  ///
  /// In en, this message translates to:
  /// **'First Surah'**
  String get readerFirstSurah;

  /// No description provided for @readerLastSurah.
  ///
  /// In en, this message translates to:
  /// **'Last Surah'**
  String get readerLastSurah;

  /// No description provided for @readerPause.
  ///
  /// In en, this message translates to:
  /// **'Pause'**
  String get readerPause;

  /// No description provided for @readerPlayRecitation.
  ///
  /// In en, this message translates to:
  /// **'Play recitation'**
  String get readerPlayRecitation;

  /// No description provided for @readerRemoveBookmark.
  ///
  /// In en, this message translates to:
  /// **'Remove bookmark'**
  String get readerRemoveBookmark;

  /// No description provided for @readerAddBookmark.
  ///
  /// In en, this message translates to:
  /// **'Add bookmark'**
  String get readerAddBookmark;

  /// No description provided for @modeListening.
  ///
  /// In en, this message translates to:
  /// **'Listening'**
  String get modeListening;

  /// No description provided for @modeReading.
  ///
  /// In en, this message translates to:
  /// **'Reading'**
  String get modeReading;

  /// No description provided for @modeReadingListening.
  ///
  /// In en, this message translates to:
  /// **'Reading + Listening'**
  String get modeReadingListening;

  /// No description provided for @listeningTrackArabicOnly.
  ///
  /// In en, this message translates to:
  /// **'Recitation Only'**
  String get listeningTrackArabicOnly;

  /// No description provided for @listeningTrackArabicPlusUrdu.
  ///
  /// In en, this message translates to:
  /// **'Recitation + Urdu Translation'**
  String get listeningTrackArabicPlusUrdu;

  /// No description provided for @listeningTrackComingSoon.
  ///
  /// In en, this message translates to:
  /// **'Urdu translation audio is coming soon for this Surah.'**
  String get listeningTrackComingSoon;

  /// No description provided for @playbackPlay.
  ///
  /// In en, this message translates to:
  /// **'Play'**
  String get playbackPlay;

  /// No description provided for @playbackPause.
  ///
  /// In en, this message translates to:
  /// **'Pause'**
  String get playbackPause;

  /// No description provided for @playbackPreviousSurah.
  ///
  /// In en, this message translates to:
  /// **'Previous Surah'**
  String get playbackPreviousSurah;

  /// No description provided for @playbackNextSurah.
  ///
  /// In en, this message translates to:
  /// **'Next Surah'**
  String get playbackNextSurah;

  /// No description provided for @jumpToSura.
  ///
  /// In en, this message translates to:
  /// **'Sura'**
  String get jumpToSura;

  /// No description provided for @jumpToAyah.
  ///
  /// In en, this message translates to:
  /// **'Ayah'**
  String get jumpToAyah;

  /// No description provided for @jumpToSurahSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Aa..'**
  String get jumpToSurahSearchHint;

  /// No description provided for @jumpToAyahSearchHint.
  ///
  /// In en, this message translates to:
  /// **'1, 2..'**
  String get jumpToAyahSearchHint;

  /// No description provided for @jumpToCouldNotLoad.
  ///
  /// In en, this message translates to:
  /// **'Could not load the Surah list.\n{error}'**
  String jumpToCouldNotLoad(Object error);

  /// No description provided for @tajweedRulesScreenTitle.
  ///
  /// In en, this message translates to:
  /// **'Tajweed Rules'**
  String get tajweedRulesScreenTitle;

  /// No description provided for @settingsClose.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get settingsClose;

  /// No description provided for @settingsReadingSettings.
  ///
  /// In en, this message translates to:
  /// **'Reading Settings'**
  String get settingsReadingSettings;

  /// No description provided for @settingsTheme.
  ///
  /// In en, this message translates to:
  /// **'Theme'**
  String get settingsTheme;

  /// No description provided for @settingsLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get settingsLight;

  /// No description provided for @settingsDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get settingsDark;

  /// No description provided for @settingsSepia.
  ///
  /// In en, this message translates to:
  /// **'Sepia'**
  String get settingsSepia;

  /// No description provided for @settingsArabicFont.
  ///
  /// In en, this message translates to:
  /// **'Arabic Font'**
  String get settingsArabicFont;

  /// No description provided for @settingsArabicTextSize.
  ///
  /// In en, this message translates to:
  /// **'Arabic text size'**
  String get settingsArabicTextSize;

  /// No description provided for @settingsTranslation.
  ///
  /// In en, this message translates to:
  /// **'Translation'**
  String get settingsTranslation;

  /// No description provided for @settingsLanguage.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get settingsLanguage;

  /// No description provided for @settingsTajweed.
  ///
  /// In en, this message translates to:
  /// **'Tajweed'**
  String get settingsTajweed;

  /// No description provided for @settingsTajweedColoring.
  ///
  /// In en, this message translates to:
  /// **'Tajweed coloring'**
  String get settingsTajweedColoring;

  /// No description provided for @settingsTajweedColoringDesc.
  ///
  /// In en, this message translates to:
  /// **'Highlights recitation rules in the Arabic text.'**
  String get settingsTajweedColoringDesc;

  /// No description provided for @settingsTajweedRules.
  ///
  /// In en, this message translates to:
  /// **'Tajweed Rules'**
  String get settingsTajweedRules;

  /// No description provided for @settingsTajweedRulesDesc.
  ///
  /// In en, this message translates to:
  /// **'What each color means'**
  String get settingsTajweedRulesDesc;

  /// No description provided for @settingsReciter.
  ///
  /// In en, this message translates to:
  /// **'Reciter'**
  String get settingsReciter;

  /// No description provided for @settingsReciterModeNote.
  ///
  /// In en, this message translates to:
  /// **'Applies to Reading + Listening Mode. Listening Mode always uses the built-in Al-Afasy recitation.'**
  String get settingsReciterModeNote;

  /// No description provided for @settingsAudioCache.
  ///
  /// In en, this message translates to:
  /// **'Downloaded audio cache'**
  String get settingsAudioCache;

  /// No description provided for @settingsClearAudioCache.
  ///
  /// In en, this message translates to:
  /// **'Clear'**
  String get settingsClearAudioCache;

  /// No description provided for @settingsAudioRecitation.
  ///
  /// In en, this message translates to:
  /// **'Audio & Recitation'**
  String get settingsAudioRecitation;

  /// No description provided for @settingsReading.
  ///
  /// In en, this message translates to:
  /// **'Reading'**
  String get settingsReading;

  /// No description provided for @settingsReadingExperience.
  ///
  /// In en, this message translates to:
  /// **'Reading Experience'**
  String get settingsReadingExperience;

  /// No description provided for @settingsReadMode.
  ///
  /// In en, this message translates to:
  /// **'Read Mode'**
  String get settingsReadMode;

  /// No description provided for @settingsReadModeDesc.
  ///
  /// In en, this message translates to:
  /// **'Arabic text only — hides bookmark, audio, and translation controls.'**
  String get settingsReadModeDesc;

  /// No description provided for @settingsShowBookmarkIcons.
  ///
  /// In en, this message translates to:
  /// **'Show bookmark icons'**
  String get settingsShowBookmarkIcons;

  /// No description provided for @settingsAutoScrollSpeed.
  ///
  /// In en, this message translates to:
  /// **'Auto-scroll speed'**
  String get settingsAutoScrollSpeed;

  /// No description provided for @settingsUserGuide.
  ///
  /// In en, this message translates to:
  /// **'User Guide'**
  String get settingsUserGuide;

  /// No description provided for @settingsUserGuideDesc.
  ///
  /// In en, this message translates to:
  /// **'A screenshot walkthrough of every feature'**
  String get settingsUserGuideDesc;

  /// No description provided for @settingsAboutIqraSpace.
  ///
  /// In en, this message translates to:
  /// **'About IqraSpace'**
  String get settingsAboutIqraSpace;

  /// No description provided for @settingsAboutIqraSpaceDesc.
  ///
  /// In en, this message translates to:
  /// **'Our mission, vision, and values'**
  String get settingsAboutIqraSpaceDesc;

  /// No description provided for @settingsAttribution.
  ///
  /// In en, this message translates to:
  /// **'Text, Tajweed, translation, and audio: Al Quran Cloud (alquran.cloud). Roman Urdu translation: Quran.com. Fonts: the Amiri family (SIL OFL 1.1).'**
  String get settingsAttribution;

  /// No description provided for @translationLangOff.
  ///
  /// In en, this message translates to:
  /// **'Off'**
  String get translationLangOff;

  /// No description provided for @translationLangEnglish.
  ///
  /// In en, this message translates to:
  /// **'English (Sahih International)'**
  String get translationLangEnglish;

  /// No description provided for @translationLangRomanUrdu.
  ///
  /// In en, this message translates to:
  /// **'Roman Urdu (Abul Ala Maududi)'**
  String get translationLangRomanUrdu;

  /// No description provided for @arabicFontAmiriQuran.
  ///
  /// In en, this message translates to:
  /// **'Amiri Quran (Uthmani)'**
  String get arabicFontAmiriQuran;

  /// No description provided for @arabicFontAmiri.
  ///
  /// In en, this message translates to:
  /// **'Amiri (general-purpose)'**
  String get arabicFontAmiri;

  /// No description provided for @arabicFontAmiriQuranColored.
  ///
  /// In en, this message translates to:
  /// **'Amiri Quran Colored'**
  String get arabicFontAmiriQuranColored;

  /// No description provided for @arabicFontColoredCaveat.
  ///
  /// In en, this message translates to:
  /// **'Has its own built-in colors — this app\'s Tajweed coloring won\'t be visible on top of it.'**
  String get arabicFontColoredCaveat;

  /// No description provided for @languageEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @languageTelugu.
  ///
  /// In en, this message translates to:
  /// **'తెలుగు'**
  String get languageTelugu;

  /// No description provided for @languageUrdu.
  ///
  /// In en, this message translates to:
  /// **'اردو'**
  String get languageUrdu;

  /// No description provided for @tajweedRuleGhnName.
  ///
  /// In en, this message translates to:
  /// **'Ghunnah'**
  String get tajweedRuleGhnName;

  /// No description provided for @tajweedRuleGhnDesc.
  ///
  /// In en, this message translates to:
  /// **'A nasal sound of about two counts on a stressed م or ن.'**
  String get tajweedRuleGhnDesc;

  /// No description provided for @tajweedRuleIkhfName.
  ///
  /// In en, this message translates to:
  /// **'Ikhfa (Hiding)'**
  String get tajweedRuleIkhfName;

  /// No description provided for @tajweedRuleIkhfDesc.
  ///
  /// In en, this message translates to:
  /// **'A silent ن or tanween before certain letters is hidden — pronounced with a light nasal sound rather than fully sounded out.'**
  String get tajweedRuleIkhfDesc;

  /// No description provided for @tajweedRuleIkhfShfwName.
  ///
  /// In en, this message translates to:
  /// **'Ikhfa Shafawi (Labial Hiding)'**
  String get tajweedRuleIkhfShfwName;

  /// No description provided for @tajweedRuleIkhfShfwDesc.
  ///
  /// In en, this message translates to:
  /// **'A silent م before ب is hidden with a light nasal sound.'**
  String get tajweedRuleIkhfShfwDesc;

  /// No description provided for @tajweedRuleIqlbName.
  ///
  /// In en, this message translates to:
  /// **'Iqlab (Conversion)'**
  String get tajweedRuleIqlbName;

  /// No description provided for @tajweedRuleIqlbDesc.
  ///
  /// In en, this message translates to:
  /// **'A silent ن or tanween followed by ب is converted into a م sound.'**
  String get tajweedRuleIqlbDesc;

  /// No description provided for @tajweedRuleIdghGhnName.
  ///
  /// In en, this message translates to:
  /// **'Idgham with Ghunnah'**
  String get tajweedRuleIdghGhnName;

  /// No description provided for @tajweedRuleIdghGhnDesc.
  ///
  /// In en, this message translates to:
  /// **'A silent ن or tanween followed by ي ن م و merges into the next letter, with nasalisation.'**
  String get tajweedRuleIdghGhnDesc;

  /// No description provided for @tajweedRuleIdghWGhnName.
  ///
  /// In en, this message translates to:
  /// **'Idgham without Ghunnah'**
  String get tajweedRuleIdghWGhnName;

  /// No description provided for @tajweedRuleIdghWGhnDesc.
  ///
  /// In en, this message translates to:
  /// **'A silent ن or tanween followed by ل or ر merges into the next letter, no nasalisation.'**
  String get tajweedRuleIdghWGhnDesc;

  /// No description provided for @tajweedRuleIdghmShfwName.
  ///
  /// In en, this message translates to:
  /// **'Idgham Shafawi (Labial Merging)'**
  String get tajweedRuleIdghmShfwName;

  /// No description provided for @tajweedRuleIdghmShfwDesc.
  ///
  /// In en, this message translates to:
  /// **'A silent م followed by another م merges together with a nasal sound.'**
  String get tajweedRuleIdghmShfwDesc;

  /// No description provided for @tajweedRuleIdghMusName.
  ///
  /// In en, this message translates to:
  /// **'Idgham Mutajanisayn / Mutaqaribayn'**
  String get tajweedRuleIdghMusName;

  /// No description provided for @tajweedRuleIdghMusDesc.
  ///
  /// In en, this message translates to:
  /// **'Two similar or closely-articulated letters merge into one.'**
  String get tajweedRuleIdghMusDesc;

  /// No description provided for @tajweedRuleQlqName.
  ///
  /// In en, this message translates to:
  /// **'Qalqala (Echoing)'**
  String get tajweedRuleQlqName;

  /// No description provided for @tajweedRuleQlqDesc.
  ///
  /// In en, this message translates to:
  /// **'ق ط ب ج د with a sukun are pronounced with a slight echoing, bouncing sound.'**
  String get tajweedRuleQlqDesc;

  /// No description provided for @tajweedRuleMaddaNormalName.
  ///
  /// In en, this message translates to:
  /// **'Natural Madd'**
  String get tajweedRuleMaddaNormalName;

  /// No description provided for @tajweedRuleMaddaNormalDesc.
  ///
  /// In en, this message translates to:
  /// **'A vowel held for the standard two counts — no extra stretching.'**
  String get tajweedRuleMaddaNormalDesc;

  /// No description provided for @tajweedRuleMaddaPermissibleName.
  ///
  /// In en, this message translates to:
  /// **'Permissible Madd'**
  String get tajweedRuleMaddaPermissibleName;

  /// No description provided for @tajweedRuleMaddaPermissibleDesc.
  ///
  /// In en, this message translates to:
  /// **'A vowel that may be stretched 2, 4, or 5 counts, at the reciter\'s choice.'**
  String get tajweedRuleMaddaPermissibleDesc;

  /// No description provided for @tajweedRuleMaddaNecessaryName.
  ///
  /// In en, this message translates to:
  /// **'Necessary Madd'**
  String get tajweedRuleMaddaNecessaryName;

  /// No description provided for @tajweedRuleMaddaNecessaryDesc.
  ///
  /// In en, this message translates to:
  /// **'A vowel that must be stretched a full 6 counts.'**
  String get tajweedRuleMaddaNecessaryDesc;

  /// No description provided for @tajweedRuleMaddaObligatoryName.
  ///
  /// In en, this message translates to:
  /// **'Obligatory Madd'**
  String get tajweedRuleMaddaObligatoryName;

  /// No description provided for @tajweedRuleMaddaObligatoryDesc.
  ///
  /// In en, this message translates to:
  /// **'A vowel followed by a hamzah in the same word, stretched 4 to 5 counts.'**
  String get tajweedRuleMaddaObligatoryDesc;

  /// No description provided for @tajweedRuleHamWaslName.
  ///
  /// In en, this message translates to:
  /// **'Hamzat ul Wasl (Connecting Hamzah)'**
  String get tajweedRuleHamWaslName;

  /// No description provided for @tajweedRuleHamWaslDesc.
  ///
  /// In en, this message translates to:
  /// **'Dropped in pronunciation when preceded by a vowel — sounded only when starting recitation here.'**
  String get tajweedRuleHamWaslDesc;

  /// No description provided for @tajweedRuleSlntName.
  ///
  /// In en, this message translates to:
  /// **'Silent Letter'**
  String get tajweedRuleSlntName;

  /// No description provided for @tajweedRuleSlntDesc.
  ///
  /// In en, this message translates to:
  /// **'A written letter that is not pronounced.'**
  String get tajweedRuleSlntDesc;

  /// No description provided for @guideTitle.
  ///
  /// In en, this message translates to:
  /// **'User Guide'**
  String get guideTitle;

  /// No description provided for @guideSkip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get guideSkip;

  /// No description provided for @guideHelpUsTest.
  ///
  /// In en, this message translates to:
  /// **'Help Us Test IqraSpace'**
  String get guideHelpUsTest;

  /// No description provided for @guideScreenshotUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Screenshot not available yet'**
  String get guideScreenshotUnavailable;

  /// No description provided for @guideBack.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get guideBack;

  /// No description provided for @guideNext.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get guideNext;

  /// No description provided for @guideHomeTitle.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get guideHomeTitle;

  /// No description provided for @guideHomeCaption.
  ///
  /// In en, this message translates to:
  /// **'Tap \"Read Quran\" to start reading, \"Last Reads\" to resume a Surah, or a Quick Link to jump straight to Search, Tajweed Rules, or Reading Settings.'**
  String get guideHomeCaption;

  /// No description provided for @guideSurahNavTitle.
  ///
  /// In en, this message translates to:
  /// **'The Surah screen'**
  String get guideSurahNavTitle;

  /// No description provided for @guideSurahNavCaption.
  ///
  /// In en, this message translates to:
  /// **'The Surah name at the top opens Go To Surah. Use the Previous/Next row to move between Surahs, and the play icon to hear the whole Surah recited.'**
  String get guideSurahNavCaption;

  /// No description provided for @guideSurahListTitle.
  ///
  /// In en, this message translates to:
  /// **'Choosing a Surah'**
  String get guideSurahListTitle;

  /// No description provided for @guideSurahListCaption.
  ///
  /// In en, this message translates to:
  /// **'The Quran tab lists all 114 Surahs — scroll or tap the search icon to find one by name.'**
  String get guideSurahListCaption;

  /// No description provided for @guideJumpToSurahTitle.
  ///
  /// In en, this message translates to:
  /// **'Go To Surah'**
  String get guideJumpToSurahTitle;

  /// No description provided for @guideJumpToSurahCaption.
  ///
  /// In en, this message translates to:
  /// **'Spin or search either wheel to jump straight to any Surah and Ayah.'**
  String get guideJumpToSurahCaption;

  /// No description provided for @guideReadingAyahTitle.
  ///
  /// In en, this message translates to:
  /// **'Reading an Ayah'**
  String get guideReadingAyahTitle;

  /// No description provided for @guideReadingAyahCaption.
  ///
  /// In en, this message translates to:
  /// **'Each Ayah has its own play button and bookmark star. Turn on a translation in Reading Settings to see it appear beneath the Arabic text.'**
  String get guideReadingAyahCaption;

  /// No description provided for @guideSettingsEntryTitle.
  ///
  /// In en, this message translates to:
  /// **'Opening Settings'**
  String get guideSettingsEntryTitle;

  /// No description provided for @guideSettingsEntryCaption.
  ///
  /// In en, this message translates to:
  /// **'Reading Settings opens from the Settings tab in the bottom bar, or the tune icon while reading — both open the same panel.'**
  String get guideSettingsEntryCaption;

  /// No description provided for @guideSettingsPanelTitle.
  ///
  /// In en, this message translates to:
  /// **'Reading Settings'**
  String get guideSettingsPanelTitle;

  /// No description provided for @guideSettingsPanelCaption.
  ///
  /// In en, this message translates to:
  /// **'Theme and Arabic Font are the first two sections in the Reading Settings panel.'**
  String get guideSettingsPanelCaption;

  /// No description provided for @guideFontsTitle.
  ///
  /// In en, this message translates to:
  /// **'Arabic Font'**
  String get guideFontsTitle;

  /// No description provided for @guideFontsCaption.
  ///
  /// In en, this message translates to:
  /// **'Pick between three Arabic scripts under Arabic Font in Reading Settings — the Quran text updates immediately.'**
  String get guideFontsCaption;

  /// No description provided for @guideFontSizeTitle.
  ///
  /// In en, this message translates to:
  /// **'Reading size'**
  String get guideFontSizeTitle;

  /// No description provided for @guideFontSizeCaption.
  ///
  /// In en, this message translates to:
  /// **'Drag the \"Arabic text size\" slider in Reading Settings to make the script larger or smaller.'**
  String get guideFontSizeCaption;

  /// No description provided for @guideTranslationTitle.
  ///
  /// In en, this message translates to:
  /// **'Translation'**
  String get guideTranslationTitle;

  /// No description provided for @guideTranslationCaption.
  ///
  /// In en, this message translates to:
  /// **'Choose English or Roman Urdu under Translation in Reading Settings — or Off to read Arabic only.'**
  String get guideTranslationCaption;

  /// No description provided for @guideBookmarksScreenTitle.
  ///
  /// In en, this message translates to:
  /// **'Bookmarks'**
  String get guideBookmarksScreenTitle;

  /// No description provided for @guideBookmarksScreenCaption.
  ///
  /// In en, this message translates to:
  /// **'Every Ayah you star is saved here — tap one to jump straight back to it.'**
  String get guideBookmarksScreenCaption;

  /// No description provided for @guideLastReadsTitle.
  ///
  /// In en, this message translates to:
  /// **'Last Reads'**
  String get guideLastReadsTitle;

  /// No description provided for @guideLastReadsCaption.
  ///
  /// In en, this message translates to:
  /// **'Home keeps a short history of recent Surahs — tap one to pick up right where you left off.'**
  String get guideLastReadsCaption;

  /// No description provided for @guideAudioTitle.
  ///
  /// In en, this message translates to:
  /// **'Audio'**
  String get guideAudioTitle;

  /// No description provided for @guideAudioCaption.
  ///
  /// In en, this message translates to:
  /// **'Play a single Ayah with its own play icon, or the whole Surah with the play icon in the Surah bar.'**
  String get guideAudioCaption;

  /// No description provided for @guideTajweedTitle.
  ///
  /// In en, this message translates to:
  /// **'Tajweed'**
  String get guideTajweedTitle;

  /// No description provided for @guideTajweedCaption.
  ///
  /// In en, this message translates to:
  /// **'Turn on Tajweed coloring in Reading Settings, then open \"Tajweed Rules\" to see what each color means.'**
  String get guideTajweedCaption;

  /// No description provided for @guideThemeTitle.
  ///
  /// In en, this message translates to:
  /// **'Theme'**
  String get guideThemeTitle;

  /// No description provided for @guideThemeCaption.
  ///
  /// In en, this message translates to:
  /// **'Switch between Light, Dark, and Sepia at the top of Reading Settings.'**
  String get guideThemeCaption;

  /// No description provided for @guideUserGuideEntryTitle.
  ///
  /// In en, this message translates to:
  /// **'Reopening this guide'**
  String get guideUserGuideEntryTitle;

  /// No description provided for @guideUserGuideEntryCaption.
  ///
  /// In en, this message translates to:
  /// **'Come back to this walkthrough any time from \"User Guide\" in Reading Settings.'**
  String get guideUserGuideEntryCaption;

  /// No description provided for @guideTestSurahNavTitle.
  ///
  /// In en, this message translates to:
  /// **'Test: Surah navigation'**
  String get guideTestSurahNavTitle;

  /// No description provided for @guideTestSurahNavCaption.
  ///
  /// In en, this message translates to:
  /// **'1. Open any Surah.\n2. Use Previous/Next to move to another Surah.\n3. Confirm the Arabic name and translation both update.'**
  String get guideTestSurahNavCaption;

  /// No description provided for @guideTestSearchJumpTitle.
  ///
  /// In en, this message translates to:
  /// **'Test: Search & jump to Surah'**
  String get guideTestSearchJumpTitle;

  /// No description provided for @guideTestSearchJumpCaption.
  ///
  /// In en, this message translates to:
  /// **'1. From the Quran tab, tap Search and look up a word (e.g. \"mercy\").\n2. Open a result and confirm it lands on the right Ayah.\n3. Tap the Surah name in the reader and use Go To Surah to jump elsewhere.'**
  String get guideTestSearchJumpCaption;

  /// No description provided for @guideTestFontsTitle.
  ///
  /// In en, this message translates to:
  /// **'Test: Reading & fonts'**
  String get guideTestFontsTitle;

  /// No description provided for @guideTestFontsCaption.
  ///
  /// In en, this message translates to:
  /// **'1. Open a Surah and read a few Ayahs.\n2. In Reading Settings, try each Arabic Font.\n3. Confirm the script stays legible in all three.'**
  String get guideTestFontsCaption;

  /// No description provided for @guideTestFontSizeTitle.
  ///
  /// In en, this message translates to:
  /// **'Test: Font size'**
  String get guideTestFontSizeTitle;

  /// No description provided for @guideTestFontSizeCaption.
  ///
  /// In en, this message translates to:
  /// **'1. Open Reading Settings.\n2. Drag the Arabic text size slider to its smallest and largest ends.\n3. Confirm the reading screen updates immediately.'**
  String get guideTestFontSizeCaption;

  /// No description provided for @guideTestTranslationTitle.
  ///
  /// In en, this message translates to:
  /// **'Test: Translation & Roman Urdu'**
  String get guideTestTranslationTitle;

  /// No description provided for @guideTestTranslationCaption.
  ///
  /// In en, this message translates to:
  /// **'1. In Reading Settings, set Translation to English — confirm it appears under each Ayah.\n2. Switch to Roman Urdu (Abul Ala Maududi) — confirm it replaces the English line.\n3. Set it back to Off.'**
  String get guideTestTranslationCaption;

  /// No description provided for @guideTestAudioTitle.
  ///
  /// In en, this message translates to:
  /// **'Test: Audio'**
  String get guideTestAudioTitle;

  /// No description provided for @guideTestAudioCaption.
  ///
  /// In en, this message translates to:
  /// **'1. Play a single Ayah with its play icon — confirm it stops when you tap it again.\n2. Play the whole Surah from the Surah bar\'s play icon.\n3. Confirm the reading screen scrolls to follow along.'**
  String get guideTestAudioCaption;

  /// No description provided for @guideTestBookmarksTitle.
  ///
  /// In en, this message translates to:
  /// **'Test: Bookmarks'**
  String get guideTestBookmarksTitle;

  /// No description provided for @guideTestBookmarksCaption.
  ///
  /// In en, this message translates to:
  /// **'1. Open any Surah and find an Ayah.\n2. Tap its bookmark star.\n3. Open Bookmarks and confirm the Ayah appears.\n4. Remove the bookmark and confirm it disappears.'**
  String get guideTestBookmarksCaption;

  /// No description provided for @guideTestLastReadsTitle.
  ///
  /// In en, this message translates to:
  /// **'Test: Last Reads'**
  String get guideTestLastReadsTitle;

  /// No description provided for @guideTestLastReadsCaption.
  ///
  /// In en, this message translates to:
  /// **'1. Read a little in two different Surahs, then return Home.\n2. Confirm both appear under Last Reads.\n3. Tap one and confirm it resumes at the right Ayah.'**
  String get guideTestLastReadsCaption;

  /// No description provided for @guideTestTajweedTitle.
  ///
  /// In en, this message translates to:
  /// **'Test: Tajweed'**
  String get guideTestTajweedTitle;

  /// No description provided for @guideTestTajweedCaption.
  ///
  /// In en, this message translates to:
  /// **'1. Turn on Tajweed coloring in Reading Settings.\n2. Confirm colored letters appear in the Arabic text.\n3. Open Tajweed Rules and confirm each color is explained.'**
  String get guideTestTajweedCaption;

  /// No description provided for @guideTestSettingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Test: Settings'**
  String get guideTestSettingsTitle;

  /// No description provided for @guideTestSettingsCaption.
  ///
  /// In en, this message translates to:
  /// **'1. Open Reading Settings from the bottom bar.\n2. Open it again from the tune icon while reading.\n3. Confirm both open the same panel, and Done/swipe-down closes it.'**
  String get guideTestSettingsCaption;

  /// No description provided for @guideTestThemeTitle.
  ///
  /// In en, this message translates to:
  /// **'Test: Theme'**
  String get guideTestThemeTitle;

  /// No description provided for @guideTestThemeCaption.
  ///
  /// In en, this message translates to:
  /// **'1. Switch between Light, Dark, and Sepia in Reading Settings.\n2. Confirm the reading screen and its Tajweed colors stay legible in each.'**
  String get guideTestThemeCaption;

  /// No description provided for @guideTestClosingReopeningTitle.
  ///
  /// In en, this message translates to:
  /// **'Test: Closing & reopening the app'**
  String get guideTestClosingReopeningTitle;

  /// No description provided for @guideTestClosingReopeningCaption.
  ///
  /// In en, this message translates to:
  /// **'1. Set a theme, translation, and a bookmark, then fully close IqraSpace.\n2. Reopen it and confirm your theme, translation, and bookmark are all still there.'**
  String get guideTestClosingReopeningCaption;

  /// No description provided for @aboutTitle.
  ///
  /// In en, this message translates to:
  /// **'About IqraSpace'**
  String get aboutTitle;

  /// No description provided for @aboutTagline.
  ///
  /// In en, this message translates to:
  /// **'Read. Reflect. Connect.'**
  String get aboutTagline;

  /// No description provided for @aboutIntro.
  ///
  /// In en, this message translates to:
  /// **'IqraSpace is a digital Quran space designed to make reading and connecting with the Quran simple, beautiful, and accessible.'**
  String get aboutIntro;

  /// No description provided for @aboutMissionHeading.
  ///
  /// In en, this message translates to:
  /// **'Our Mission'**
  String get aboutMissionHeading;

  /// No description provided for @aboutMissionBody.
  ///
  /// In en, this message translates to:
  /// **'Our mission is to create a peaceful, easy-to-use Quran experience for everyone. We focus on simplicity, accessibility, thoughtful design, and features that support meaningful daily Quran reading.'**
  String get aboutMissionBody;

  /// No description provided for @aboutVisionHeading.
  ///
  /// In en, this message translates to:
  /// **'Our Vision'**
  String get aboutVisionHeading;

  /// No description provided for @aboutVisionBody.
  ///
  /// In en, this message translates to:
  /// **'We envision IqraSpace as a trusted digital space for Quran engagement — bringing together reading, reflection, understanding, and meaningful learning experiences in the future.'**
  String get aboutVisionBody;

  /// No description provided for @aboutValuesHeading.
  ///
  /// In en, this message translates to:
  /// **'Our Values'**
  String get aboutValuesHeading;

  /// No description provided for @aboutValueSimplicityTitle.
  ///
  /// In en, this message translates to:
  /// **'Simplicity'**
  String get aboutValueSimplicityTitle;

  /// No description provided for @aboutValueSimplicityDesc.
  ///
  /// In en, this message translates to:
  /// **'A clean, focused experience that keeps attention on the Quran.'**
  String get aboutValueSimplicityDesc;

  /// No description provided for @aboutValueAccessibilityTitle.
  ///
  /// In en, this message translates to:
  /// **'Accessibility'**
  String get aboutValueAccessibilityTitle;

  /// No description provided for @aboutValueAccessibilityDesc.
  ///
  /// In en, this message translates to:
  /// **'A comfortable reading experience across devices and screen sizes.'**
  String get aboutValueAccessibilityDesc;

  /// No description provided for @aboutValueRespectTitle.
  ///
  /// In en, this message translates to:
  /// **'Respect'**
  String get aboutValueRespectTitle;

  /// No description provided for @aboutValueRespectDesc.
  ///
  /// In en, this message translates to:
  /// **'Every feature and design decision is made with respect for the Quran and its importance.'**
  String get aboutValueRespectDesc;

  /// No description provided for @aboutValueContinuousTitle.
  ///
  /// In en, this message translates to:
  /// **'Continuous Improvement'**
  String get aboutValueContinuousTitle;

  /// No description provided for @aboutValueContinuousDesc.
  ///
  /// In en, this message translates to:
  /// **'We continuously learn and improve to better serve our users.'**
  String get aboutValueContinuousDesc;

  /// No description provided for @aboutAuthenticHeading.
  ///
  /// In en, this message translates to:
  /// **'Authentic Quranic Content'**
  String get aboutAuthenticHeading;

  /// No description provided for @aboutAuthenticBody1.
  ///
  /// In en, this message translates to:
  /// **'Accuracy and authenticity are our highest priorities. The Quranic text in IqraSpace is obtained from a trusted and authenticated Quran data source. We do not alter, rewrite, or modify the original Arabic Quranic text.'**
  String get aboutAuthenticBody1;

  /// No description provided for @aboutAuthenticBody2.
  ///
  /// In en, this message translates to:
  /// **'Fonts, display settings, bookmarks, translations, and other features are designed to enhance the reading experience while preserving the integrity of the Quranic text. Translations and supporting content are kept distinct from the original Arabic text.'**
  String get aboutAuthenticBody2;

  /// No description provided for @aboutBuiltForHeading.
  ///
  /// In en, this message translates to:
  /// **'Built for Quran Readers'**
  String get aboutBuiltForHeading;

  /// No description provided for @aboutBuiltForBody.
  ///
  /// In en, this message translates to:
  /// **'IqraSpace provides a focused Quran reading experience with customizable fonts, reading preferences, bookmarks, translations, and Tajweed support.'**
  String get aboutBuiltForBody;

  /// No description provided for @aboutLookingAheadHeading.
  ///
  /// In en, this message translates to:
  /// **'Looking Ahead'**
  String get aboutLookingAheadHeading;

  /// No description provided for @aboutLookingAheadBody.
  ///
  /// In en, this message translates to:
  /// **'Our current focus is building an excellent Quran Reader. In the future, we hope to introduce thoughtfully designed learning experiences while keeping the Quran at the heart of IqraSpace.'**
  String get aboutLookingAheadBody;

  /// No description provided for @aboutCommitmentHeading.
  ///
  /// In en, this message translates to:
  /// **'Our Commitment'**
  String get aboutCommitmentHeading;

  /// No description provided for @aboutCommitmentBody1.
  ///
  /// In en, this message translates to:
  /// **'We are committed to building IqraSpace with care, simplicity, and purpose.'**
  String get aboutCommitmentBody1;

  /// No description provided for @aboutCommitmentBody2.
  ///
  /// In en, this message translates to:
  /// **'Our goal is simple: make it easier to read, reflect on, and connect with the Quran.'**
  String get aboutCommitmentBody2;

  /// No description provided for @aboutContactHeading.
  ///
  /// In en, this message translates to:
  /// **'Contact Us'**
  String get aboutContactHeading;

  /// No description provided for @aboutContactBody.
  ///
  /// In en, this message translates to:
  /// **'For questions or feedback, contact us at:'**
  String get aboutContactBody;

  /// No description provided for @aboutReachUsHeading.
  ///
  /// In en, this message translates to:
  /// **'Reach Us'**
  String get aboutReachUsHeading;

  /// No description provided for @aboutReachX.
  ///
  /// In en, this message translates to:
  /// **'X'**
  String get aboutReachX;

  /// No description provided for @aboutReachInstagram.
  ///
  /// In en, this message translates to:
  /// **'Instagram'**
  String get aboutReachInstagram;

  /// No description provided for @aboutReachWebsite.
  ///
  /// In en, this message translates to:
  /// **'Website'**
  String get aboutReachWebsite;

  /// No description provided for @aboutCouldNotOpen.
  ///
  /// In en, this message translates to:
  /// **'Could not open {label}.'**
  String aboutCouldNotOpen(Object label);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'te', 'ur'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'te':
      return AppLocalizationsTe();
    case 'ur':
      return AppLocalizationsUr();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
