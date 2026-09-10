# IqraSpace Quran — Flutter reader

A **fully independent** Flutter app, isolated from `apps/quran` (the
existing Next.js/Capacitor reader). Separate codebase, separate data
source, separate scope: this app is Tajweed-focused colored reading;
`apps/quran` covers API-rendered text plus a scanned-PDF reading mode and
deliberately has no Tajweed scope. Neither app depends on the other, and
neither app's CI, directory tree, or docs need to change for this one to
exist.

## Decisions on record

- **applicationId**: `org.iqraspace.mobile` — distinct from
  `apps/quran`'s Capacitor Android `appId` (`org.iqraspace.quran`) so the
  two never look like the same app in a store listing side-by-side. Like
  any Android `applicationId`, treat this as effectively permanent once
  published.
- **Platforms**: Android + Web only for now, matching this branch's
  (`mobile/android`) Android-only discipline. iOS can be added later with
  `flutter create --platforms ios .` — a low-cost addition, not a rewrite.
- **Data source**: [Al Quran Cloud](https://alquran.cloud) (`quran-tajweed`
  edition), not the Quran Foundation Content API `apps/quran` uses — that
  API needs a confidential OAuth2 client secret held server-side, which a
  Flutter mobile/web client can't safely hold. Al Quran Cloud is public
  and needs no auth.
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
- **No codegen** in this first pass: no `build_runner`, `freezed`,
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

## Scope of this pass (first vertical slice)

Built and working end-to-end: fetch Surah 1 (Al-Fatiha) from Al Quran
Cloud's `quran-tajweed` edition, parse the Tajweed markup into typed
spans once at fetch time, cache in Hive, render with colored Tajweed
spans in `AyahRichText`, with a working Light / True Black Dark / Sepia
toggle and a font-size control.

**Verified, not just built** (Flutter 3.47.3, 2026-09-10): `flutter pub
get`, `flutter analyze` (clean), `flutter test` (all passing, including
a real-API fixture for the parser), `flutter build web`, and a visual
check in Chrome — Al-Fatiha's 7 ayat render with correctly shaped Uthmani
script and visibly distinct Tajweed colors (grey hamzat-wasl/lam-
shamsiyyah, blue/purple madd variants) on real, live API data.

**Explicitly deferred** — do not expect these yet:
- Bookmarks, Settings screen, Search (see the `NOTE.md` in each
  `lib/features/*` placeholder directory)
- Zen mode (hiding the AppBar/chrome)
- `deferred as` imports for web bundle-splitting
- A custom PWA service worker layered on Flutter's generated one
- Per-Juz font subsetting (this pass ships one full font file)
- Any surah beyond Al-Fatiha, or a surah list/navigation screen

## Commands

Run from this directory (`apps/flutter`):

```bash
flutter pub get              # resolve dependencies
flutter analyze              # static analysis (what CI gates on)
flutter test                 # unit tests
flutter run -d chrome        # run on web, for local iteration
flutter build web            # production web build
flutter build apk --debug    # debug APK (no signing set up yet)
```

The `AmiriQuran.ttf` font file is already in place at `assets/fonts/`.

**Web renderer note (resolved)**: this app was originally designed
assuming `flutter build web --web-renderer html` (smaller bundle, real
DOM text nodes for selection/accessibility — good for a text-heavy
reader). **Confirmed on the installed Flutter 3.47.3: that flag no
longer exists** (`flutter build web -h` has no `--web-renderer` option at
all) — Flutter web has consolidated on CanvasKit, with an optional
`--wasm` flag to compile to WebAssembly instead of JS. Practical effect:
web builds render text to canvas rather than as DOM text nodes, so native
text selection/copy and the smaller-bundle rationale from the original
blueprint no longer apply as designed. Nothing to do differently for this
first slice (`flutter build web` with no renderer flag is now simply the
only option), but if native text selection on web becomes a requirement
later, that needs a different approach (e.g. a parallel `SelectableText`-
based render path) rather than a build flag.

## If the Next.js dev server (apps/quran) feels slow after this

It shouldn't — `apps/flutter` is a sibling directory, not nested inside
`apps/quran`, so Next's file watcher has no reason to touch it. If you do
ever nest Flutter build artifacts near a Next.js app in the future,
watch out for `.dart_tool/`/`build/`/`android/.gradle` slowing down that
app's dev-server file watching.
