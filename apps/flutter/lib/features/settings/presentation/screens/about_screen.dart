import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/widgets/brand_mark.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';
import 'package:url_launcher/url_launcher.dart';

/// IqraSpace's official social/web presence — confirmed handles, not
/// guessed ones (X and Instagram: @IqraspaceOrg; website: from
/// apps/quran's own SITE_ORIGIN constant).
const _xUrl = 'https://x.com/IqraspaceOrg';
const _instagramUrl = 'https://instagram.com/IqraspaceOrg';
const _websiteUrl = 'https://iqraspace.org';

/// The IqraSpace mission/vision/values page — reached from Reader
/// Settings' "About IqraSpace" row. Static content; nothing here reads
/// or writes app state.
class AboutScreen extends ConsumerWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final brand = IqraSpaceBrand.teal(themeMode);
    final mutedColor = colors.textColor.withValues(alpha: 0.72);
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Row(
          children: [const BrandMark(size: 22), const SizedBox(width: 10), Text(l10n.aboutTitle)],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 36),
        children: [
          const Center(child: BrandMark(size: 64)),
          const SizedBox(height: 14),
          Text(
            l10n.aboutTagline,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: brand),
          ),
          const SizedBox(height: 18),
          Text(
            l10n.aboutIntro,
            style: TextStyle(fontSize: 14.5, height: 1.55, color: colors.textColor),
          ),
          _SectionHeading(l10n.aboutMissionHeading, brand),
          Text(
            l10n.aboutMissionBody,
            style: TextStyle(fontSize: 14, height: 1.55, color: mutedColor),
          ),
          _SectionHeading(l10n.aboutVisionHeading, brand),
          Text(
            l10n.aboutVisionBody,
            style: TextStyle(fontSize: 14, height: 1.55, color: mutedColor),
          ),
          _SectionHeading(l10n.aboutValuesHeading, brand),
          _ValueItem(
            title: l10n.aboutValueSimplicityTitle,
            description: l10n.aboutValueSimplicityDesc,
            mutedColor: mutedColor,
            textColor: colors.textColor,
          ),
          _ValueItem(
            title: l10n.aboutValueAccessibilityTitle,
            description: l10n.aboutValueAccessibilityDesc,
            mutedColor: mutedColor,
            textColor: colors.textColor,
          ),
          _ValueItem(
            title: l10n.aboutValueRespectTitle,
            description: l10n.aboutValueRespectDesc,
            mutedColor: mutedColor,
            textColor: colors.textColor,
          ),
          _ValueItem(
            title: l10n.aboutValueContinuousTitle,
            description: l10n.aboutValueContinuousDesc,
            mutedColor: mutedColor,
            textColor: colors.textColor,
          ),
          _SectionHeading(l10n.aboutAuthenticHeading, brand),
          Text(
            l10n.aboutAuthenticBody1,
            style: TextStyle(fontSize: 14, height: 1.55, color: mutedColor),
          ),
          const SizedBox(height: 10),
          Text(
            l10n.aboutAuthenticBody2,
            style: TextStyle(fontSize: 14, height: 1.55, color: mutedColor),
          ),
          _SectionHeading(l10n.aboutBuiltForHeading, brand),
          Text(
            l10n.aboutBuiltForBody,
            style: TextStyle(fontSize: 14, height: 1.55, color: mutedColor),
          ),
          _SectionHeading(l10n.aboutLookingAheadHeading, brand),
          Text(
            l10n.aboutLookingAheadBody,
            style: TextStyle(fontSize: 14, height: 1.55, color: mutedColor),
          ),
          _SectionHeading(l10n.aboutCommitmentHeading, brand),
          Text(
            l10n.aboutCommitmentBody1,
            style: TextStyle(fontSize: 14, height: 1.55, color: mutedColor),
          ),
          const SizedBox(height: 10),
          Text(
            l10n.aboutCommitmentBody2,
            style: TextStyle(fontSize: 14, height: 1.55, fontWeight: FontWeight.w600, color: colors.textColor),
          ),
          _SectionHeading(l10n.aboutContactHeading, brand),
          Text(
            l10n.aboutContactBody,
            style: TextStyle(fontSize: 14, height: 1.55, color: mutedColor),
          ),
          const SizedBox(height: 6),
          SelectableText(
            'iqraspaceorg@gmail.com',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: brand),
          ),
          _SectionHeading(l10n.aboutReachUsHeading, brand),
          Row(
            children: [
              Expanded(
                child: _ReachUsLink(
                  label: l10n.aboutReachX,
                  url: _xUrl,
                  brand: brand,
                  colors: colors,
                  couldNotOpen: l10n.aboutCouldNotOpen,
                  iconBuilder: (color) => Text(
                    'X',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ReachUsLink(
                  label: l10n.aboutReachInstagram,
                  url: _instagramUrl,
                  brand: brand,
                  colors: colors,
                  couldNotOpen: l10n.aboutCouldNotOpen,
                  iconBuilder: (color) => Icon(Icons.camera_alt_outlined, size: 20, color: color),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ReachUsLink(
                  label: l10n.aboutReachWebsite,
                  url: _websiteUrl,
                  brand: brand,
                  colors: colors,
                  couldNotOpen: l10n.aboutCouldNotOpen,
                  iconBuilder: (color) => Icon(Icons.language, size: 20, color: color),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            l10n.settingsAttribution,
            style: TextStyle(fontSize: 12, color: mutedColor),
          ),
        ],
      ),
    );
  }
}

class _ReachUsLink extends StatelessWidget {
  final String label;
  final String url;
  final Color brand;
  final ReaderColors colors;
  final String Function(String label) couldNotOpen;
  final Widget Function(Color color) iconBuilder;

  const _ReachUsLink({
    required this.label,
    required this.url,
    required this.brand,
    required this.colors,
    required this.couldNotOpen,
    required this.iconBuilder,
  });

  Future<void> _open(BuildContext context) async {
    final uri = Uri.parse(url);
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!opened && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(couldNotOpen(label))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => _open(context),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          border: Border.all(color: colors.textColor.withValues(alpha: 0.15)),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            iconBuilder(brand),
            const SizedBox(height: 6),
            Text(label, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  final String label;
  final Color brand;

  const _SectionHeading(this.label, this.brand);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 22, 0, 8),
      child: Text(
        label,
        style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700, color: brand),
      ),
    );
  }
}

class _ValueItem extends StatelessWidget {
  final String title;
  final String description;
  final Color mutedColor;
  final Color textColor;

  const _ValueItem({
    required this.title,
    required this.description,
    required this.mutedColor,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: RichText(
        text: TextSpan(
          style: TextStyle(fontSize: 14, height: 1.55, color: mutedColor),
          children: [
            TextSpan(text: '$title — ', style: TextStyle(fontWeight: FontWeight.w700, color: textColor)),
            TextSpan(text: description),
          ],
        ),
      ),
    );
  }
}
