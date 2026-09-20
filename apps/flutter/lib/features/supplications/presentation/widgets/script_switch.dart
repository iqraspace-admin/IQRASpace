import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/transliteration_script.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// The Supplications feature's reading-script switch — a segmented
/// control placed prominently at the top of the feature (not tucked into
/// Settings), since choosing a comfortable reading script is the whole
/// point of this feature. Changing it here applies immediately to every
/// dua card, on every category screen, for the rest of the session (and
/// persists — see transliterationScriptProvider).
class ScriptSwitch extends ConsumerWidget {
  const ScriptSwitch({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final brand = IqraSpaceBrand.teal(themeMode);
    final script = ref.watch(transliterationScriptProvider);
    final l10n = AppLocalizations.of(context)!;

    return SizedBox(
      width: double.infinity,
      child: SegmentedButton<TransliterationScript>(
        showSelectedIcon: false,
        style: SegmentedButton.styleFrom(
          selectedBackgroundColor: brand,
          selectedForegroundColor: Colors.white,
        ),
        segments: [
          for (final option in transliterationScriptOptions(l10n))
            ButtonSegment(
              value: option.script,
              label: Text(option.displayName, maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
        ],
        selected: {script},
        onSelectionChanged: (selection) =>
            ref.read(transliterationScriptProvider.notifier).setScript(selection.first),
      ),
    );
  }
}
