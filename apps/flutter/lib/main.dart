import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/storage/hive_boxes.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/quran_reader/presentation/screens/surah_list_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await HiveBoxes.init();
  runApp(const ProviderScope(child: QuranFlutterApp()));
}

class QuranFlutterApp extends ConsumerWidget {
  const QuranFlutterApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    return MaterialApp(
      title: 'IqraSpace Quran (Flutter)',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(themeMode),
      home: const SurahListScreen(),
    );
  }
}
