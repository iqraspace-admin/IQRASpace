import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_flutter/core/audio/audio_cache_manager.dart';
import 'package:quran_flutter/core/constants/reader_mode.dart';
import 'package:quran_flutter/core/constants/reciters.dart';
import 'package:quran_flutter/core/theme/app_theme.dart';
import 'package:quran_flutter/features/quran_reader/presentation/providers/surah_providers.dart';
import 'package:quran_flutter/l10n/app_localizations.dart';

/// Audio & Recitation — Reciter and Listening Track together, split out
/// of the main Reader Settings sheet so that sheet stays short. Every
/// control here applies live via Riverpod just like its parent, so
/// there's nothing to Save.
Future<void> showAudioSettingsSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: false,
    backgroundColor: Colors.transparent,
    builder: (_) => const _AudioSettingsSheet(),
  );
}

class _AudioSettingsSheet extends ConsumerWidget {
  const _AudioSettingsSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(readerThemeModeProvider);
    final colors = ReaderColors.forMode(themeMode);
    final reciterEdition = ref.watch(reciterEditionProvider);
    final listeningTrack = ref.watch(listeningTrackProvider);
    final l10n = AppLocalizations.of(context)!;

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.35,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) {
        return Material(
          color: colors.background,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          clipBehavior: Clip.antiAlias,
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 14),
                  decoration: BoxDecoration(
                    color: colors.textColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(l10n.settingsAudioRecitation, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    tooltip: l10n.settingsClose,
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              _SectionLabel(l10n.settingsReciter),
              RadioGroup<String>(
                groupValue: reciterEdition,
                onChanged: (id) => ref.read(reciterEditionProvider.notifier).setReciter(id!),
                child: Column(
                  children: [
                    for (final option in reciterOptions)
                      RadioListTile<String>(title: Text(option.displayName), value: option.identifier),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
                child: Text(
                  l10n.settingsReciterModeNote,
                  style: TextStyle(fontSize: 12, color: colors.textColor.withValues(alpha: 0.6)),
                ),
              ),
              const Divider(),
              _SectionLabel(l10n.modeListening),
              RadioGroup<ListeningTrack>(
                groupValue: listeningTrack,
                onChanged: (track) => ref.read(listeningTrackProvider.notifier).setTrack(track!),
                child: Column(
                  children: [
                    RadioListTile<ListeningTrack>(
                      title: Text(l10n.listeningTrackArabicOnly),
                      value: ListeningTrack.arabicOnly,
                    ),
                    RadioListTile<ListeningTrack>(
                      title: Text(l10n.listeningTrackArabicPlusUrdu),
                      value: ListeningTrack.arabicPlusUrdu,
                    ),
                  ],
                ),
              ),
              // Native only — there's nothing to clear on web (Listening
              // Mode streams straight from Cloudflare R2 there, same
              // as before this cache layer existed; see
              // AudioCacheManager's own kIsWeb guard).
              if (!kIsWeb) ...[
                const Divider(),
                _AudioCacheSection(l10n: l10n, textColor: colors.textColor),
              ],
            ],
          ),
        );
      },
    );
  }
}

/// Shows how much disk space Listening Mode's downloaded Surah audio is
/// using, with a button to delete it all (see [AudioCacheManager]).
/// Downloaded files are re-fetched from Cloudflare R2 on next play, so
/// this is purely a "free up space" action, never a Quran-content reset.
class _AudioCacheSection extends StatefulWidget {
  final AppLocalizations l10n;
  final Color textColor;

  const _AudioCacheSection({required this.l10n, required this.textColor});

  @override
  State<_AudioCacheSection> createState() => _AudioCacheSectionState();
}

class _AudioCacheSectionState extends State<_AudioCacheSection> {
  late Future<int> _sizeFuture = AudioCacheManager.cacheSizeBytes();
  bool _clearing = false;

  Future<void> _clear() async {
    setState(() => _clearing = true);
    await AudioCacheManager.clearCache();
    if (!mounted) return;
    setState(() {
      _clearing = false;
      _sizeFuture = AudioCacheManager.cacheSizeBytes();
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<int>(
      future: _sizeFuture,
      builder: (context, snapshot) {
        final bytes = snapshot.data ?? 0;
        final sizeLabel = bytes > 0 ? '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB' : '—';
        return ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(widget.l10n.settingsAudioCache),
          subtitle: Text(sizeLabel, style: TextStyle(color: widget.textColor.withValues(alpha: 0.6))),
          trailing: _clearing
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : TextButton(
                  onPressed: bytes > 0 ? _clear : null,
                  child: Text(widget.l10n.settingsClearAudioCache),
                ),
        );
      },
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;

  const _SectionLabel(this.label);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 14, 0, 4),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
    );
  }
}
