import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/audio/iqra_audio_handler.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/home/presentation/screens/home_screen.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await HiveBoxes.init();
  // Registers the audio handler with the OS for background/lock-screen
  // playback (Listening / Reading+Listening modes). Best-effort — see
  // registerAudioService's doc comment; audioControllerProvider works
  // either way.
  await registerAudioService();
  runApp(const ProviderScope(child: QuranFlutterApp()));
}

class QuranFlutterApp extends ConsumerWidget {
  const QuranFlutterApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final appLanguage = ref.watch(appLanguageProvider);
    return MaterialApp(
      title: 'IqraSpace',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(themeMode),
      // UI-only locale/RTL — never applied to Quran Arabic text or its
      // translation line, which set their own fixed `textDirection`
      // regardless of app locale (see ayah_rich_text.dart).
      locale: appLanguage.locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      home: const HomeScreen(),
    );
  }
}
