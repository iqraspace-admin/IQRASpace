// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Urdu (`ur`).
class AppLocalizationsUr extends AppLocalizations {
  AppLocalizationsUr([String locale = 'ur']) : super(locale);

  @override
  String get navHome => 'ہوم';

  @override
  String get navQuran => 'قرآن';

  @override
  String get navLearn => 'سیکھیں';

  @override
  String get navBookmarks => 'بک مارکس';

  @override
  String get navSettings => 'ترتیبات';

  @override
  String get homeTagline => 'پڑھیں۔ سنیں۔ سیکھیں۔ غور کریں۔';

  @override
  String get homeReadQuranTitle => 'قرآن پڑھیں';

  @override
  String get homeReadQuranSubtitle => '114 سورتیں، تجوید اور ترجمہ';

  @override
  String get homeLearningTitle => 'تعلیم';

  @override
  String get homeLearningSubtitle => 'کورسز اور رہنما اسباق';

  @override
  String get homeLastReads => 'حالیہ پڑھائی';

  @override
  String homeAyahOfTotal(Object current, Object total) {
    return 'آیت $current از $total';
  }

  @override
  String get homeQuickLinks => 'فوری روابط';

  @override
  String get homeSearch => 'تلاش';

  @override
  String get homeTajweedRules => 'تجوید کے قواعد';

  @override
  String get homeReaderSettings => 'ریڈر کی ترتیبات';

  @override
  String get homeBookmarks => 'بک مارکس';

  @override
  String get homeSeeAll => 'سب دیکھیں';

  @override
  String get homeNoBookmarksYet =>
      'ابھی تک کوئی بک مارک نہیں — پڑھتے وقت آیت محفوظ کرنے کے لیے ستارے کے آئیکن پر تھپتھپائیں۔';

  @override
  String get homeContinueReading => 'پڑھنا جاری رکھیں';

  @override
  String homeBeginWithSurah(Object surahName) {
    return '$surahName سے شروع کریں';
  }

  @override
  String homeAyahCount(Object ayah) {
    return 'آیت $ayah';
  }

  @override
  String get bookmarksTitle => 'بک مارکس';

  @override
  String get bookmarksEmpty => 'ابھی تک کوئی بک مارک نہیں۔';

  @override
  String get searchHint => 'ترجمہ تلاش کریں (مثلاً رحمت، صبر)…';

  @override
  String get searchPrompt => 'لفظ لکھیں اور تلاش دبائیں۔';

  @override
  String get searchNoMatches => 'کوئی نتیجہ نہیں ملا۔';

  @override
  String searchFailed(Object error) {
    return 'تلاش ناکام ہوئی۔\n$error';
  }

  @override
  String get learnTitle => 'سیکھیں';

  @override
  String get learnHeading => 'اقرا اسپیس تعلیم';

  @override
  String get learnBody =>
      'کورسز اور رہنما اسباق ایک آئندہ اپڈیٹ میں آئیں گے۔ فی الحال، قرآن ریڈر میں مطالعہ جاری رکھیں۔';

  @override
  String get quranTitle => 'قرآن';

  @override
  String get commonRetry => 'دوبارہ کوشش کریں';

  @override
  String get commonDone => 'مکمل';

  @override
  String commonAyahsCount(Object count) {
    return '$count آیات';
  }

  @override
  String get commonCouldNotReachReader =>
      'قرآن ریڈر تک رسائی نہیں ہو سکی۔\nاپنا کنکشن چیک کریں اور دوبارہ کوشش کریں۔';

  @override
  String get readerStop => 'روکیں';

  @override
  String get readerPlayWholeSurah => 'پوری سورت چلائیں';

  @override
  String get readerLoadingAudio => 'آڈیو لوڈ ہو رہی ہے…';

  @override
  String get readerReadingSettings => 'پڑھنے کی ترتیبات';

  @override
  String get readerMore => 'مزید';

  @override
  String get readerStopAutoScroll => 'خودکار اسکرول روکیں';

  @override
  String get readerStartAutoScroll => 'خودکار اسکرول شروع کریں';

  @override
  String get readerExitReadMode => 'ریڈ موڈ سے باہر نکلیں';

  @override
  String get readerReadModeArabicOnly => 'ریڈ موڈ (صرف عربی)';

  @override
  String get readerFirstSurah => 'پہلی سورت';

  @override
  String get readerLastSurah => 'آخری سورت';

  @override
  String get readerPause => 'وقفہ';

  @override
  String get readerPlayRecitation => 'تلاوت چلائیں';

  @override
  String get readerRemoveBookmark => 'بک مارک ہٹائیں';

  @override
  String get readerAddBookmark => 'بک مارک شامل کریں';

  @override
  String get modeListening => 'سننا';

  @override
  String get modeReading => 'پڑھنا';

  @override
  String get modeReadingListening => 'پڑھنا + سننا';

  @override
  String get listeningTrackArabicOnly => 'صرف تلاوت';

  @override
  String get listeningTrackArabicPlusUrdu => 'تلاوت + اردو ترجمہ';

  @override
  String get listeningTrackComingSoon =>
      'اس سورت کے لیے اردو ترجمہ آڈیو جلد آ رہی ہے۔';

  @override
  String get playbackPlay => 'چلائیں';

  @override
  String get playbackPause => 'وقفہ';

  @override
  String get playbackPreviousSurah => 'پچھلی سورت';

  @override
  String get playbackNextSurah => 'اگلی سورت';

  @override
  String get jumpToSura => 'سورت';

  @override
  String get jumpToAyah => 'آیت';

  @override
  String get jumpToSurahSearchHint => 'Aa..';

  @override
  String get jumpToAyahSearchHint => '1, 2..';

  @override
  String jumpToCouldNotLoad(Object error) {
    return 'سورتوں کی فہرست لوڈ نہیں ہو سکی۔\n$error';
  }

  @override
  String get tajweedRulesScreenTitle => 'تجوید کے قواعد';

  @override
  String get settingsClose => 'بند کریں';

  @override
  String get settingsReadingSettings => 'پڑھنے کی ترتیبات';

  @override
  String get settingsTheme => 'تھیم';

  @override
  String get settingsLight => 'روشن';

  @override
  String get settingsDark => 'تاریک';

  @override
  String get settingsSepia => 'سیپیا';

  @override
  String get settingsArabicFont => 'عربی فونٹ';

  @override
  String get settingsArabicTextSize => 'عربی متن کا حجم';

  @override
  String get settingsTranslation => 'ترجمہ';

  @override
  String get settingsLanguage => 'زبان';

  @override
  String get settingsTajweed => 'تجوید';

  @override
  String get settingsTajweedColoring => 'تجوید رنگت';

  @override
  String get settingsTajweedColoringDesc =>
      'عربی متن میں تلاوت کے قواعد کو نمایاں کرتا ہے۔';

  @override
  String get settingsTajweedRules => 'تجوید کے قواعد';

  @override
  String get settingsTajweedRulesDesc => 'ہر رنگ کا کیا مطلب ہے';

  @override
  String get settingsReciter => 'قاری';

  @override
  String get settingsReciterModeNote =>
      'یہ صرف ریڈنگ + لسننگ موڈ پر لاگو ہوتا ہے۔ لسننگ موڈ ہمیشہ بلٹ اِن الافاسی تلاوت استعمال کرتا ہے۔';

  @override
  String get settingsAudioCache => 'ڈاؤن لوڈ شدہ آڈیو کیشے';

  @override
  String get settingsClearAudioCache => 'صاف کریں';

  @override
  String get settingsAudioRecitation => 'Audio & Recitation';

  @override
  String get settingsReading => 'مطالعہ';

  @override
  String get settingsReadingExperience => 'Reading Experience';

  @override
  String get settingsReadMode => 'ریڈ موڈ';

  @override
  String get settingsReadModeDesc =>
      'صرف عربی متن — بک مارک، آڈیو، اور ترجمہ کے کنٹرولز چھپا دیتا ہے۔';

  @override
  String get settingsShowBookmarkIcons => 'بک مارک آئیکن دکھائیں';

  @override
  String get settingsAutoScrollSpeed => 'خودکار اسکرول کی رفتار';

  @override
  String get settingsUserGuide => 'یوزر گائیڈ';

  @override
  String get settingsUserGuideDesc => 'ہر خصوصیت کا تصویری جائزہ';

  @override
  String get settingsAboutIqraSpace => 'اقرا اسپیس کے بارے میں';

  @override
  String get settingsAboutIqraSpaceDesc => 'ہمارا مشن، وژن، اور اقدار';

  @override
  String get settingsAttribution =>
      'متن، تجوید، ترجمہ، اور آڈیو: Al Quran Cloud (alquran.cloud)۔ رومن اردو ترجمہ: Quran.com۔ فونٹس: Amiri فیملی (SIL OFL 1.1)۔';

  @override
  String get translationLangOff => 'بند';

  @override
  String get translationLangEnglish => 'انگریزی (صحیح انٹرنیشنل)';

  @override
  String get translationLangRomanUrdu => 'رومن اردو (ابوالاعلیٰ مودودی)';

  @override
  String get arabicFontAmiriQuran => 'امیری قرآن (عثمانی)';

  @override
  String get arabicFontAmiri => 'امیری (عام مقصد)';

  @override
  String get arabicFontAmiriQuranColored => 'امیری قرآن رنگین';

  @override
  String get arabicFontColoredCaveat =>
      'اس کے اپنے بلٹ اِن رنگ ہیں — اس ایپ کی تجوید رنگت اس کے اوپر نظر نہیں آئے گی۔';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageTelugu => 'తెలుగు';

  @override
  String get languageUrdu => 'اردو';

  @override
  String get tajweedRuleGhnName => 'غنہ';

  @override
  String get tajweedRuleGhnDesc =>
      'زبر والے م یا ن پر تقریباً دو شمار کی ناک سے آنے والی آواز۔';

  @override
  String get tajweedRuleIkhfName => 'اخفا (چھپانا)';

  @override
  String get tajweedRuleIkhfDesc =>
      'بعض حروف سے پہلے ساکن ن یا تنوین چھپا دی جاتی ہے — پوری طرح ظاہر کرنے کے بجائے ہلکی ناک کی آواز کے ساتھ ادا کی جاتی ہے۔';

  @override
  String get tajweedRuleIkhfShfwName => 'اخفائے شفوی (لبی اخفا)';

  @override
  String get tajweedRuleIkhfShfwDesc =>
      'ب سے پہلے ساکن م ہلکی ناک کی آواز کے ساتھ چھپایا جاتا ہے۔';

  @override
  String get tajweedRuleIqlbName => 'اقلاب (تبدیلی)';

  @override
  String get tajweedRuleIqlbDesc =>
      'ساکن ن یا تنوین کے بعد ب آئے تو اسے م کی آواز میں بدل دیا جاتا ہے۔';

  @override
  String get tajweedRuleIdghGhnName => 'ادغام مع الغنہ';

  @override
  String get tajweedRuleIdghGhnDesc =>
      'ساکن ن یا تنوین کے بعد ي ن م و آئے تو اگلے حرف میں غنہ کے ساتھ مل جاتا ہے۔';

  @override
  String get tajweedRuleIdghWGhnName => 'ادغام بلا غنہ';

  @override
  String get tajweedRuleIdghWGhnDesc =>
      'ساکن ن یا تنوین کے بعد ل یا ر آئے تو بغیر غنہ کے اگلے حرف میں مل جاتا ہے۔';

  @override
  String get tajweedRuleIdghmShfwName => 'ادغام شفوی (لبی ادغام)';

  @override
  String get tajweedRuleIdghmShfwDesc =>
      'ساکن م کے بعد دوسرا م آئے تو ناک کی آواز کے ساتھ آپس میں مل جاتے ہیں۔';

  @override
  String get tajweedRuleIdghMusName => 'ادغام متجانسین / متقاربین';

  @override
  String get tajweedRuleIdghMusDesc =>
      'دو ملتے جلتے یا قریبی مخرج والے حروف ایک میں مل جاتے ہیں۔';

  @override
  String get tajweedRuleQlqName => 'قلقلہ (گونج)';

  @override
  String get tajweedRuleQlqDesc =>
      'ساکن ق ط ب ج د کو ہلکی گونج دار، اچھلتی ہوئی آواز کے ساتھ ادا کیا جاتا ہے۔';

  @override
  String get tajweedRuleMaddaNormalName => 'مدِ طبیعی';

  @override
  String get tajweedRuleMaddaNormalDesc =>
      'ایک حرکت کو معیاری دو شمار تک کھینچا جاتا ہے — کوئی اضافی کھنچاؤ نہیں۔';

  @override
  String get tajweedRuleMaddaPermissibleName => 'مدِ جائز';

  @override
  String get tajweedRuleMaddaPermissibleDesc =>
      'قاری کی مرضی سے 2، 4، یا 5 شمار تک کھینچی جا سکنے والی حرکت۔';

  @override
  String get tajweedRuleMaddaNecessaryName => 'مدِ لازم';

  @override
  String get tajweedRuleMaddaNecessaryDesc =>
      'ایسی حرکت جسے پورے 6 شمار تک کھینچنا ضروری ہے۔';

  @override
  String get tajweedRuleMaddaObligatoryName => 'مدِ واجب';

  @override
  String get tajweedRuleMaddaObligatoryDesc =>
      'ایک ہی لفظ میں ہمزہ کے بعد آنے والی حرکت، 4 سے 5 شمار تک کھینچی جاتی ہے۔';

  @override
  String get tajweedRuleHamWaslName => 'ہمزۃ الوصل (ملانے والا ہمزہ)';

  @override
  String get tajweedRuleHamWaslDesc =>
      'حرکت سے پہلے ہو تو تلفظ میں گرا دیا جاتا ہے — صرف یہاں سے تلاوت شروع کرنے پر بولا جاتا ہے۔';

  @override
  String get tajweedRuleSlntName => 'خاموش حرف';

  @override
  String get tajweedRuleSlntDesc =>
      'ایک لکھا ہوا حرف جس کا تلفظ نہیں کیا جاتا۔';

  @override
  String get guideTitle => 'یوزر گائیڈ';

  @override
  String get guideSkip => 'نظرانداز کریں';

  @override
  String get guideHelpUsTest => 'اقرا اسپیس کی جانچ میں ہماری مدد کریں';

  @override
  String get guideScreenshotUnavailable => 'اسکرین شاٹ ابھی دستیاب نہیں';

  @override
  String get guideBack => 'پیچھے';

  @override
  String get guideNext => 'اگلا';

  @override
  String get guideHomeTitle => 'ہوم';

  @override
  String get guideHomeCaption =>
      'پڑھنا شروع کرنے کے لیے \"قرآن پڑھیں\"، کسی سورت کو دوبارہ شروع کرنے کے لیے \"حالیہ پڑھائی\"، یا براہِ راست تلاش، تجوید کے قواعد، یا پڑھنے کی ترتیبات پر جانے کے لیے کسی فوری ربط پر تھپتھپائیں۔';

  @override
  String get guideSurahNavTitle => 'سورت والی اسکرین';

  @override
  String get guideSurahNavCaption =>
      'اوپر سورت کا نام \"سورت پر جائیں\" کھولتا ہے۔ ایک سورت سے دوسری پر جانے کے لیے پچھلی/اگلی قطار استعمال کریں، اور پوری سورت سننے کے لیے پلے آئیکن استعمال کریں۔';

  @override
  String get guideSurahListTitle => 'سورت کا انتخاب';

  @override
  String get guideSurahListCaption =>
      'قرآن ٹیب میں تمام 114 سورتیں درج ہیں — اسکرول کریں یا نام سے تلاش کرنے کے لیے تلاش کے آئیکن پر تھپتھپائیں۔';

  @override
  String get guideJumpToSurahTitle => 'سورت پر جائیں';

  @override
  String get guideJumpToSurahCaption =>
      'کسی بھی سورت اور آیت پر براہِ راست جانے کے لیے کسی بھی پہیے کو گھمائیں یا تلاش کریں۔';

  @override
  String get guideReadingAyahTitle => 'آیت پڑھنا';

  @override
  String get guideReadingAyahCaption =>
      'ہر آیت کا اپنا پلے بٹن اور بک مارک ستارہ ہوتا ہے۔ عربی متن کے نیچے ترجمہ دیکھنے کے لیے پڑھنے کی ترتیبات میں ترجمہ آن کریں۔';

  @override
  String get guideSettingsEntryTitle => 'ترتیبات کھولنا';

  @override
  String get guideSettingsEntryCaption =>
      'پڑھنے کی ترتیبات نچلی پٹی میں ترتیبات کے ٹیب سے، یا پڑھتے وقت ٹیون آئیکن سے کھلتی ہیں — دونوں ایک ہی پینل کھولتے ہیں۔';

  @override
  String get guideSettingsPanelTitle => 'پڑھنے کی ترتیبات';

  @override
  String get guideSettingsPanelCaption =>
      'تھیم اور عربی فونٹ پڑھنے کی ترتیبات کے پینل کے پہلے دو حصے ہیں۔';

  @override
  String get guideFontsTitle => 'عربی فونٹ';

  @override
  String get guideFontsCaption =>
      'پڑھنے کی ترتیبات میں عربی فونٹ کے تحت تین عربی رسم الخط میں سے انتخاب کریں — قرآن کا متن فوراً اپڈیٹ ہو جاتا ہے۔';

  @override
  String get guideFontSizeTitle => 'پڑھنے کا حجم';

  @override
  String get guideFontSizeCaption =>
      'رسم الخط کو بڑا یا چھوٹا کرنے کے لیے پڑھنے کی ترتیبات میں \"عربی متن کا حجم\" سلائیڈر کھینچیں۔';

  @override
  String get guideTranslationTitle => 'ترجمہ';

  @override
  String get guideTranslationCaption =>
      'پڑھنے کی ترتیبات میں ترجمہ کے تحت انگریزی یا رومن اردو منتخب کریں — یا صرف عربی پڑھنے کے لیے بند منتخب کریں۔';

  @override
  String get guideBookmarksScreenTitle => 'بک مارکس';

  @override
  String get guideBookmarksScreenCaption =>
      'جس آیت کو آپ ستارہ دیں وہ یہاں محفوظ ہو جاتی ہے — اس پر واپس جانے کے لیے تھپتھپائیں۔';

  @override
  String get guideLastReadsTitle => 'حالیہ پڑھائی';

  @override
  String get guideLastReadsCaption =>
      'ہوم حالیہ سورتوں کی مختصر تاریخ رکھتا ہے — جہاں چھوڑا تھا وہیں سے جاری رکھنے کے لیے کسی ایک پر تھپتھپائیں۔';

  @override
  String get guideAudioTitle => 'آڈیو';

  @override
  String get guideAudioCaption =>
      'کسی ایک آیت کو اس کے اپنے پلے آئیکن سے، یا پوری سورت کو سورت کی پٹی کے پلے آئیکن سے چلائیں۔';

  @override
  String get guideTajweedTitle => 'تجوید';

  @override
  String get guideTajweedCaption =>
      'پڑھنے کی ترتیبات میں تجوید رنگت آن کریں، پھر ہر رنگ کا مطلب دیکھنے کے لیے \"تجوید کے قواعد\" کھولیں۔';

  @override
  String get guideThemeTitle => 'تھیم';

  @override
  String get guideThemeCaption =>
      'پڑھنے کی ترتیبات کے اوپر روشن، تاریک، اور سیپیا کے درمیان تبدیل کریں۔';

  @override
  String get guideUserGuideEntryTitle => 'یہ گائیڈ دوبارہ کھولنا';

  @override
  String get guideUserGuideEntryCaption =>
      'کسی بھی وقت پڑھنے کی ترتیبات میں \"یوزر گائیڈ\" سے اس واک تھرو پر واپس آئیں۔';

  @override
  String get guideTestSurahNavTitle => 'جانچ: سورت نیویگیشن';

  @override
  String get guideTestSurahNavCaption =>
      '1۔ کوئی بھی سورت کھولیں۔\n2۔ دوسری سورت پر جانے کے لیے پچھلی/اگلی استعمال کریں۔\n3۔ تصدیق کریں کہ عربی نام اور ترجمہ دونوں اپڈیٹ ہوتے ہیں۔';

  @override
  String get guideTestSearchJumpTitle => 'جانچ: تلاش اور سورت پر جانا';

  @override
  String get guideTestSearchJumpCaption =>
      '1۔ قرآن ٹیب سے تلاش پر تھپتھپائیں اور کوئی لفظ تلاش کریں (مثلاً \"رحمت\")۔\n2۔ کوئی نتیجہ کھولیں اور تصدیق کریں کہ یہ درست آیت پر پہنچتا ہے۔\n3۔ ریڈر میں سورت کے نام پر تھپتھپائیں اور کہیں اور جانے کے لیے \"سورت پر جائیں\" استعمال کریں۔';

  @override
  String get guideTestFontsTitle => 'جانچ: پڑھائی اور فونٹس';

  @override
  String get guideTestFontsCaption =>
      '1۔ کوئی سورت کھولیں اور چند آیات پڑھیں۔\n2۔ پڑھنے کی ترتیبات میں ہر عربی فونٹ آزمائیں۔\n3۔ تصدیق کریں کہ رسم الخط تینوں میں واضح رہتا ہے۔';

  @override
  String get guideTestFontSizeTitle => 'جانچ: فونٹ کا حجم';

  @override
  String get guideTestFontSizeCaption =>
      '1۔ پڑھنے کی ترتیبات کھولیں۔\n2۔ عربی متن کے حجم کے سلائیڈر کو سب سے چھوٹے اور سب سے بڑے سرے تک کھینچیں۔\n3۔ تصدیق کریں کہ پڑھنے کی اسکرین فوراً اپڈیٹ ہوتی ہے۔';

  @override
  String get guideTestTranslationTitle => 'جانچ: ترجمہ اور رومن اردو';

  @override
  String get guideTestTranslationCaption =>
      '1۔ پڑھنے کی ترتیبات میں ترجمہ کو انگریزی پر سیٹ کریں — تصدیق کریں کہ یہ ہر آیت کے نیچے ظاہر ہوتا ہے۔\n2۔ رومن اردو (ابوالاعلیٰ مودودی) پر تبدیل کریں — تصدیق کریں کہ یہ انگریزی سطر کی جگہ لے لیتا ہے۔\n3۔ اسے دوبارہ بند پر سیٹ کریں۔';

  @override
  String get guideTestAudioTitle => 'جانچ: آڈیو';

  @override
  String get guideTestAudioCaption =>
      '1۔ کسی ایک آیت کو اس کے پلے آئیکن سے چلائیں — تصدیق کریں کہ دوبارہ تھپتھپانے پر رک جاتی ہے۔\n2۔ سورت کی پٹی کے پلے آئیکن سے پوری سورت چلائیں۔\n3۔ تصدیق کریں کہ پڑھنے کی اسکرین ساتھ ساتھ اسکرول ہوتی ہے۔';

  @override
  String get guideTestBookmarksTitle => 'جانچ: بک مارکس';

  @override
  String get guideTestBookmarksCaption =>
      '1۔ کوئی سورت کھولیں اور ایک آیت تلاش کریں۔\n2۔ اس کے بک مارک ستارے پر تھپتھپائیں۔\n3۔ بک مارکس کھولیں اور تصدیق کریں کہ آیت ظاہر ہوتی ہے۔\n4۔ بک مارک ہٹائیں اور تصدیق کریں کہ یہ غائب ہو جاتی ہے۔';

  @override
  String get guideTestLastReadsTitle => 'جانچ: حالیہ پڑھائی';

  @override
  String get guideTestLastReadsCaption =>
      '1۔ دو مختلف سورتوں میں تھوڑا پڑھیں، پھر ہوم پر واپس جائیں۔\n2۔ تصدیق کریں کہ دونوں حالیہ پڑھائی کے تحت ظاہر ہوتی ہیں۔\n3۔ کسی ایک پر تھپتھپائیں اور تصدیق کریں کہ یہ درست آیت سے دوبارہ شروع ہوتی ہے۔';

  @override
  String get guideTestTajweedTitle => 'جانچ: تجوید';

  @override
  String get guideTestTajweedCaption =>
      '1۔ پڑھنے کی ترتیبات میں تجوید رنگت آن کریں۔\n2۔ تصدیق کریں کہ عربی متن میں رنگین حروف ظاہر ہوتے ہیں۔\n3۔ تجوید کے قواعد کھولیں اور تصدیق کریں کہ ہر رنگ کی وضاحت موجود ہے۔';

  @override
  String get guideTestSettingsTitle => 'جانچ: ترتیبات';

  @override
  String get guideTestSettingsCaption =>
      '1۔ نچلی پٹی سے پڑھنے کی ترتیبات کھولیں۔\n2۔ پڑھتے وقت ٹیون آئیکن سے اسے دوبارہ کھولیں۔\n3۔ تصدیق کریں کہ دونوں ایک ہی پینل کھولتے ہیں، اور مکمل/نیچے سوائپ کرنے سے یہ بند ہو جاتا ہے۔';

  @override
  String get guideTestThemeTitle => 'جانچ: تھیم';

  @override
  String get guideTestThemeCaption =>
      '1۔ پڑھنے کی ترتیبات میں روشن، تاریک، اور سیپیا کے درمیان تبدیل کریں۔\n2۔ تصدیق کریں کہ پڑھنے کی اسکرین اور اس کے تجوید رنگ ہر ایک میں واضح رہتے ہیں۔';

  @override
  String get guideTestClosingReopeningTitle =>
      'جانچ: ایپ بند اور دوبارہ کھولنا';

  @override
  String get guideTestClosingReopeningCaption =>
      '1۔ ایک تھیم، ترجمہ، اور ایک بک مارک سیٹ کریں، پھر اقرا اسپیس مکمل طور پر بند کریں۔\n2۔ اسے دوبارہ کھولیں اور تصدیق کریں کہ آپ کا تھیم، ترجمہ، اور بک مارک اب بھی موجود ہیں۔';

  @override
  String get aboutTitle => 'اقرا اسپیس کے بارے میں';

  @override
  String get aboutTagline => 'پڑھیں۔ غور کریں۔ جڑیں۔';

  @override
  String get aboutIntro =>
      'اقرا اسپیس ایک ڈیجیٹل قرآن اسپیس ہے جو قرآن کے ساتھ پڑھنے اور جڑنے کو آسان، خوبصورت، اور قابلِ رسائی بنانے کے لیے ڈیزائن کی گئی ہے۔';

  @override
  String get aboutMissionHeading => 'ہمارا مشن';

  @override
  String get aboutMissionBody =>
      'ہمارا مشن ہر کسی کے لیے ایک پرسکون، استعمال میں آسان قرآن کا تجربہ تخلیق کرنا ہے۔ ہم سادگی، رسائی، سوچی سمجھی ڈیزائن، اور روزانہ کی بامعنی قرآن خوانی کی حمایت کرنے والی خصوصیات پر توجہ دیتے ہیں۔';

  @override
  String get aboutVisionHeading => 'ہمارا وژن';

  @override
  String get aboutVisionBody =>
      'ہم اقرا اسپیس کو قرآن کے ساتھ وابستگی کے لیے ایک قابلِ اعتماد ڈیجیٹل مقام کے طور پر تصور کرتے ہیں — جو مستقبل میں پڑھائی، غور و فکر، فہم، اور بامعنی تعلیمی تجربات کو یکجا کرتا ہے۔';

  @override
  String get aboutValuesHeading => 'ہماری اقدار';

  @override
  String get aboutValueSimplicityTitle => 'سادگی';

  @override
  String get aboutValueSimplicityDesc =>
      'ایک صاف، مرکوز تجربہ جو توجہ قرآن پر مرکوز رکھتا ہے۔';

  @override
  String get aboutValueAccessibilityTitle => 'رسائی';

  @override
  String get aboutValueAccessibilityDesc =>
      'مختلف آلات اور اسکرین سائز پر ایک آرام دہ پڑھنے کا تجربہ۔';

  @override
  String get aboutValueRespectTitle => 'احترام';

  @override
  String get aboutValueRespectDesc =>
      'ہر خصوصیت اور ڈیزائن کا فیصلہ قرآن اور اس کی اہمیت کے احترام کے ساتھ کیا جاتا ہے۔';

  @override
  String get aboutValueContinuousTitle => 'مسلسل بہتری';

  @override
  String get aboutValueContinuousDesc =>
      'ہم اپنے صارفین کی بہتر خدمت کے لیے مسلسل سیکھتے اور بہتری لاتے رہتے ہیں۔';

  @override
  String get aboutAuthenticHeading => 'مستند قرآنی مواد';

  @override
  String get aboutAuthenticBody1 =>
      'درستگی اور صداقت ہماری اولین ترجیحات ہیں۔ اقرا اسپیس میں قرآنی متن ایک قابلِ اعتماد اور مستند قرآن ماخذ سے حاصل کیا گیا ہے۔ ہم اصل عربی قرآنی متن کو تبدیل، دوبارہ تحریر، یا ترمیم نہیں کرتے۔';

  @override
  String get aboutAuthenticBody2 =>
      'فونٹس، ڈسپلے کی ترتیبات، بک مارکس، تراجم، اور دیگر خصوصیات قرآنی متن کی سالمیت کو برقرار رکھتے ہوئے پڑھنے کے تجربے کو بہتر بنانے کے لیے ڈیزائن کی گئی ہیں۔ تراجم اور معاون مواد کو اصل عربی متن سے الگ رکھا جاتا ہے۔';

  @override
  String get aboutBuiltForHeading => 'قرآن پڑھنے والوں کے لیے تیار';

  @override
  String get aboutBuiltForBody =>
      'اقرا اسپیس حسبِ ضرورت فونٹس، پڑھنے کی ترجیحات، بک مارکس، تراجم، اور تجوید کی معاونت کے ساتھ ایک مرکوز قرآن خوانی کا تجربہ فراہم کرتا ہے۔';

  @override
  String get aboutLookingAheadHeading => 'آگے کی طرف دیکھتے ہوئے';

  @override
  String get aboutLookingAheadBody =>
      'ہماری موجودہ توجہ ایک بہترین قرآن ریڈر بنانے پر ہے۔ مستقبل میں، ہم قرآن کو اقرا اسپیس کے مرکز میں رکھتے ہوئے سوچے سمجھے تعلیمی تجربات متعارف کرانے کی امید رکھتے ہیں۔';

  @override
  String get aboutCommitmentHeading => 'ہمارا عزم';

  @override
  String get aboutCommitmentBody1 =>
      'ہم اقرا اسپیس کو خیال، سادگی، اور مقصد کے ساتھ تعمیر کرنے کے لیے پرعزم ہیں۔';

  @override
  String get aboutCommitmentBody2 =>
      'ہمارا مقصد سادہ ہے: قرآن کو پڑھنا، اس پر غور کرنا، اور اس کے ساتھ جڑنا آسان بنانا۔';

  @override
  String get aboutContactHeading => 'ہم سے رابطہ کریں';

  @override
  String get aboutContactBody => 'سوالات یا رائے کے لیے، ہم سے رابطہ کریں:';

  @override
  String get aboutReachUsHeading => 'ہم تک رسائی';

  @override
  String get aboutReachX => 'X';

  @override
  String get aboutReachInstagram => 'انسٹاگرام';

  @override
  String get aboutReachWebsite => 'ویب سائٹ';

  @override
  String aboutCouldNotOpen(Object label) {
    return '$label نہیں کھل سکا۔';
  }
}
