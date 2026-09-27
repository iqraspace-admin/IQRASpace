import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/widgets/brand_mark.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/settings/presentation/data/user_guide_content.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// A screenshot-led walkthrough of IqraSpace — real screens with the
/// relevant control highlighted (see docs/user_guide/ for how the
/// screenshots are captured/annotated), one page per topic, ending in a
/// "Help Us Test IqraSpace" section for volunteer testers.
///
/// Reached from Reading Settings' "User Guide" row — see
/// reader_settings_sheet.dart.
class UserGuideScreen extends ConsumerStatefulWidget {
  const UserGuideScreen({super.key});

  @override
  ConsumerState<UserGuideScreen> createState() => _UserGuideScreenState();
}

class _UserGuideScreenState extends ConsumerState<UserGuideScreen> {
  final _pageController = PageController();
  int _page = 0;
  List<GuideTopic> _topics = const [];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _goTo(int page) {
    _pageController.animateToPage(
      page.clamp(0, _topics.length - 1),
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final brand = IqraSpaceBrand.teal(themeMode);
    final gold = IqraSpaceBrand.gold(themeMode);
    final l10n = AppLocalizations.of(context)!;
    _topics = [...featureTopics(l10n), ...testingTopics(l10n)];
    _page = _page.clamp(0, _topics.length - 1);
    final topic = _topics[_page];
    final isFirstTestingTask = topic.isTestingTask && (_page == 0 || !_topics[_page - 1].isTestingTask);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Row(
          children: [
            const BrandMark(size: 22),
            const SizedBox(width: 10),
            Flexible(child: Text(l10n.guideTitle, overflow: TextOverflow.ellipsis)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(l10n.guideSkip, style: TextStyle(color: colors.textColor.withValues(alpha: 0.7))),
          ),
        ],
      ),
      body: Column(
        children: [
          if (isFirstTestingTask)
            Container(
              width: double.infinity,
              color: gold.withValues(alpha: 0.12),
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
              child: Text(
                l10n.guideHelpUsTest,
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: gold),
              ),
            ),
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              itemCount: _topics.length,
              onPageChanged: (page) => setState(() => _page = page),
              itemBuilder: (context, index) {
                final t = _topics[index];
                return ListView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                  children: [
                    Text(t.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.asset(
                        t.assetPath,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) => Container(
                          height: 220,
                          alignment: Alignment.center,
                          color: colors.textColor.withValues(alpha: 0.06),
                          child: Text(
                            l10n.guideScreenshotUnavailable,
                            style: TextStyle(color: colors.textColor.withValues(alpha: 0.5)),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      t.caption,
                      style: TextStyle(fontSize: 14.5, height: 1.5, color: colors.textColor.withValues(alpha: 0.85)),
                    ),
                  ],
                );
              },
            ),
          ),
          _GuideFooter(
            page: _page,
            count: _topics.length,
            brand: brand,
            colors: colors,
            backLabel: l10n.guideBack,
            doneLabel: l10n.commonDone,
            nextLabel: l10n.guideNext,
            onBack: _page == 0 ? null : () => _goTo(_page - 1),
            onNext: _page == _topics.length - 1 ? null : () => _goTo(_page + 1),
            onJump: _goTo,
            onDone: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }
}

class _GuideFooter extends StatelessWidget {
  final int page;
  final int count;
  final Color brand;
  final ReaderColors colors;
  final String backLabel;
  final String doneLabel;
  final String nextLabel;
  final VoidCallback? onBack;
  final VoidCallback? onNext;
  final ValueChanged<int> onJump;
  final VoidCallback onDone;

  const _GuideFooter({
    required this.page,
    required this.count,
    required this.brand,
    required this.colors,
    required this.backLabel,
    required this.doneLabel,
    required this.nextLabel,
    required this.onBack,
    required this.onNext,
    required this.onJump,
    required this.onDone,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
        child: Column(
          children: [
            // Tappable dot indicator — lets a reader jump straight back to
            // any topic instead of paging through one at a time.
            SizedBox(
              height: 18,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: count,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (context, index) => GestureDetector(
                  onTap: () => onJump(index),
                  child: Container(
                    width: 8,
                    height: 8,
                    margin: const EdgeInsets.symmetric(vertical: 5),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: index == page ? brand : colors.textColor.withValues(alpha: 0.2),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextButton.icon(
                    onPressed: onBack,
                    icon: const Icon(Icons.chevron_left),
                    label: Text(backLabel),
                  ),
                ),
                Expanded(
                  child: onNext == null
                      ? FilledButton(onPressed: onDone, child: Text(doneLabel))
                      : FilledButton.icon(
                          onPressed: onNext,
                          icon: const Icon(Icons.chevron_right),
                          label: Text(nextLabel),
                        ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
