# IqraSpace Quran — Flutter reader

A **fully independent** Flutter app (Dart package `quran_flutter`, currently
version `0.3.0+19` in `pubspec.yaml`), isolated from `apps/quran` (the
Next.js web reader). Separate codebase, separate data
source, separate scope: this app is Tajweed-focused colored reading;
`apps/quran` covers API-rendered text plus a scanned-PDF reading mode and
deliberately has no Tajweed scope. Neither app depends on the other, and
neither app's CI, directory tree, or docs need to change for this one to
exist.

## Decisions on record

- **applicationId**: `org.iqraspace.app` — matches the Play Console app
  listing, which was created with this package name (package names can't
  be changed in Play Console after app creation). Was `org.iqraspace.mobile`
  until 2026-09-11; changed before any release was ever uploaded, so no
  live listing was affected. Distinct from `apps/quran`'s Capacitor
  Android `appId` (`org.iqraspace.quran`) so the two never look like the
  same app in a store listing side-by-side. Like any Android
  `applicationId`, treat this as effectively permanent now that it
  matches a real listing.
- **Platforms**: Android + Web only for now, matching this branch's
  (`mobile/android`) Android-only discipline. iOS can be added later with
  `flutter create --platforms ios .` — a low-cost addition, not a rewrite.
- **Data source**: [Al Quran Cloud](https://alquran.cloud) (`quran-tajweed`
  edition), not the Quran Foundation Content API `apps/quran` uses — that
  API needs a confidential OAuth2 client secret held server-side, which a
  Flutter mobile/web client can't safely hold. Al Quran Cloud is public
  and needs no auth. The public Quran.com API supplies the Roman Urdu and Telugu
  translations (secondary; failure never blocks a surah load —
  `lib/core/network/dio_client.dart` holds both clients). Two other
  remote dependencies, both optional/degradable: Listening Mode's
  whole-Surah audio on Cloudflare R2 (see [AUDIO.md](AUDIO.md)) and the
  Duas content (below).
- **Tajweed markup format (corrected after live verification)**: the raw
  API does **not** return `<tajweed class="...">` HTML — that assumption
  in this app's first draft was wrong and produced garbled bracket
  fragments (`[ل]h:3]`) on screen instead of Arabic text. The real format
  is a compact bracket notation, e.g. `بِسْمِ [h:1[ٱ]للَّهِ` — confirmed
  directly against `api.alquran.cloud/v1/surah/1/quran-tajweed` and
  cross-checked against the `alquran-tools` PHP library
  (github.com/islamic-network/alquran-tools,
  `src/AlQuranCloud/Tools/Parser/Tajweed.php`) that Al Quran Cloud's own
  developer guide (alquran.cloud/tajweed-guide) cites for turning this
  exact markup into colored HTML. `TajweedParser` parses the bracket
  form directly; `lib/core/theme/tajweed_rule_colors.dart` documents the
  full code -> rule -> color table sourced from that library.
- **Font**: Amiri Quran (SIL OFL 1.1), the Uthmani-script cut of Amiri by
  Khaled Hosny (github.com/aliftype/amiri) — bundled at
  `assets/fonts/AmiriQuran.ttf`, license text at `assets/fonts/OFL.txt`.
  See `assets/fonts/NOTE.md` for what else is in that folder (extra Amiri
  weights, a colored variant) and why they aren't wired up yet.
- **No codegen** for models/state: no `build_runner`, `freezed`,
  `json_serializable`, or `hive_generator`. Hand-written `fromJson`/
  `toJson`, plain Riverpod `Provider`/`StateNotifierProvider`, and a
  `Box<String>` holding JSON-encoded cache entries instead of a Hive
  `TypeAdapter`. Revisit only if a second data model makes hand-writing
  these repetitive.
- **State management**: Riverpod (`flutter_riverpod`).
- **Storage**: Hive as the single storage abstraction across mobile and
  web (it has an IndexedDB-backed web implementation) — see
  `lib/core/storage/hive_boxes.dart`, the only file that branches on
  `kIsWeb`.

## Features (current)

- **Quran reading** — all 114 surahs from Al Quran Cloud's `quran-tajweed`
  edition, Tajweed markup parsed once at fetch time into typed spans and
  cached in Hive (offline-first). Surah list, Tajweed rules screen,
  per-ayah deep links (search/bookmarks), Light / True Black Dark / Sepia
  themes, font-size control, selectable Arabic fonts
  (`lib/core/theme/arabic_fonts.dart`), Quran translation
  (Off / English / Roman Urdu / Urdu / Telugu).
- **Reader modes** — Listening, Reading, Reading + Listening
  (`lib/core/constants/reader_mode.dart`). Reading + Listening plays
  per-ayah audio (five reciters) with ayah highlighting. **Listening
  Mode** plays whole-Surah Al-Afasy recitation or the Arabic + Urdu
  translation recording from Cloudflare R2, cached on device, with
  lock-screen/background controls (Android) — see [AUDIO.md](AUDIO.md).
- **Search, Bookmarks, Home** (Continue Reading, Last Reads, Quick
  Links), **Settings** (reader/audio settings sheets, UI language
  English / Urdu / Telugu, in-app User Guide, About).
- **Duas / Supplications** (`lib/features/supplications`, bottom-nav
  "Duas"):
  - *Content*: a published, curated Duas dataset (30 categories / 117
    duas in the bundled copy). Resolution order is remote -> last good
    Hive cache -> bundled `assets/supplications.json`,
    stale-while-revalidate: screens render cached/bundled content
    immediately, a validated newer remote snapshot (checked at most
    hourly) refreshes them in place. Remote is the published Learning
    Dua data via the Learning API's public read-only feed
    (`GET {DUAS_API_URL}/duas/version` and `/duas/content`, plain `dio`,
    no key); production by default, overridable with
    `--dart-define=DUAS_API_URL` (an empty value makes the app purely
    offline; see [DEPLOYMENT.md](DEPLOYMENT.md)).
  - *Screens*: categories screen (grid or list, persisted), reading
    screen (swipe between duas, jump sheet, share, repeat-count chip,
    hadith reference/grade), favorites screen (positional keys in the
    `duas_favorites` box).
  - *Settings* (reading settings sheet, Hive `reader_settings` box):
    translation language (English / Urdu, independent of the app
    language; English fallback with a note if Urdu is missing),
    transliteration on/off and script (Latin / Telugu / Urdu), tasbeeh
    counter on/off (default off), and text size.
  - *Tasbeeh counter badge* (`tasbeeh_counter_badge.dart`, enabled via a
    setting): when the dua has a repeat count it is a circular button
    whose ring fills as progress (`n/target`); tap to count, once the
    target is reached the next tap resets, long-press resets at any
    time. With no target it is a plain tally pill (tap increments,
    long-press resets). Ephemeral — never persisted, resets on every
    dua change.
  - *Text size*: one persisted multiplier, `duaFontScaleProvider`
    (Hive key `supplicationsFontScale`, 0.8–1.8 in 0.1 steps, default
    1.0), applied to the reading screen (Arabic, transliteration,
    translation, meta) and to category tile/row labels. Reachable from the
    categories screen's app-bar `text_fields` icon (a standalone sheet
    with live preview) and from the reading settings sheet
    (`dua_font_size_control.dart`).
- **Localization**: English, Urdu, Telugu UI strings
  (`lib/l10n/app_{en,ur,te}.arb`, generated `app_localizations*.dart`
  committed), including the `supplicationsFontSize*` strings.
  Duas-only fonts (Noto Naskh Arabic / Sans Telugu / Nastaliq Urdu) are
  bundled alongside the Amiri family.

**Still deferred / not built**: Zen mode (hiding the chrome), `deferred as`
imports for web bundle-splitting, a custom PWA service worker, per-Juz font
subsetting, iOS. Web builds work but the app is not deployed to web.

**Bundled assets** (`pubspec.yaml`): `assets/tajweed_rules_fallback.json`,
`assets/supplications.json` (offline Duas fallback, a snapshot of the
published Duas content),
`assets/branding/icon.png`, `assets/user_guide/` (screenshots), fonts.
Note: `assets/supplications_translated_ur_te.json` also sits in `assets/`
(currently untracked) but is **not** declared in `pubspec.yaml` or read by
any code, so it is not shipped in the app.

**Verified** (Flutter 3.47.3, 2026-10-05): `flutter test` — 156 passed,
1 skipped.

## Commands

Run from this directory (`apps/mobile/android`):

```bash
flutter pub get              # resolve dependencies
flutter analyze              # static analysis (what CI gates on)
flutter test                 # unit + widget tests (test/)
flutter run -d chrome        # run on web, for local iteration
flutter build web            # production web build
flutter build apk --debug    # debug APK
# Optional: point Duas at a local Learning Worker (default is production)
flutter run --dart-define=DUAS_API_URL=http://localhost:8787/learning/api
```

Release builds: see [DEPLOYMENT.md](DEPLOYMENT.md) (bump the `+N` build
number first). Regenerate l10n after editing `lib/l10n/*.arb` with
`flutter gen-l10n` (also runs on `flutter pub get`/build).

**Web renderer note (resolved)**: this app was originally designed
assuming `flutter build web --web-renderer html` (smaller bundle, real
DOM text nodes for selection/accessibility — good for a text-heavy
reader). **Confirmed on the installed Flutter 3.47.3: that flag no
longer exists** (`flutter build web -h` has no `--web-renderer` option at
all) — Flutter web has consolidated on CanvasKit, with an optional
`--wasm` flag to compile to WebAssembly instead of JS. Practical effect:
web builds render text to canvas rather than as DOM text nodes, so native
text selection/copy and the smaller-bundle rationale from the original
blueprint no longer apply as designed. Nothing to do differently (`flutter build web` with no renderer flag is now simply the
only option), but if native text selection on web becomes a requirement
later, that needs a different approach (e.g. a parallel `SelectableText`-
based render path) rather than a build flag.

## If the Next.js dev server (apps/quran) feels slow after this

It shouldn't — `apps/mobile/android` is a sibling directory, not nested inside
`apps/quran`, so Next's file watcher has no reason to touch it. If you do
ever nest Flutter build artifacts near a Next.js app in the future,
watch out for `.dart_tool/`/`build/`/`android/.gradle` slowing down that
app's dev-server file watching.
