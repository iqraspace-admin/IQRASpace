import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/constants/app_language.dart';
import 'package:quran_flutter/core/constants/surah_transliterations.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/core/widgets/surah_name_label.dart';
import 'package:quran_flutter/features/quran_reader/domain/entities/surah_summary.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// The result of [showJumpToSurahSheet] — where the reader chose to jump.
typedef SurahJumpTarget = ({int surahNumber, int ayahNumber});

/// A twin-wheel "jump to Surah : Ayah" picker — search or spin to a
/// Surah on the left, then to an Ayah within it on the right, and
/// confirm with Done. Opened from the reader's header (tap the Surah
/// heading, or the dedicated jump icon).
Future<SurahJumpTarget?> showJumpToSurahSheet(
  BuildContext context, {
  required int currentSurah,
  int currentAyah = 1,
}) {
  return showModalBottomSheet<SurahJumpTarget>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _JumpToSurahSheet(currentSurah: currentSurah, currentAyah: currentAyah),
  );
}

class _JumpToSurahSheet extends ConsumerStatefulWidget {
  final int currentSurah;
  final int currentAyah;

  const _JumpToSurahSheet({required this.currentSurah, required this.currentAyah});

  @override
  ConsumerState<_JumpToSurahSheet> createState() => _JumpToSurahSheetState();
}

class _JumpToSurahSheetState extends ConsumerState<_JumpToSurahSheet> {
  static const _itemExtent = 40.0;

  late FixedExtentScrollController _surahController;
  late FixedExtentScrollController _ayahController;
  final _surahSearchController = TextEditingController();
  final _ayahSearchController = TextEditingController();

  int _selectedSurahIndex = 0; // 0-based
  int _selectedAyahIndex = 0; // 0-based

  @override
  void initState() {
    super.initState();
    _selectedSurahIndex = (widget.currentSurah - 1).clamp(0, 113);
    _selectedAyahIndex = (widget.currentAyah - 1).clamp(0, 1000);
    _surahController = FixedExtentScrollController(initialItem: _selectedSurahIndex);
    _ayahController = FixedExtentScrollController(initialItem: _selectedAyahIndex);
  }

  @override
  void dispose() {
    _surahController.dispose();
    _ayahController.dispose();
    _surahSearchController.dispose();
    _ayahSearchController.dispose();
    super.dispose();
  }

  void _jumpToSurahMatching(String query, List<SurahSummary> surahs, AppLanguage language) {
    if (query.trim().isEmpty) return;
    final lower = query.trim().toLowerCase();
    final asNumber = int.tryParse(lower);
    // `contains`, not `startsWith` — most surah names begin with "Al-",
    // so a reader typing the part they actually remember (e.g. "baqa"
    // for Al-Baqara) would otherwise never match anything. Also strips
    // a leading "al-"/"al " from each candidate name so "baqara" alone
    // matches "Al-Baqara" as a prefix too, not just a substring. Matches
    // against the current UI language's transliteration too, so search
    // still works when the picker is showing Telugu/Urdu names.
    final index = surahs.indexWhere((s) {
      if (asNumber != null) return s.number == asNumber;
      final english = s.englishName.toLowerCase();
      final englishNoAl = english.replaceFirst(RegExp(r'^al[- ]'), '');
      final currentLangName = surahTransliterationFor(s.number, language).toLowerCase();
      return english.contains(lower) ||
          englishNoAl.startsWith(lower) ||
          currentLangName.contains(lower) ||
          s.englishNameTranslation.toLowerCase().contains(lower);
    });
    if (index == -1) return;
    setState(() => _selectedSurahIndex = index);
    _surahController.animateToItem(
      index,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  void _jumpToAyahMatching(String query, int ayahCount) {
    final n = int.tryParse(query.trim());
    if (n == null || n < 1 || n > ayahCount) return;
    final index = n - 1;
    setState(() => _selectedAyahIndex = index);
    _ayahController.animateToItem(
      index,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final brand = IqraSpaceBrand.teal(themeMode);
    final surahListAsync = ref.watch(surahListProvider);
    final language = ref.watch(appLanguageProvider);
    final l10n = AppLocalizations.of(context)!;

    return SafeArea(
      child: Container(
        height: MediaQuery.of(context).size.height * 0.62,
        margin: const EdgeInsets.only(top: 40),
        decoration: BoxDecoration(
          color: colors.background,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: surahListAsync.when(
          data: (surahs) {
            _selectedSurahIndex = _selectedSurahIndex.clamp(0, surahs.length - 1);
            final selectedSurah = surahs[_selectedSurahIndex];
            _selectedAyahIndex = _selectedAyahIndex.clamp(0, selectedSurah.numberOfAyahs - 1);

            return Column(
              children: [
                const SizedBox(height: 10),
                Container(width: 38, height: 4, decoration: BoxDecoration(
                  color: colors.textColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(3),
                )),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(l10n.jumpToSura, style: TextStyle(fontWeight: FontWeight.w600, color: colors.textColor)),
                      ),
                      Expanded(
                        child: Text(l10n.jumpToAyah, style: TextStyle(fontWeight: FontWeight.w600, color: colors.textColor)),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Expanded(
                        child: _SearchField(
                          controller: _surahSearchController,
                          hint: l10n.jumpToSurahSearchHint,
                          onChanged: (q) => _jumpToSurahMatching(q, surahs, language),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _SearchField(
                          controller: _ayahSearchController,
                          hint: l10n.jumpToAyahSearchHint,
                          keyboardType: TextInputType.number,
                          onChanged: (q) => _jumpToAyahMatching(q, selectedSurah.numberOfAyahs),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Row(
                    children: [
                      Expanded(
                        child: ListWheelScrollView.useDelegate(
                          controller: _surahController,
                          itemExtent: _itemExtent,
                          diameterRatio: 1.8,
                          physics: const FixedExtentScrollPhysics(),
                          onSelectedItemChanged: (index) => setState(() {
                            _selectedSurahIndex = index;
                            _selectedAyahIndex = 0;
                            _ayahController.jumpToItem(0);
                          }),
                          childDelegate: ListWheelChildBuilderDelegate(
                            childCount: surahs.length,
                            builder: (context, index) {
                              final s = surahs[index];
                              final isSelected = index == _selectedSurahIndex;
                              final rowStyle = TextStyle(
                                fontSize: isSelected ? 15 : 13.5,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                                color: isSelected ? brand : colors.textColor.withValues(alpha: 0.6),
                              );
                              return Container(
                                alignment: Alignment.centerLeft,
                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                color: isSelected ? brand.withValues(alpha: 0.08) : null,
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text('${s.number}. ', style: rowStyle),
                                    Flexible(
                                      child: SurahNameLabel(
                                        surahNumber: s.number,
                                        arabicName: s.name,
                                        overflow: TextOverflow.ellipsis,
                                        maxLines: 1,
                                        arabicStyle: rowStyle,
                                        translitStyle: rowStyle,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      Expanded(
                        child: ListWheelScrollView.useDelegate(
                          key: ValueKey(selectedSurah.number),
                          controller: _ayahController,
                          itemExtent: _itemExtent,
                          diameterRatio: 1.8,
                          physics: const FixedExtentScrollPhysics(),
                          onSelectedItemChanged: (index) => setState(() => _selectedAyahIndex = index),
                          childDelegate: ListWheelChildBuilderDelegate(
                            childCount: selectedSurah.numberOfAyahs,
                            builder: (context, index) {
                              final isSelected = index == _selectedAyahIndex;
                              return Container(
                                alignment: Alignment.centerLeft,
                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                color: isSelected ? brand.withValues(alpha: 0.08) : null,
                                child: Text(
                                  '${index + 1}',
                                  style: TextStyle(
                                    fontSize: isSelected ? 16 : 13.5,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                                    color: isSelected ? brand : colors.textColor.withValues(alpha: 0.6),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => Navigator.of(context).pop((
                        surahNumber: selectedSurah.number,
                        ayahNumber: _selectedAyahIndex + 1,
                      )),
                      child: Text(l10n.commonDone),
                    ),
                  ),
                ),
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stackTrace) => Center(
            child: Text(l10n.jumpToCouldNotLoad(error), textAlign: TextAlign.center),
          ),
        ),
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final ValueChanged<String> onChanged;
  final TextInputType? keyboardType;

  const _SearchField({
    required this.controller,
    required this.hint,
    required this.onChanged,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        isDense: true,
        hintText: hint,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}
