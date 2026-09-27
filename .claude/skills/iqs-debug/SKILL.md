---
name: iqs-debug
description: Debug and actually fix bugs in IqraSpace's Flutter app (apps/mobile/android) using a connected physical Android device — reproduce on-device, find the root cause via logs/diagnostics, implement the fix, then retest until resolved. Trigger when the user says "iqs-debug".
---

# iqs-debug

**Connect Device → Run App → Reproduce Bug → Diagnose Root Cause → Fix → Test Again → Verify**

This is a fix-it workflow, not a report-it workflow: don't stop at describing
the bug. Reproduce it for real, find the actual root cause, change the code,
and confirm the fix on the device before calling anything done.

## 1. Connect Device

```
adb devices -l
flutter devices
```
Requires exactly what it says: a physical Android device connected via USB
with USB debugging authorized (if `adb devices` shows `unauthorized`, the
user needs to accept the RSA key prompt on the device itself — that's not
something to work around). If no device shows up, stop and ask rather than
falling back to an emulator — this skill is specifically for real-device
debugging (see `TESTING.md` for the separate emulator workflow, which has
its own known limitations in this environment).

## 2. Run App

From `apps/mobile/android`:
```
flutter run -d <device-id>
```
Debug mode (the default) gives hot reload (`r`) / hot restart (`R`) and
`flutter logs`. Keep this session open through the whole reproduce → fix →
retest loop — hot reload is what makes "fix, retest" fast instead of a full
reinstall each time.

## 3. Reproduce Bug

Actually trigger the reported behavior on the device before theorizing.
Watch `flutter logs` (or `adb logcat` for native-layer errors this app's own
`debugPrint` calls won't cover — e.g. ExoPlayer/`just_audio` errors surface
in logcat, not Dart logs) while doing it.

## 4. Diagnose Root Cause

Read the actual code path, don't guess. Common places a symptom's real
cause turns out to live one layer away from where it's observed:
- State/providers (`lib/features/*/presentation/providers/`) vs. the UI
  widget that reads them
- `IqraAudioHandler` (`lib/core/audio/iqra_audio_handler.dart`) vs.
  `AudioController` (`audio_providers.dart`) vs. the screen — three layers
  for anything audio-related, see AUDIO.md
- Hive-persisted settings (key names in `HiveBoxes`, e.g. `'listeningTrack'`)
  vs. the Riverpod provider caching them in memory — a stale cache or wrong
  key string is a classic silent-failure spot
- If the bug is on code with uncommitted local changes (`git status`/`git
  diff` on the relevant file), test with `git stash` whether the bug
  predates those changes — tells you whether to fix forward or whether the
  WIP diff itself is the regression

## 5. Fix

Implement the actual fix in the source. Match the existing code's style and
doc-comment density (see any file in `lib/` for the pattern: comments
explain *why*, not *what*). Keep the change scoped to the root cause.

## 6. Test Again

Hot reload/restart and re-run the exact repro steps from step 3. Also sanity
check the automated suite hasn't regressed:
```
flutter analyze
flutter test
```

## 7. Verify

Confirm the fix from the user-visible side on the device — the actual UI
flow a user would hit, not just "the function now returns the right value."

## Rules

1. **Physical device only** for this skill — no emulator fallback (see step 1).
2. **Fix bugs, don't just report them.** Reproduce → root-cause → implement
   → retest → verify, every time. A message that only lists symptoms without
   attempting a fix is an incomplete run of this skill.
3. **Prioritize functional bugs over cosmetic ones.**
4. **Don't break existing functionality.** Preserve Quran reading, Arabic
   audio, navigation, bookmarks, settings, and UI. Don't touch the verified
   Surah audio boundaries/content in `arabic_surah_audio.dart` /
   `urdu_surah_audio.dart` (the split-part cut points and URLs — see
   AUDIO.md) unless the fix specifically requires it. Don't add unrelated
   features or redesign things while in here.
5. **Iterate until resolved or a specific external blocker is proven** —
   "external blocker" means something like a real dependency bug or a
   server-side data problem you've confirmed independently (e.g. curl'd the
   URL yourself and it's actually broken), not "I couldn't figure it out."

## Critical current issue: Quran Urdu audio not working at all

Investigated statically (no device was available yet) before writing this
skill — here's what's already ruled out, so the on-device session can start
from the remaining live hypotheses instead of re-deriving all of this:

**Already confirmed fine (don't re-check these first):**
- The Cloudflare R2 URLs themselves are live and correct — `curl -I` against
  `https://audio.iqraspace.org/urdu/001.mp3`, `.../urdu/002.mp3` (Al-Baqara,
  the long ~4h17m one), and `.../urdu/114.mp3` all returned `200 OK` with
  plausible `Content-Length`s and `cf-cache-status: HIT`. `urduSurahAudioUrl()`
  in `lib/core/constants/urdu_surah_audio.dart` constructs these correctly.
- `_advanceQueueOrStop` in `iqra_audio_handler.dart` (the code that decides
  whether to chain into Urdu after the Arabic portion finishes) reads
  `HiveBoxes.settingsBox.get('listeningTrack')` and compares against
  `ListeningTrack.arabicPlusUrdu.name` — matches how
  `ListeningTrackNotifier` in `surah_providers.dart` writes that same key.
  No obvious key-name/enum-name mismatch.
- `AudioCacheManager.resolve`/`_cacheDir` (download-then-cache logic) reads
  cleanly — reasonable timeouts, atomic `.part`-then-rename, no obvious bug.

**Not yet checked — needs the physical device:**
- There are **uncommitted local changes** to `iqra_audio_handler.dart`,
  `audio_providers.dart`, and `surah_reader_screen.dart` (`git diff` those
  three) adding: lock-screen artwork resolution (`_resolveArtUri`), and a
  "retry just the Urdu track, not the whole Surah" feature
  (`_pendingUrduRetry`/`retryListening`). This is recent, uncommitted, and
  has never run on a device. Test with these changes in place first: if
  Urdu genuinely doesn't play at all (not just "retry-after-error is
  wrong"), also try `git stash` on these three files to check whether the
  bug predates this WIP work — that tells you whether to fix forward here
  or whether this diff itself broke something (e.g. an exception thrown by
  `_urduTitleFor`/`currentAppLanguageFromHive()` before `playSupplementaryTrack`
  is even reached in `_advanceQueueOrStop`, which would abort silently since
  that call isn't inside a try/catch).
- **Fast repro tip:** `arabicPlusUrdu` only starts Urdu *after* the Arabic
  recitation finishes playing to the end (`_advanceQueueOrStop`'s design,
  see AUDIO.md). Don't test this with a long Surah — Al-Baqara's Arabic
  portion alone is over an hour. Use a short Surah (112 Al-Ikhlas, 113
  Al-Falaq, or 114 An-Nas — seconds to a couple minutes) for a fast
  reproduce/fix/retest loop, or seek to a few seconds before the Arabic
  track's end to trigger the transition immediately.
- Check Settings → Audio & Recitation actually persists
  `ListeningTrack.arabicPlusUrdu` (radio selection in
  `audio_settings_sheet.dart` → `listeningTrackProvider.notifier.setTrack`)
  and that it's still selected by the time `_advanceQueueOrStop` reads it
  back — a provider/Hive round-trip bug would look exactly like "Urdu never
  plays."
- Watch `flutter logs` / `adb logcat` during a real repro for anything
  `just_audio`/ExoPlayer logs about the Urdu URL specifically (codec issue
  with the mono/16kHz/24kbps encoding on this particular device? unlikely
  given Arabic tracks are also compressed audio, but check) vs. a Dart-level
  exception vs. nothing at all (which would point at the track-selection/
  Hive layer instead of playback itself).

## Final Report

After each `iqs-debug` run, report:
- Bugs investigated
- Root causes found
- Fixes implemented
- Tests performed on the physical device
- Remaining issues/blockers
- Whether Quran Urdu audio is working
