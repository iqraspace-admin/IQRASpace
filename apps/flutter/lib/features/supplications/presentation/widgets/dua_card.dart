import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/transliteration_script.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/supplications/domain/entities/dua.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';

/// One dua: occasion + reference header, the Arabic text (always
/// rendered RTL in a dedicated Arabic font, regardless of the session's
/// script switch), the transliteration for whichever script is currently
/// selected, and the English translation.
class DuaCard extends ConsumerWidget {
  final Dua dua;

  const DuaCard({required this.dua, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final brand = IqraSpaceBrand.teal(themeMode);
    final script = ref.watch(transliterationScriptProvider);
    final mutedColor = colors.textColor.withValues(alpha: 0.65);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: colors.textColor.withValues(alpha: 0.15)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  dua.occasion,
                  style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                dua.reference,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: brand),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            dua.arabic,
            textAlign: TextAlign.right,
            textDirection: TextDirection.rtl,
            style: TextStyle(
              fontFamily: 'NotoNaskhArabic',
              fontSize: 22,
              height: 1.8,
              color: colors.textColor,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            dua.transliterationFor(script),
            textAlign: script.textDirection == TextDirection.rtl ? TextAlign.right : TextAlign.left,
            textDirection: script.textDirection,
            style: TextStyle(
              fontFamily: script.fontFamily,
              fontSize: 14.5,
              height: 1.5,
              fontStyle: script == TransliterationScript.latin ? FontStyle.italic : FontStyle.normal,
              color: mutedColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            dua.translationEnglish,
            textDirection: TextDirection.ltr,
            style: TextStyle(fontSize: 14, height: 1.45, color: colors.textColor),
          ),
        ],
      ),
    );
  }
}
