// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Telugu (`te`).
class AppLocalizationsTe extends AppLocalizations {
  AppLocalizationsTe([String locale = 'te']) : super(locale);

  @override
  String get navHome => 'హోమ్';

  @override
  String get navQuran => 'ఖురాన్';

  @override
  String get navLearn => 'నేర్చుకోండి';

  @override
  String get navBookmarks => 'బుక్‌మార్క్‌లు';

  @override
  String get navSettings => 'సెట్టింగ్‌లు';

  @override
  String get homeTagline => 'చదవండి. వినండి. నేర్చుకోండి. ఆలోచించండి.';

  @override
  String get homeReadQuranTitle => 'ఖురాన్ చదవండి';

  @override
  String get homeReadQuranSubtitle => '114 సూరాలు, తజ్వీద్ & అనువాదం';

  @override
  String get homeLearningTitle => 'అభ్యాసం';

  @override
  String get homeLearningSubtitle => 'కోర్సులు & మార్గదర్శక పాఠాలు';

  @override
  String get homeLastReads => 'ఇటీవలి పఠనాలు';

  @override
  String homeAyahOfTotal(Object current, Object total) {
    return 'ఆయత్ $current / $total';
  }

  @override
  String get homeQuickLinks => 'త్వరిత లింక్‌లు';

  @override
  String get homeSearch => 'శోధన';

  @override
  String get homeTajweedRules => 'తజ్వీద్ నియమాలు';

  @override
  String get homeReaderSettings => 'రీడర్ సెట్టింగ్‌లు';

  @override
  String get homeBookmarks => 'బుక్‌మార్క్‌లు';

  @override
  String get homeSeeAll => 'అన్నీ చూడండి';

  @override
  String get homeNoBookmarksYet =>
      'ఇంకా బుక్‌మార్క్‌లు లేవు — చదువుతున్నప్పుడు ఆయత్‌ను సేవ్ చేయడానికి నక్షత్ర చిహ్నాన్ని తట్టండి.';

  @override
  String get homeContinueReading => 'చదవడం కొనసాగించండి';

  @override
  String homeBeginWithSurah(Object surahName) {
    return '$surahName తో ప్రారంభించండి';
  }

  @override
  String homeAyahCount(Object ayah) {
    return 'ఆయత్ $ayah';
  }

  @override
  String get bookmarksTitle => 'బుక్‌మార్క్‌లు';

  @override
  String get bookmarksEmpty => 'ఇంకా బుక్‌మార్క్‌లు లేవు.';

  @override
  String get searchHint => 'అనువాదంలో శోధించండి (ఉదా. దయ, సహనం)…';

  @override
  String get searchPrompt => 'ఒక పదాన్ని టైప్ చేసి శోధనను నొక్కండి.';

  @override
  String get searchNoMatches => 'ఏ ఫలితాలు కనిపించలేదు.';

  @override
  String searchFailed(Object error) {
    return 'శోధన విఫలమైంది.\n$error';
  }

  @override
  String get learnTitle => 'నేర్చుకోండి';

  @override
  String get learnHeading => 'ఇక్రాస్పేస్ అభ్యాసం';

  @override
  String get learnBody =>
      'కోర్సులు మరియు మార్గదర్శక పాఠాలు రాబోయే అప్‌డేట్‌లో వస్తాయి. ప్రస్తుతానికి, ఖురాన్ రీడర్‌లో మునిగిపోండి.';

  @override
  String get quranTitle => 'ఖురాన్';

  @override
  String get commonRetry => 'మళ్లీ ప్రయత్నించండి';

  @override
  String get commonDone => 'పూర్తయింది';

  @override
  String commonAyahsCount(Object count) {
    return '$count ఆయాత్‌లు';
  }

  @override
  String get commonCouldNotReachReader =>
      'ఖురాన్ రీడర్‌ను చేరుకోలేకపోయాము.\nమీ కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.';

  @override
  String get readerStop => 'ఆపండి';

  @override
  String get readerPlayWholeSurah => 'మొత్తం సూరా ప్లే చేయండి';

  @override
  String get readerLoadingAudio => 'ఆడియో లోడ్ అవుతోంది…';

  @override
  String get readerReadingSettings => 'పఠన సెట్టింగ్‌లు';

  @override
  String get readerMore => 'మరిన్ని';

  @override
  String get readerStopAutoScroll => 'ఆటో-స్క్రోల్ ఆపండి';

  @override
  String get readerStartAutoScroll => 'ఆటో-స్క్రోల్ ప్రారంభించండి';

  @override
  String get readerExitReadMode => 'రీడ్ మోడ్ నుండి నిష్క్రమించండి';

  @override
  String get readerReadModeArabicOnly => 'రీడ్ మోడ్ (అరబిక్ మాత్రమే)';

  @override
  String get readerFirstSurah => 'మొదటి సూరా';

  @override
  String get readerLastSurah => 'చివరి సూరా';

  @override
  String get readerPause => 'పాజ్';

  @override
  String get readerPlayRecitation => 'పారాయణం ప్లే చేయండి';

  @override
  String get readerRemoveBookmark => 'బుక్‌మార్క్ తీసివేయండి';

  @override
  String get readerAddBookmark => 'బుక్‌మార్క్ జోడించండి';

  @override
  String get modeListening => 'వినడం';

  @override
  String get modeReading => 'చదవడం';

  @override
  String get modeReadingListening => 'చదవడం + వినడం';

  @override
  String get listeningTrackArabicOnly => 'పారాయణం మాత్రమే';

  @override
  String get listeningTrackArabicPlusUrdu => 'పారాయణం + ఉర్దూ అనువాదం';

  @override
  String get listeningTrackComingSoon =>
      'ఈ సూరా కోసం ఉర్దూ అనువాద ఆడియో త్వరలో అందుబాటులోకి వస్తుంది.';

  @override
  String get playbackPlay => 'ప్లే';

  @override
  String get playbackPause => 'పాజ్';

  @override
  String get playbackPreviousSurah => 'మునుపటి సూరా';

  @override
  String get playbackNextSurah => 'తదుపరి సూరా';

  @override
  String get jumpToSura => 'సూరా';

  @override
  String get jumpToAyah => 'ఆయత్';

  @override
  String get jumpToSurahSearchHint => 'Aa..';

  @override
  String get jumpToAyahSearchHint => '1, 2..';

  @override
  String jumpToCouldNotLoad(Object error) {
    return 'సూరాల జాబితాను లోడ్ చేయలేకపోయాము.\n$error';
  }

  @override
  String get tajweedRulesScreenTitle => 'తజ్వీద్ నియమాలు';

  @override
  String get settingsClose => 'మూసివేయండి';

  @override
  String get settingsReadingSettings => 'పఠన సెట్టింగ్‌లు';

  @override
  String get settingsTheme => 'థీమ్';

  @override
  String get settingsLight => 'లైట్';

  @override
  String get settingsDark => 'డార్క్';

  @override
  String get settingsSepia => 'సెపియా';

  @override
  String get settingsArabicFont => 'అరబిక్ ఫాంట్';

  @override
  String get settingsArabicTextSize => 'అరబిక్ టెక్స్ట్ పరిమాణం';

  @override
  String get settingsTranslation => 'అనువాదం';

  @override
  String get settingsLanguage => 'భాష';

  @override
  String get settingsTajweed => 'తజ్వీద్';

  @override
  String get settingsTajweedColoring => 'తజ్వీద్ రంగులు';

  @override
  String get settingsTajweedColoringDesc =>
      'అరబిక్ టెక్స్ట్‌లో పారాయణ నియమాలను హైలైట్ చేస్తుంది.';

  @override
  String get settingsTajweedRules => 'తజ్వీద్ నియమాలు';

  @override
  String get settingsTajweedRulesDesc => 'ప్రతి రంగు అర్థం ఏమిటి';

  @override
  String get settingsReciter => 'పారాయణకర్త';

  @override
  String get settingsReciterModeNote =>
      'రీడింగ్ + లిజనింగ్ మోడ్‌కు మాత్రమే వర్తిస్తుంది. లిజనింగ్ మోడ్ ఎల్లప్పుడూ అంతర్నిర్మిత అల్-అఫాసీ పారాయణాన్ని ఉపయోగిస్తుంది.';

  @override
  String get settingsAudioCache => 'డౌన్‌లోడ్ చేసిన ఆడియో కాష్';

  @override
  String get settingsClearAudioCache => 'క్లియర్ చేయి';

  @override
  String get settingsAudioRecitation => 'Audio & Recitation';

  @override
  String get settingsReading => 'పఠనం';

  @override
  String get settingsReadingExperience => 'Reading Experience';

  @override
  String get settingsReadMode => 'రీడ్ మోడ్';

  @override
  String get settingsReadModeDesc =>
      'అరబిక్ టెక్స్ట్ మాత్రమే — బుక్‌మార్క్, ఆడియో, మరియు అనువాద నియంత్రణలను దాచిపెడుతుంది.';

  @override
  String get settingsShowBookmarkIcons => 'బుక్‌మార్క్ చిహ్నాలను చూపించు';

  @override
  String get settingsAutoScrollSpeed => 'ఆటో-స్క్రోల్ వేగం';

  @override
  String get settingsUserGuide => 'యూజర్ గైడ్';

  @override
  String get settingsUserGuideDesc =>
      'ప్రతి ఫీచర్ యొక్క స్క్రీన్‌షాట్ వాక్‌త్రూ';

  @override
  String get settingsAboutIqraSpace => 'ఇక్రాస్పేస్ గురించి';

  @override
  String get settingsAboutIqraSpaceDesc => 'మా లక్ష్యం, దృష్టి, మరియు విలువలు';

  @override
  String get settingsAttribution =>
      'వచనం, తజ్వీద్, అనువాదం, మరియు ఆడియో: Al Quran Cloud (alquran.cloud). రోమన్ ఉర్దూ అనువాదం: Quran.com. ఫాంట్‌లు: Amiri కుటుంబం (SIL OFL 1.1).';

  @override
  String get translationLangOff => 'ఆఫ్';

  @override
  String get translationLangEnglish => 'ఇంగ్లీష్ (సహీహ్ ఇంటర్నేషనల్)';

  @override
  String get translationLangRomanUrdu => 'రోమన్ ఉర్దూ (అబుల్ అలా మౌదూదీ)';

  @override
  String get arabicFontAmiriQuran => 'అమిరి ఖురాన్ (ఉస్మానీ)';

  @override
  String get arabicFontAmiri => 'అమిరి (సాధారణ ప్రయోజన)';

  @override
  String get arabicFontAmiriQuranColored => 'అమిరి ఖురాన్ కలర్డ్';

  @override
  String get arabicFontColoredCaveat =>
      'దీనికి స్వంత అంతర్నిర్మిత రంగులు ఉన్నాయి — ఈ యాప్ యొక్క తజ్వీద్ రంగులు దీనిపై కనిపించవు.';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageTelugu => 'తెలుగు';

  @override
  String get languageUrdu => 'اردو';

  @override
  String get tajweedRuleGhnName => 'గున్నహ్';

  @override
  String get tajweedRuleGhnDesc =>
      'ఒత్తిడితో కూడిన م లేదా ن పై సుమారు రెండు లెక్కల నాసిక ధ్వని.';

  @override
  String get tajweedRuleIkhfName => 'ఇఖ్ఫా (దాచడం)';

  @override
  String get tajweedRuleIkhfDesc =>
      'కొన్ని అక్షరాల ముందు నిశ్శబ్ద ن లేదా తన్వీన్ దాచబడుతుంది — పూర్తిగా పలకడానికి బదులు తేలికపాటి నాసిక ధ్వనితో పలకబడుతుంది.';

  @override
  String get tajweedRuleIkhfShfwName => 'ఇఖ్ఫా షఫవీ (పెదవి దాపు)';

  @override
  String get tajweedRuleIkhfShfwDesc =>
      'ب ముందు నిశ్శబ్ద م తేలికపాటి నాసిక ధ్వనితో దాచబడుతుంది.';

  @override
  String get tajweedRuleIqlbName => 'ఇక్లాబ్ (మార్పిడి)';

  @override
  String get tajweedRuleIqlbDesc =>
      'నిశ్శబ్ద ن లేదా తన్వీన్ తర్వాత ب వస్తే అది م ధ్వనిగా మార్చబడుతుంది.';

  @override
  String get tajweedRuleIdghGhnName => 'గున్నహ్‌తో ఇద్గామ్';

  @override
  String get tajweedRuleIdghGhnDesc =>
      'నిశ్శబ్ద ن లేదా తన్వీన్ తర్వాత ي ن م و వస్తే, నాసికీకరణతో తదుపరి అక్షరంలో కలిసిపోతుంది.';

  @override
  String get tajweedRuleIdghWGhnName => 'గున్నహ్ లేకుండా ఇద్గామ్';

  @override
  String get tajweedRuleIdghWGhnDesc =>
      'నిశ్శబ్ద ن లేదా తన్వీన్ తర్వాత ل లేదా ر వస్తే, నాసికీకరణ లేకుండా తదుపరి అక్షరంలో కలిసిపోతుంది.';

  @override
  String get tajweedRuleIdghmShfwName => 'ఇద్గామ్ షఫవీ (పెదవి విలీనం)';

  @override
  String get tajweedRuleIdghmShfwDesc =>
      'నిశ్శబ్ద م తర్వాత మరో م వస్తే నాసిక ధ్వనితో కలిసిపోతాయి.';

  @override
  String get tajweedRuleIdghMusName => 'ఇద్గామ్ ముతజానిసైన్ / ముతఖారిబైన్';

  @override
  String get tajweedRuleIdghMusDesc =>
      'రెండు పోలిన లేదా దగ్గరి ఉచ్చారణ కలిగిన అక్షరాలు ఒకటిగా కలిసిపోతాయి.';

  @override
  String get tajweedRuleQlqName => 'ఖల్ఖలా (ప్రతిధ్వని)';

  @override
  String get tajweedRuleQlqDesc =>
      'సుకూన్‌తో కూడిన ق ط ب ج د తేలికపాటి ప్రతిధ్వని, ఎగిరే ధ్వనితో పలకబడతాయి.';

  @override
  String get tajweedRuleMaddaNormalName => 'సహజ మద్ద్';

  @override
  String get tajweedRuleMaddaNormalDesc =>
      'ఒక అచ్చు ప్రామాణిక రెండు లెక్కల వరకు పట్టుకోబడుతుంది — అదనపు సాగదీత లేదు.';

  @override
  String get tajweedRuleMaddaPermissibleName => 'అనుమతించదగిన మద్ద్';

  @override
  String get tajweedRuleMaddaPermissibleDesc =>
      'పారాయణకర్త ఎంపిక మేరకు 2, 4, లేదా 5 లెక్కల వరకు సాగదీయగల అచ్చు.';

  @override
  String get tajweedRuleMaddaNecessaryName => 'అవసరమైన మద్ద్';

  @override
  String get tajweedRuleMaddaNecessaryDesc =>
      'పూర్తి 6 లెక్కల వరకు సాగదీయవలసిన అచ్చు.';

  @override
  String get tajweedRuleMaddaObligatoryName => 'తప్పనిసరి మద్ద్';

  @override
  String get tajweedRuleMaddaObligatoryDesc =>
      'అదే పదంలో హంజా తర్వాత వచ్చే అచ్చు, 4 నుండి 5 లెక్కల వరకు సాగదీయబడుతుంది.';

  @override
  String get tajweedRuleHamWaslName => 'హమ్జతుల్ వస్ల్ (కలిపే హమ్జా)';

  @override
  String get tajweedRuleHamWaslDesc =>
      'అచ్చు ముందు ఉన్నప్పుడు ఉచ్చారణలో వదిలివేయబడుతుంది — ఇక్కడ నుండి పారాయణం ప్రారంభించినప్పుడు మాత్రమే పలకబడుతుంది.';

  @override
  String get tajweedRuleSlntName => 'నిశ్శబ్ద అక్షరం';

  @override
  String get tajweedRuleSlntDesc => 'పలకబడని వ్రాతపూర్వక అక్షరం.';

  @override
  String get guideTitle => 'యూజర్ గైడ్';

  @override
  String get guideSkip => 'దాటవేయండి';

  @override
  String get guideHelpUsTest =>
      'ఇక్రాస్పేస్‌ను పరీక్షించడంలో మాకు సహాయం చేయండి';

  @override
  String get guideScreenshotUnavailable => 'స్క్రీన్‌షాట్ ఇంకా అందుబాటులో లేదు';

  @override
  String get guideBack => 'వెనుకకు';

  @override
  String get guideNext => 'తదుపరి';

  @override
  String get guideHomeTitle => 'హోమ్';

  @override
  String get guideHomeCaption =>
      'చదవడం ప్రారంభించడానికి \"ఖురాన్ చదవండి\", ఒక సూరాను తిరిగి కొనసాగించడానికి \"ఇటీవలి పఠనాలు\", లేదా నేరుగా శోధన, తజ్వీద్ నియమాలు, లేదా పఠన సెట్టింగ్‌లకు వెళ్లడానికి త్వరిత లింక్‌ను తట్టండి.';

  @override
  String get guideSurahNavTitle => 'సూరా స్క్రీన్';

  @override
  String get guideSurahNavCaption =>
      'పైన ఉన్న సూరా పేరు \"సూరాకు వెళ్లండి\"ను తెరుస్తుంది. సూరాల మధ్య వెళ్లడానికి మునుపటి/తదుపరి వరుసను ఉపయోగించండి, మరియు మొత్తం సూరా వినడానికి ప్లే చిహ్నాన్ని ఉపయోగించండి.';

  @override
  String get guideSurahListTitle => 'సూరాను ఎంచుకోవడం';

  @override
  String get guideSurahListCaption =>
      'ఖురాన్ ట్యాబ్‌లో మొత్తం 114 సూరాలు జాబితా చేయబడ్డాయి — స్క్రోల్ చేయండి లేదా పేరు ద్వారా కనుగొనడానికి శోధన చిహ్నాన్ని తట్టండి.';

  @override
  String get guideJumpToSurahTitle => 'సూరాకు వెళ్లండి';

  @override
  String get guideJumpToSurahCaption =>
      'ఏదైనా సూరా మరియు ఆయత్‌కు నేరుగా వెళ్లడానికి ఏదైనా చక్రాన్ని తిప్పండి లేదా శోధించండి.';

  @override
  String get guideReadingAyahTitle => 'ఆయత్ చదవడం';

  @override
  String get guideReadingAyahCaption =>
      'ప్రతి ఆయత్‌కు దాని స్వంత ప్లే బటన్ మరియు బుక్‌మార్క్ నక్షత్రం ఉంటుంది. అరబిక్ టెక్స్ట్ కింద అనువాదం కనిపించడానికి పఠన సెట్టింగ్‌లలో అనువాదాన్ని ఆన్ చేయండి.';

  @override
  String get guideSettingsEntryTitle => 'సెట్టింగ్‌లను తెరవడం';

  @override
  String get guideSettingsEntryCaption =>
      'పఠన సెట్టింగ్‌లు దిగువ బార్‌లోని సెట్టింగ్‌ల ట్యాబ్ నుండి, లేదా చదువుతున్నప్పుడు ట్యూన్ చిహ్నం నుండి తెరుచుకుంటాయి — రెండూ ఒకే ప్యానెల్‌ను తెరుస్తాయి.';

  @override
  String get guideSettingsPanelTitle => 'పఠన సెట్టింగ్‌లు';

  @override
  String get guideSettingsPanelCaption =>
      'పఠన సెట్టింగ్‌ల ప్యానెల్‌లో థీమ్ మరియు అరబిక్ ఫాంట్ మొదటి రెండు విభాగాలు.';

  @override
  String get guideFontsTitle => 'అరబిక్ ఫాంట్';

  @override
  String get guideFontsCaption =>
      'పఠన సెట్టింగ్‌లలో అరబిక్ ఫాంట్ కింద మూడు అరబిక్ లిపుల మధ్య ఎంచుకోండి — ఖురాన్ టెక్స్ట్ వెంటనే అప్‌డేట్ అవుతుంది.';

  @override
  String get guideFontSizeTitle => 'పఠన పరిమాణం';

  @override
  String get guideFontSizeCaption =>
      'లిపిని పెద్దదిగా లేదా చిన్నదిగా చేయడానికి పఠన సెట్టింగ్‌లలోని \"అరబిక్ టెక్స్ట్ పరిమాణం\" స్లయిడర్‌ను లాగండి.';

  @override
  String get guideTranslationTitle => 'అనువాదం';

  @override
  String get guideTranslationCaption =>
      'పఠన సెట్టింగ్‌లలో అనువాదం కింద ఇంగ్లీష్ లేదా రోమన్ ఉర్దూను ఎంచుకోండి — లేదా అరబిక్ మాత్రమే చదవడానికి ఆఫ్‌ను ఎంచుకోండి.';

  @override
  String get guideBookmarksScreenTitle => 'బుక్‌మార్క్‌లు';

  @override
  String get guideBookmarksScreenCaption =>
      'మీరు నక్షత్రం పెట్టిన ప్రతి ఆయత్ ఇక్కడ సేవ్ చేయబడుతుంది — దానికి తిరిగి వెళ్లడానికి తట్టండి.';

  @override
  String get guideLastReadsTitle => 'ఇటీవలి పఠనాలు';

  @override
  String get guideLastReadsCaption =>
      'హోమ్ ఇటీవలి సూరాల యొక్క సంక్షిప్త చరిత్రను ఉంచుతుంది — మీరు ఆపిన చోటు నుండి కొనసాగించడానికి ఒకదాన్ని తట్టండి.';

  @override
  String get guideAudioTitle => 'ఆడియో';

  @override
  String get guideAudioCaption =>
      'ఒకే ఆయత్‌ను దాని స్వంత ప్లే చిహ్నంతో, లేదా మొత్తం సూరాను సూరా బార్‌లోని ప్లే చిహ్నంతో ప్లే చేయండి.';

  @override
  String get guideTajweedTitle => 'తజ్వీద్';

  @override
  String get guideTajweedCaption =>
      'పఠన సెట్టింగ్‌లలో తజ్వీద్ రంగులను ఆన్ చేయండి, తర్వాత ప్రతి రంగు అర్థం ఏమిటో చూడటానికి \"తజ్వీద్ నియమాలు\" తెరవండి.';

  @override
  String get guideThemeTitle => 'థీమ్';

  @override
  String get guideThemeCaption =>
      'పఠన సెట్టింగ్‌ల పైభాగంలో లైట్, డార్క్, మరియు సెపియా మధ్య మారండి.';

  @override
  String get guideUserGuideEntryTitle => 'ఈ గైడ్‌ను తిరిగి తెరవడం';

  @override
  String get guideUserGuideEntryCaption =>
      'పఠన సెట్టింగ్‌లలో \"యూజర్ గైడ్\" నుండి ఎప్పుడైనా ఈ వాక్‌త్రూకు తిరిగి రండి.';

  @override
  String get guideTestSurahNavTitle => 'పరీక్ష: సూరా నావిగేషన్';

  @override
  String get guideTestSurahNavCaption =>
      '1. ఏదైనా సూరాను తెరవండి.\n2. మరొక సూరాకు వెళ్లడానికి మునుపటి/తదుపరిని ఉపయోగించండి.\n3. అరబిక్ పేరు మరియు అనువాదం రెండూ అప్‌డేట్ అవుతున్నాయని నిర్ధారించుకోండి.';

  @override
  String get guideTestSearchJumpTitle => 'పరీక్ష: శోధన & సూరాకు దూకడం';

  @override
  String get guideTestSearchJumpCaption =>
      '1. ఖురాన్ ట్యాబ్ నుండి, శోధనను తట్టి ఒక పదాన్ని వెతకండి (ఉదా. \"దయ\").\n2. ఒక ఫలితాన్ని తెరిచి అది సరైన ఆయత్‌కు చేరుకుంటుందని నిర్ధారించుకోండి.\n3. రీడర్‌లో సూరా పేరును తట్టి, మరెక్కడికైనా వెళ్లడానికి సూరాకు వెళ్లండి ఉపయోగించండి.';

  @override
  String get guideTestFontsTitle => 'పరీక్ష: పఠనం & ఫాంట్‌లు';

  @override
  String get guideTestFontsCaption =>
      '1. ఒక సూరాను తెరిచి కొన్ని ఆయత్‌లను చదవండి.\n2. పఠన సెట్టింగ్‌లలో ప్రతి అరబిక్ ఫాంట్‌ను ప్రయత్నించండి.\n3. మూడింటిలో లిపి స్పష్టంగా ఉందని నిర్ధారించుకోండి.';

  @override
  String get guideTestFontSizeTitle => 'పరీక్ష: ఫాంట్ పరిమాణం';

  @override
  String get guideTestFontSizeCaption =>
      '1. పఠన సెట్టింగ్‌లను తెరవండి.\n2. అరబిక్ టెక్స్ట్ పరిమాణం స్లయిడర్‌ను దాని అతి చిన్న మరియు అతి పెద్ద చివరలకు లాగండి.\n3. పఠన స్క్రీన్ వెంటనే అప్‌డేట్ అవుతుందని నిర్ధారించుకోండి.';

  @override
  String get guideTestTranslationTitle => 'పరీక్ష: అనువాదం & రోమన్ ఉర్దూ';

  @override
  String get guideTestTranslationCaption =>
      '1. పఠన సెట్టింగ్‌లలో అనువాదాన్ని ఇంగ్లీష్‌కు సెట్ చేయండి — ఇది ప్రతి ఆయత్ కింద కనిపిస్తుందని నిర్ధారించుకోండి.\n2. రోమన్ ఉర్దూ (అబుల్ అలా మౌదూదీ)కు మారండి — ఇది ఇంగ్లీష్ లైన్‌ను భర్తీ చేస్తుందని నిర్ధారించుకోండి.\n3. దానిని తిరిగి ఆఫ్‌కు సెట్ చేయండి.';

  @override
  String get guideTestAudioTitle => 'పరీక్ష: ఆడియో';

  @override
  String get guideTestAudioCaption =>
      '1. ఒకే ఆయత్‌ను దాని ప్లే చిహ్నంతో ప్లే చేయండి — మీరు మళ్లీ తట్టినప్పుడు అది ఆగిపోతుందని నిర్ధారించుకోండి.\n2. సూరా బార్ యొక్క ప్లే చిహ్నం నుండి మొత్తం సూరాను ప్లే చేయండి.\n3. పఠన స్క్రీన్ వెంటనంటూ స్క్రోల్ అవుతుందని నిర్ధారించుకోండి.';

  @override
  String get guideTestBookmarksTitle => 'పరీక్ష: బుక్‌మార్క్‌లు';

  @override
  String get guideTestBookmarksCaption =>
      '1. ఏదైనా సూరాను తెరిచి ఒక ఆయత్‌ను కనుగొనండి.\n2. దాని బుక్‌మార్క్ నక్షత్రాన్ని తట్టండి.\n3. బుక్‌మార్క్‌లను తెరిచి ఆయత్ కనిపిస్తుందని నిర్ధారించుకోండి.\n4. బుక్‌మార్క్‌ను తీసివేసి అది మాయమవుతుందని నిర్ధారించుకోండి.';

  @override
  String get guideTestLastReadsTitle => 'పరీక్ష: ఇటీవలి పఠనాలు';

  @override
  String get guideTestLastReadsCaption =>
      '1. రెండు వేర్వేరు సూరాలలో కొంచెం చదివి, తర్వాత హోమ్‌కు తిరిగి వెళ్లండి.\n2. రెండూ ఇటీవలి పఠనాల కింద కనిపిస్తున్నాయని నిర్ధారించుకోండి.\n3. ఒకదాన్ని తట్టి అది సరైన ఆయత్ వద్ద కొనసాగుతుందని నిర్ధారించుకోండి.';

  @override
  String get guideTestTajweedTitle => 'పరీక్ష: తజ్వీద్';

  @override
  String get guideTestTajweedCaption =>
      '1. పఠన సెట్టింగ్‌లలో తజ్వీద్ రంగులను ఆన్ చేయండి.\n2. అరబిక్ టెక్స్ట్‌లో రంగుల అక్షరాలు కనిపిస్తున్నాయని నిర్ధారించుకోండి.\n3. తజ్వీద్ నియమాలను తెరిచి ప్రతి రంగు వివరించబడిందని నిర్ధారించుకోండి.';

  @override
  String get guideTestSettingsTitle => 'పరీక్ష: సెట్టింగ్‌లు';

  @override
  String get guideTestSettingsCaption =>
      '1. దిగువ బార్ నుండి పఠన సెట్టింగ్‌లను తెరవండి.\n2. చదువుతున్నప్పుడు ట్యూన్ చిహ్నం నుండి దాన్ని మళ్లీ తెరవండి.\n3. రెండూ ఒకే ప్యానెల్‌ను తెరుస్తున్నాయని, మరియు పూర్తయింది/క్రిందికి స్వైప్ చేయడం దాన్ని మూసివేస్తుందని నిర్ధారించుకోండి.';

  @override
  String get guideTestThemeTitle => 'పరీక్ష: థీమ్';

  @override
  String get guideTestThemeCaption =>
      '1. పఠన సెట్టింగ్‌లలో లైట్, డార్క్, మరియు సెపియా మధ్య మారండి.\n2. పఠన స్క్రీన్ మరియు దాని తజ్వీద్ రంగులు ప్రతి దానిలో స్పష్టంగా ఉన్నాయని నిర్ధారించుకోండి.';

  @override
  String get guideTestClosingReopeningTitle =>
      'పరీక్ష: యాప్‌ను మూసివేయడం & మళ్లీ తెరవడం';

  @override
  String get guideTestClosingReopeningCaption =>
      '1. ఒక థీమ్, అనువాదం, మరియు ఒక బుక్‌మార్క్‌ను సెట్ చేసి, తర్వాత ఇక్రాస్పేస్‌ను పూర్తిగా మూసివేయండి.\n2. దాన్ని మళ్లీ తెరిచి మీ థీమ్, అనువాదం, మరియు బుక్‌మార్క్ ఇంకా ఉన్నాయని నిర్ధారించుకోండి.';

  @override
  String get aboutTitle => 'ఇక్రాస్పేస్ గురించి';

  @override
  String get aboutTagline => 'చదవండి. ఆలోచించండి. అనుసంధానం చేయండి.';

  @override
  String get aboutIntro =>
      'ఇక్రాస్పేస్ అనేది ఖురాన్‌తో చదవడం మరియు అనుసంధానం చేయడాన్ని సరళంగా, అందంగా, మరియు అందుబాటులో ఉండేలా రూపొందించిన ఒక డిజిటల్ ఖురాన్ స్థలం.';

  @override
  String get aboutMissionHeading => 'మా లక్ష్యం';

  @override
  String get aboutMissionBody =>
      'ప్రతి ఒక్కరికీ ప్రశాంతమైన, ఉపయోగించడానికి సులభమైన ఖురాన్ అనుభవాన్ని సృష్టించడం మా లక్ష్యం. మేము సరళత, అందుబాటు, ఆలోచనాత్మక డిజైన్, మరియు అర్థవంతమైన రోజువారీ ఖురాన్ పఠనానికి తోడ్పడే ఫీచర్‌లపై దృష్టి పెడతాము.';

  @override
  String get aboutVisionHeading => 'మా దృష్టి';

  @override
  String get aboutVisionBody =>
      'మేము ఇక్రాస్పేస్‌ను ఖురాన్ నిమగ్నతకు నమ్మకమైన డిజిటల్ స్థలంగా ఊహిస్తాము — భవిష్యత్తులో పఠనం, ఆలోచన, అవగాహన, మరియు అర్థవంతమైన అభ్యాస అనుభవాలను ఒకచోట చేర్చడం.';

  @override
  String get aboutValuesHeading => 'మా విలువలు';

  @override
  String get aboutValueSimplicityTitle => 'సరళత';

  @override
  String get aboutValueSimplicityDesc =>
      'ఖురాన్‌పై దృష్టిని కేంద్రీకరించే స్వచ్ఛమైన, కేంద్రీకృత అనుభవం.';

  @override
  String get aboutValueAccessibilityTitle => 'అందుబాటు';

  @override
  String get aboutValueAccessibilityDesc =>
      'పరికరాలు మరియు స్క్రీన్ పరిమాణాలలో సౌకర్యవంతమైన పఠన అనుభవం.';

  @override
  String get aboutValueRespectTitle => 'గౌరవం';

  @override
  String get aboutValueRespectDesc =>
      'ప్రతి ఫీచర్ మరియు డిజైన్ నిర్ణయం ఖురాన్ మరియు దాని ప్రాముఖ్యత పట్ల గౌరవంతో తీసుకోబడుతుంది.';

  @override
  String get aboutValueContinuousTitle => 'నిరంతర మెరుగుదల';

  @override
  String get aboutValueContinuousDesc =>
      'మేము మా వినియోగదారులకు మెరుగ్గా సేవ చేయడానికి నిరంతరం నేర్చుకుంటూ మెరుగుపరుస్తాము.';

  @override
  String get aboutAuthenticHeading => 'ప్రామాణిక ఖురానిక్ కంటెంట్';

  @override
  String get aboutAuthenticBody1 =>
      'ఖచ్చితత్వం మరియు ప్రామాణికత మా అత్యున్నత ప్రాధాన్యతలు. ఇక్రాస్పేస్‌లోని ఖురానిక్ వచనం విశ్వసనీయమైన మరియు ప్రామాణికమైన ఖురాన్ మూలం నుండి పొందబడింది. మేము అసలు అరబిక్ ఖురానిక్ వచనాన్ని మార్చము, తిరిగి రాయము, లేదా సవరించము.';

  @override
  String get aboutAuthenticBody2 =>
      'ఫాంట్‌లు, ప్రదర్శన సెట్టింగ్‌లు, బుక్‌మార్క్‌లు, అనువాదాలు, మరియు ఇతర ఫీచర్‌లు ఖురానిక్ వచనం యొక్క సమగ్రతను కాపాడుతూ పఠన అనుభవాన్ని మెరుగుపరచడానికి రూపొందించబడ్డాయి. అనువాదాలు మరియు తోడ్పాటు కంటెంట్ అసలు అరబిక్ వచనం నుండి వేరుగా ఉంచబడతాయి.';

  @override
  String get aboutBuiltForHeading => 'ఖురాన్ పాఠకుల కోసం రూపొందించబడింది';

  @override
  String get aboutBuiltForBody =>
      'ఇక్రాస్పేస్ అనుకూలీకరించదగిన ఫాంట్‌లు, పఠన ప్రాధాన్యతలు, బుక్‌మార్క్‌లు, అనువాదాలు, మరియు తజ్వీద్ మద్దతుతో ఒక కేంద్రీకృత ఖురాన్ పఠన అనుభవాన్ని అందిస్తుంది.';

  @override
  String get aboutLookingAheadHeading => 'ముందుకు చూస్తూ';

  @override
  String get aboutLookingAheadBody =>
      'మా ప్రస్తుత దృష్టి ఒక అద్భుతమైన ఖురాన్ రీడర్‌ను నిర్మించడంపై ఉంది. భవిష్యత్తులో, ఖురాన్‌ను ఇక్రాస్పేస్ యొక్క గుండెలో ఉంచుతూ ఆలోచనాత్మకంగా రూపొందించిన అభ్యాస అనుభవాలను ప్రవేశపెట్టాలని మేము ఆశిస్తున్నాము.';

  @override
  String get aboutCommitmentHeading => 'మా నిబద్ధత';

  @override
  String get aboutCommitmentBody1 =>
      'ఇక్రాస్పేస్‌ను శ్రద్ధ, సరళత, మరియు ఉద్దేశ్యంతో నిర్మించడానికి మేము కట్టుబడి ఉన్నాము.';

  @override
  String get aboutCommitmentBody2 =>
      'మా లక్ష్యం సరళమైనది: ఖురాన్‌ను చదవడం, దానిపై ఆలోచించడం, మరియు దానితో అనుసంధానం చేయడం సులభతరం చేయడం.';

  @override
  String get aboutContactHeading => 'మమ్మల్ని సంప్రదించండి';

  @override
  String get aboutContactBody =>
      'ప్రశ్నలు లేదా అభిప్రాయాల కోసం, మమ్మల్ని ఇక్కడ సంప్రదించండి:';

  @override
  String get aboutReachUsHeading => 'మమ్మల్ని చేరుకోండి';

  @override
  String get aboutReachX => 'X';

  @override
  String get aboutReachInstagram => 'ఇన్‌స్టాగ్రామ్';

  @override
  String get aboutReachWebsite => 'వెబ్‌సైట్';

  @override
  String aboutCouldNotOpen(Object label) {
    return '$label తెరవలేకపోయాము.';
  }
}
