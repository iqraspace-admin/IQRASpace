import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/constants/dua_translation_language.dart';
import 'package:quran_flutter/core/constants/transliteration_script.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/features/supplications/domain/entities/dua.dart';
import 'package:quran_flutter/features/supplications/domain/entities/dua_favorite.dart';
import 'package:quran_flutter/features/supplications/domain/entities/supplication_category.dart';
import 'package:quran_flutter/features/supplications/presentation/constants/dua_category_style.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/dua_favorites_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/providers/supplications_providers.dart';
import 'package:quran_flutter/features/supplications/presentation/widgets/dua_jump_sheet.dart';
import 'package:quran_flutter/features/supplications/presentation/widgets/dua_reading_settings_sheet.dart';
import 'package:quran_flutter/features/supplications/presentation/widgets/tasbeeh_counter_badge.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';
import 'package:share_plus/share_plus.dart';

/// One dua at a time, swipeable within its category (PageView) — replaces
/// the old DuaCard-everything-inline list. No audio/play control yet
/// (the content carries an audio_url, but no player is wired up).
///
/// The transliteration script always follows the app's own language
/// setting ([appLanguageProvider]) — English/Telugu/Urdu — rather than a
/// separate Duas-only toggle, so changing the app language visibly and
/// consistently changes this screen too, the same way it already changes
/// every other screen's chrome text.
TransliterationScript _scriptForAppLanguage(AppLanguage language) {
  switch (language) {
    case AppLanguage.english:
      return TransliterationScript.latin;
    case AppLanguage.telugu:
      return TransliterationScript.telugu;
    case AppLanguage.urdu:
      return TransliterationScript.urdu;
  }
}

class DuaReadingScreen extends ConsumerStatefulWidget {
  final String categoryId;
  final int initialIndex;

  const DuaReadingScreen({required this.categoryId, required this.initialIndex, super.key});

  @override
  ConsumerState<DuaReadingScreen> createState() => _DuaReadingScreenState();
}

class _DuaReadingScreenState extends ConsumerState<DuaReadingScreen> {
  late final PageController _pageController;
  late int _currentIndex;
  int _tasbeehCount = 0;
  String? _currentSlug;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  /// Keeps the page on the same dua (by slug) when the content refreshes
  /// underneath the reader (a remote update may re-order or remove duas).
  void _reconcile(SupplicationCategory category) {
    final last = category.duas.length - 1;
    final slug = _currentSlug;
    if (slug == null) {
      _currentIndex = _currentIndex.clamp(0, last);
      _currentSlug = category.duas[_currentIndex].slug;
      return;
    }
    if (_currentIndex <= last && category.duas[_currentIndex].slug == slug) return;
    final found = category.duas.indexWhere((d) => d.slug == slug);
    final target = found >= 0 ? found : _currentIndex.clamp(0, last);
    _currentIndex = target;
    _currentSlug = category.duas[target].slug;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && _pageController.hasClients) _pageController.jumpToPage(target);
    });
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final category = ref.watch(supplicationCategoryProvider(widget.categoryId));
    final appLanguage = ref.watch(appLanguageProvider);
    final script = _scriptForAppLanguage(appLanguage);
    final translationLanguage = ref.watch(duaTranslationLanguageProvider);
    final transliterationEnabled = ref.watch(duaTransliterationEnabledProvider);
    final favorites = ref.watch(duaFavoritesProvider);
    final tasbeehEnabled = ref.watch(duaTasbeehEnabledProvider);
    final l10n = AppLocalizations.of(context)!;

    if (category == null || category.duas.isEmpty) return Scaffold(appBar: AppBar(), body: const SizedBox.shrink());
    _reconcile(category);

    final style = DuaCategoryStyles.forId(widget.categoryId);
    final currentDua = category.duas[_currentIndex];
    final isFavorited = favorites.any((f) => f.duaSlug == currentDua.slug);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        toolbarHeight: 64,
        centerTitle: true,
        title: InkWell(
          onTap: () async {
            final selected = await showDuaJumpSheet(
              context,
              category: category,
              currentIndex: _currentIndex,
              appLanguage: appLanguage,
            );
            if (selected != null) _pageController.jumpToPage(selected);
          },
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Flexible(
                    child: Text(
                      category.labelFor(appLanguage),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.unfold_more, size: 16),
                ],
              ),
              // Current position within the category — centered in the
              // header, not the content area, and kept in sync via
              // onPageChanged below.
              Text(
                '${_currentIndex + 1} / ${category.duas.length}',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune),
            tooltip: l10n.supplicationsReadingSettingsTitle,
            onPressed: () => showDuaReadingSettingsSheet(context),
          ),
        ],
      ),
      body: PageView.builder(
        controller: _pageController,
        itemCount: category.duas.length,
        onPageChanged: (index) => setState(() {
          _currentIndex = index;
          _currentSlug = category.duas[index].slug;
          _tasbeehCount = 0;
        }),
        itemBuilder: (context, index) {
          final dua = category.duas[index];
          return SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 14, 24, 20),
            child: Column(
              children: [
                Text(
                  dua.occasionFor(appLanguage),
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: colors.textColor.withValues(alpha: 0.6)),
                ),
                if (dua.repeatCount != null) ...[
                  const SizedBox(height: 8),
                  _RepeatChip(l10n.supplicationsRepeatCount(dua.repeatCount!), style.accent),
                ],
                const SizedBox(height: 10),
                // Order: Arabic -> Transliteration -> Translation, compact
                // spacing throughout — no decorative divider in between.
                Text(
                  dua.arabic,
                  textAlign: TextAlign.center,
                  textDirection: TextDirection.rtl,
                  style: TextStyle(fontFamily: 'NotoNaskhArabic', fontSize: 24, height: 1.8, color: colors.textColor),
                ),
                const SizedBox(height: 10),
                if (transliterationEnabled && dua.transliterationFor(script).isNotEmpty) ...[
                _SectionHeader(l10n.supplicationsTransliterationHeading, style.accent),
                Text(
                  dua.transliterationFor(script),
                  textAlign: TextAlign.center,
                  textDirection: script.textDirection,
                  style: TextStyle(fontFamily: script.fontFamily, fontSize: 14.5, height: 1.4, color: colors.textColor),
                ),
                const SizedBox(height: 10),
                ],
                if (dua.translationFor(translationLanguage).isNotEmpty) ...[
                  Text(
                    dua.translationFor(translationLanguage),
                    textAlign: TextAlign.center,
                    textDirection: dua.usesUrduTranslation(translationLanguage) ? TextDirection.rtl : TextDirection.ltr,
                    style: TextStyle(
                      fontFamily: dua.usesUrduTranslation(translationLanguage) ? 'NotoNastaliqUrdu' : null,
                      fontSize: 15,
                      height: dua.usesUrduTranslation(translationLanguage) ? 1.8 : 1.35,
                      color: colors.textColor.withValues(alpha: 0.75),
                    ),
                  ),
                  if (dua.urduTranslationMissing(translationLanguage)) ...[
                    const SizedBox(height: 4),
                    Text(
                      l10n.supplicationsUrduTranslationUnavailable,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        fontStyle: FontStyle.italic,
                        color: colors.textColor.withValues(alpha: 0.5),
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                ],
                if (dua.description != null) ...[
                  Text(
                    dua.description!,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      fontStyle: FontStyle.italic,
                      color: colors.textColor.withValues(alpha: 0.55),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
                if (dua.displayReference.isNotEmpty) ...[
                  _SectionHeader(l10n.supplicationsReferenceHeading, style.accent),
                  Text(
                    dua.displayReference,
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13.5, color: colors.textColor.withValues(alpha: 0.65)),
                  ),
                ],
              ],
            ),
          );
        },
      ),
      floatingActionButton: tasbeehEnabled
          ? TasbeehCounterBadge(
              count: _tasbeehCount,
              target: currentDua.repeatCount,
              color: style.accent,
              onTap: () => setState(() => _tasbeehCount++),
              onReset: () => setState(() => _tasbeehCount = 0),
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      bottomNavigationBar: BottomAppBar(
        color: colors.chromeColor,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(
              icon: Icon(isFavorited ? Icons.star : Icons.star_border_outlined),
              color: isFavorited ? IqraSpaceBrand.gold(themeMode) : null,
              tooltip: isFavorited ? l10n.supplicationsFavoriteRemoveTooltip : l10n.supplicationsFavoriteAddTooltip,
              onPressed: () => ref.read(duaFavoritesProvider.notifier).toggle(
                    DuaFavorite(
                      duaSlug: currentDua.slug,
                      categoryId: widget.categoryId,
                      duaIndex: _currentIndex,
                      categoryLabel: category.label,
                      snippet: currentDua.occasion,
                      createdAt: DateTime.now(),
                    ),
                  ),
            ),
            IconButton(
              icon: const Icon(Icons.share_outlined),
              tooltip: l10n.supplicationsShareTooltip,
              onPressed: () {
                final dua = currentDua;
                SharePlus.instance.share(
                  ShareParams(
                    text: _shareText(dua, translationLanguage, l10n),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;
  final Color color;

  const _SectionHeader(this.label, this.color);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(label, style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700, color: color)),
    );
  }
}

/// Share text: Arabic, translation, then the repeat-count line and the
/// reference only when present, then the attribution.
String _shareText(Dua dua, DuaTranslationLanguage language, AppLocalizations l10n) {
  final translation = dua.translationFor(language);
  final reference = dua.displayReference;
  return [
    dua.arabic,
    if (translation.isNotEmpty) translation,
    if (dua.repeatCount != null) l10n.supplicationsRepeatCount(dua.repeatCount!),
    if (reference.isNotEmpty) '— $reference',
    l10n.supplicationsShareAttribution,
  ].join('\n\n');
}

class _RepeatChip extends StatelessWidget {
  final String label;
  final Color color;

  const _RepeatChip(this.label, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: color.withValues(alpha: 0.14),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(label, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: color)),
    );
  }
}
