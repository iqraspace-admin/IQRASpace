# IqraSpace Flutter — local mobile testing workflow

Companion to [DEPLOYMENT.md](DEPLOYMENT.md) (release/Play Console) and
[CLAUDE.md](CLAUDE.md). This covers the local dev-loop side: getting a
change in front of an Android target fast, before it ever gets near a
release `.aab`.

## Why an emulator, not a physical device

This dev machine has no dedicated physical test device wired into the
workflow below, so it is built around the Android Emulator. (When a
physical device is connected, the `iqs-debug` skill uses it instead and
`flutter run -d <device>` works the same way.) See "Known
limitation" below before you rely on it for anything performance-sensitive.

## Quick start

```powershell
# 1. Boot the primary emulator (first boot: a few minutes; later boots
#    resume from a Quick Boot snapshot and are much faster)
.\scripts\emulator\start-emulator.ps1

# 2. In another terminal, once it's fully booted:
.\scripts\emulator\run-app.ps1
```

`flutter run` gives you the standard hot-reload loop from there:
- `r` — hot reload (apply code changes, keep app state)
- `R` — hot restart (reset app state, still avoids a full rebuild)
- `q` — quit

To test the older/smaller-screen profile instead:
```powershell
.\scripts\emulator\start-emulator.ps1 -Avd iqra_legacy_api24
.\scripts\emulator\run-app.ps1 -Avd iqra_legacy_api24
```

When you're done, stop the emulator with `.\scripts\emulator\stop-emulator.ps1`
rather than closing the window forcefully — this lets it save a Quick Boot
snapshot so the *next* start is fast again.

See [scripts/emulator/avd-profiles.md](scripts/emulator/avd-profiles.md)
for what's installed and how to (re)create the AVDs from scratch.

## Known limitation: no hardware acceleration on this machine

`emulator -accel-check` reports the Android Emulator hypervisor driver
isn't installed, because hardware virtualization (VT-x/AMD-V) is disabled
in this machine's BIOS/UEFI firmware. That's a firmware-level setting, not
something fixable from within Windows or this repo. Until it's enabled
(BIOS/UEFI → enable Intel VT-x or AMD-V → reboot → also enable the
"Windows Hypervisor Platform" optional feature), both AVDs run in
software-rendered mode:
- First boot of a given AVD: a few minutes.
- Subsequent boots: much faster via Quick Boot snapshot, but still not
  hardware speed — expect noticeably laggy scrolling/animations compared
  to a real device or an accelerated emulator. Don't read too much into
  jank/frame-rate observations made on this setup; focus manual testing
  on correctness (does the right thing happen, does the right content
  render), not on perceived smoothness.

Once virtualization is enabled, drop the `-no-accel -gpu
swiftshader_indirect` flags (or pass `-Accelerated` to
`start-emulator.ps1`) for full-speed emulation.

## If the emulator crashes with a segfault right after startup

While setting this up, launching `iqra_primary_api36` from inside the
coding-agent session that configured it (Claude Code's own sandboxed shell)
consistently segfaulted a few seconds into boot — right after the emulator
logs `netsimd` initialization, before any guest-kernel output — in every
mode tried (windowed, `-no-window`, and with that shell's own sandboxing
explicitly disabled). System-wide exploit-mitigation/VBS settings looked
normal, so this looks specific to how that agent's process sandbox
constrains a QEMU-based VM (most likely blocking the dynamic
code-generation TCG's software CPU emulation needs), not a problem with
this Windows install, the SDK, or the AVD config — the boot log is
identical and clean up to the crash point every time.

**Launch it from a normal terminal (a regular PowerShell/Windows Terminal
window you open yourself, not through a coding agent), where this
restriction shouldn't apply.** If it still crashes there, that points to a
real host issue instead (worth checking Windows Update / GPU driver
updates, or trying the `iqra_legacy_api24` AVD to rule out an
API-36-image-specific problem) — open an issue with the full
`%TEMP%\AndroidEmulator\emu-crash-*.db` crash dump if so.

One other gotcha hit during setup: force-killing the emulator (Task
Manager, `Stop-Process -Force`, or an agent session ending mid-boot)
leaves `hardware-qemu.ini.lock`/`multiinstance.lock` behind in
`%USERPROFILE%\.android\avd\<name>.avd\`, which then makes the *next*
launch fail immediately with `Running multiple emulators with the same
AVD is an experimental feature`. Delete those two lock entries and
relaunch if you see that error — `stop-emulator.ps1`'s graceful `adb emu
kill` avoids this in normal use.

## Automated tests

`flutter test` (from `apps/mobile/android`; CI runs it after `flutter analyze`)
currently passes 156 tests (1 skipped). Layout: `test/core/` (Tajweed parser,
bottom nav), `test/features/{bookmarks,home,quran_reader,search,settings}`,
`test/e2e/remote_publish_flow_test.dart` (skipped unless `DUAS_E2E_URL` is set;
it runs against the local Learning API — in `apps/learning` run
`npm run db:migrate:local`, load Duas content, `npm run seed:admins`,
`npm run dev:api`, then from here
`DUAS_E2E_URL=http://localhost:8787/learning/api DUAS_E2E_ADMIN_USER=admin DUAS_E2E_ADMIN_PASSWORD=<ADMIN_PASSWORD> flutter test test/e2e/remote_publish_flow_test.dart`),
`test/test_helpers/hive_test_env.dart`
(temp-dir Hive setup shared by tests that touch storage), and
`test/features/supplications/` for Duas:
- `data/` — bundled asset parses/validates (`bundled_asset_test.dart`, runs
  against the real `assets/supplications.json`), snapshot validation, local /
  remote (mocked dio adapter) / cache datasources, repository resolution
  order, favorites storage.
- `presentation/screens/dua_reading_screen_test.dart` — Arabic/transliteration/
  translation display order, repeat chip and tasbeeh badge, translation
  language and transliteration settings (incl. Urdu-missing fallback and
  persistence), favorite star.
- `presentation/widgets/tasbeeh_counter_badge_test.dart` — ring progress and
  animation, reset-after-target tap, long-press reset, plain tally mode.
- `presentation/screens/dua_font_size_layout_test.dart` — text-size control:
  no overflow at max (180%) on a 320px screen with raised system text scale
  against the real bundled content, category labels really scale, size
  survives leaving/re-entering a category, slider preview/persist, clamp to
  0.8–1.8 in 0.1 steps (`supplicationsFontScale`).

`test/_icon_preview/` holds two PNGs (`out_large_filled.png`,
`out_large_outline.png`) — leftover icon-preview output, not a test and not
referenced by any test code; it is currently untracked.

## Critical-flow manual checklist

Automated widget tests (see above) already cover a good
slice of this — this checklist is for manual sweeps on the emulator before
a release, focused on things that only show up on-device (audio playback,
real navigation transitions, actual layout at emulator screen sizes).

### Quran reading
- [ ] Home → open a Surah → text renders with Tajweed coloring
- [ ] Scroll through a full Surah — no dropped/duplicated ayahs at page
      boundaries
- [ ] Switch translation (Off / English / Roman Urdu) — updates without a
      restart
- [ ] Switch theme (Light / TrueBlack-Dark / Sepia) — reader + chrome both
      update

### Navigation
- [ ] All five bottom-nav destinations reachable and highlight correctly
- [ ] Back button/gesture returns to the expected previous screen (not out
      of the app) from at least two levels deep
- [ ] Deep entry points (Continue Reading card, Last Reads row, Quick
      Links) land on the correct Surah/ayah

### Audio (Listening Mode + per-ayah)
- [ ] Per-ayah audio plays and highlights the correct ayah
- [ ] Whole-Surah Listening Mode: play, pause, seek, Next/Previous
      Surah from the lock-screen notification, and the loading/error
      (retry) states on a slow or offline connection
- [ ] Backgrounding the app (Home button) and returning: playback state
      (playing/paused, position) survives correctly
- [ ] Switching Arabic/Urdu audio source mid-playback behaves sanely (no
      overlapping tracks, no stuck loading state)

### Duas
- [ ] Duas tab: categories show as grid and as list (toggle persists
      across restart); category/dua content loads offline (cached or
      bundled) with airplane mode on
- [ ] Reading screen: swipe between duas, jump sheet, favorite star (appears
      in Favorites), share sheet
- [ ] Reading settings: translation language (English/Urdu), transliteration
      on/off and script, tasbeeh counter on/off all take effect immediately
- [ ] Tasbeeh counter: with a repeat-count dua the ring fills per tap, the
      tap after the target resets, long-press resets mid-way; a dua with no
      count shows a plain tally; the count is not kept after swiping to
      another dua
- [ ] Text size (app-bar `text_fields` icon on the categories screen and the
      reading settings sheet): Arabic/transliteration/translation and the
      category tile/row labels all grow/shrink, no clipped text at the
      largest size, setting persists across restart
- [ ] Switch UI language en/ur/te: Duas strings (incl. text-size sheet)
      translate

### Settings
- [ ] Reader settings sheet opens, all sections listed, each control
      actually changes reader behavior
- [ ] Language switch (the app supports English/Telugu/Urdu UI strings —
      see `lib/l10n/`) updates UI strings without restart
- [ ] Settings persist across an app restart (Hive-backed local storage)

Run this on **both** AVDs at least once before a release build — the
`iqra_legacy_api24` pass is what catches API-24-only or small-screen-only
regressions the primary profile won't.
