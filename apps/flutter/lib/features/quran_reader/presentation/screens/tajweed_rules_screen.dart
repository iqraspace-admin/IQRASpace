import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/tajweed_rule_info.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/theme/tajweed_rule_colors.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// A plain-language legend for every Tajweed rule this app colors —
/// reached from Reader Settings, so a reader can look up what a color
/// means without leaving the app.
class TajweedRulesScreen extends ConsumerWidget {
  const TajweedRulesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final l10n = AppLocalizations.of(context)!;
    final rules = tajweedRuleInfo(l10n);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(title: Text(l10n.tajweedRulesScreenTitle)),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: rules.length,
        separatorBuilder: (_, __) => const Divider(height: 24),
        itemBuilder: (context, index) {
          final rule = rules[index];
          final color = tajweedRuleColors[rule.ruleKey] ?? colors.textColor;
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 14,
                height: 14,
                margin: const EdgeInsets.only(top: 4, right: 12),
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(rule.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5)),
                    const SizedBox(height: 3),
                    Text(
                      rule.description,
                      style: TextStyle(fontSize: 12.5, color: colors.textColor.withValues(alpha: 0.7), height: 1.4),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
