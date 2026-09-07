# Mobile (Android first) — IqraSpace Quran

Companion to the mobile deployment plan agreed separately (Capacitor over a Flutter/React Native rewrite — see that plan's §1 for the comparison). This file documents what's actually built and what's still owner-only. Same "decision, alternatives, reason" discipline as `ARCHITECTURE.md`.

## 0. Branch strategy — Android first, deliberately

All mobile work lives on the **`mobile/android`** branch, not `main` — decided so mobile development can iterate without touching the stable, already-deployed web app, and so it's trivial to see (and if needed, discard) everything mobile-related as one diff against `main`.

**Scope of this branch: Android only.** No `@capacitor/ios` dependency, no `ios/` project, no iOS-specific code anywhere in this branch — deliberate, not an oversight:

- Complete, test, and stabilize Android first; only once that's real and working does iOS work begin.
- iOS gets its **own branch** (`mobile/ios`, branched from `mobile/android` once Android is stable) when that phase starts — at which point it's one command to add back (`npm i @capacitor/ios && npx cap add ios`), not a redesign. `capacitor.config.ts` and `next.config.ts`'s `CAPACITOR_BUILD` flag are both already platform-agnostic for exactly this reason.
- `main` stays exactly as it is today (the deployed `iqraspace.org/quran` web app) until Android is merged back, reviewed as its own decision then — not implied by this branch existing.

## 1. What this is

`apps/quran` is wrapped, not rewritten: [Capacitor](https://capacitorjs.com) packages the same Next.js app's static output into a real Android app. One codebase, one `src/`, one CI pipeline for lint/typecheck — the native `android/` folder is thin, mostly Capacitor-managed project scaffolding, not a second implementation.

## 2. Why this app can export at all

Capacitor needs a static bundle it can embed in the app (`webDir`). `output: "export"` (Next's static-export mode) only works when every route resolves without a server — true here already, checked directly, not assumed:

- Every dynamic segment (`/surah/[surahNumber]`, `/page/[pageNumber]`) already has `generateStaticParams` (Phase 1's SSG design, `ARCHITECTURE.md` §3) — nothing needs on-demand server rendering.
- No `middleware.ts`, no `app/api/**` route handlers, no server actions anywhere in this app.
- The three `next/og`-generated routes (`icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`) and the two metadata routes (`manifest.ts`, `sitemap.ts`) needed one line each — `export const dynamic = "force-static"` — to tell Next they have no request-time dependency (they don't: fixed size, fixed content). This is a no-op for the regular Vercel build; those routes were already effectively static.

## 3. What was added

| File | Purpose |
|---|---|
| `next.config.ts` | A `CAPACITOR_BUILD=1` env var (only set by `npm run build:mobile`) turns on `output: "export"`, `images.unoptimized`, and `trailingSlash: true` — and turns *off* the `headers()` config (meaningless for a bundle with no server). The regular `npm run build` / Vercel deploy is untouched: the env var is never set there. Platform-agnostic — nothing here is Android-specific, so iOS needs no config changes later. |
| `capacitor.config.ts` | `appId: "org.iqraspace.quran"`, `appName: "IqraSpace Quran"`, `webDir: "out"`, `androidScheme: "https"`. |
| `android/` | Capacitor-generated native project (`npx cap add android`) — committed, per Capacitor's own convention (unlike React Native, this isn't meant to be regenerated from scratch each time; you *do* hand-edit things like permissions in it occasionally). Has its own `.gitignore` (Capacitor-authored) excluding build output, `local.properties`, etc. |
| `assets/`, `scripts/branding/generate-mobile-assets.mjs` | Real app icon (1024×1024) and splash screens (light + dark, 2732×2732), cropped from the existing brand logo using the *same* crop box `src/lib/branding/logo.ts` already uses for the favicon — so the app icon is the same mark, not a separately hand-picked image. Platform-agnostic source assets — the same files will feed the iOS icon set later too. |
| `scripts/branding/cleanup-unused-asset-outputs.mjs` | `@capacitor/assets generate` (run via `npm run assets:mobile`) always also writes a generic PWA icon set + `public/manifest.webmanifest`, with no flag to skip it — both unused here (this app's PWA manifest is already the dynamic `src/app/manifest.ts` route). This script deletes both right after generation. |
| `eslint.config.mjs` | Added `android/**` to the ignore list — otherwise ESLint tries to parse the copied static bundle inside it (`android/app/src/main/assets/public`) as source (same problem `src/content/generated/**` already had). |

### Why `trailingSlash: true` only for the mobile build

Static export without it writes `surah/2.html` (a flat file) — fine for a static host that infers the `.html` extension from a clean URL request, but Capacitor's bundled local web server resolves an exact path, so a `<Link href="/surah/2">` click would 404 inside the app. With it on, export writes `surah/2/index.html` *and* every generated link gains the matching trailing slash automatically — verified directly (`grep`'d the built output), not assumed. The regular web build keeps `trailingSlash` unset, so `iqraspace.org/quran/surah/2` (no trailing slash) is untouched.

## 4. Local workflow

```bash
git checkout mobile/android
cd apps/quran
npm install               # picks up @capacitor/android + @capacitor/core + cli
npm run build:mobile      # static export → out/
npm run cap:sync          # build:mobile, then copies out/ into the android/ project
npm run cap:open:android  # opens android/ in Android Studio (needs Android Studio installed)
```

`npm run cap:sync` is the one command to run after any app change before testing on a device/emulator — it is not automatic on every `npm run dev`, deliberately: native testing is a distinct, occasional step, not part of the inner dev loop (which stays the existing `npm run dev` on `localhost:3001`, unchanged, and works identically on `main` and this branch).

**Live-reload during development** (optional, not configured by default): point `capacitor.config.ts`'s `server.url` at your machine's LAN IP + dev port (`http://192.168.x.x:3001`) to load the live dev server instead of the last synced static build — revert before syncing a real build, since a hardcoded LAN IP obviously can't ship.

## 5. What could not be done in this environment

This pass ran on a Windows machine with no Android SDK/Android Studio installed — genuinely required to *build and run* the app, not just to scaffold it:

- `npx cap add android` succeeded fully (native project, plugin wiring, Gradle files).
- Actually compiling an `.apk` needs Android Studio (or a CI Android image, e.g. a GitHub Actions `ubuntu-latest` runner with the Android SDK action) — neither is available here. See §6.

## 6. What's still owner-only (Android path)

Nothing below can be done from inside a coding session — each needs a real account/credential under your own identity:

1. **Google Play Console** account ($25 one-time) — see the deployment plan's §5 for the full store process.
2. **First real build.** Either open `android/` in Android Studio and build directly, or set up a CI mobile lane (a GitHub Actions `ubuntu-latest` runner can build/sign an Android release — no macOS runner needed for Android). No workflow file for this exists yet; add one once you've decided, scoped to `apps/quran/**` like `ci-quran.yml` already is for the web build, and to the `mobile/android` branch.
3. **Push notifications**: add `@capacitor/push-notifications` + a Firebase project (FCM) — not added yet, this is later Phase 4 scope per the deployment plan's roadmap.
4. **Store listing assets**: screenshots, description, privacy policy page (the web app doesn't have one yet either — see `PRODUCT-ROADMAP.md` Phase 9), content rating questionnaire.
5. **Re-run `npm run assets:mobile`** if `public/brand/logo.png` is ever replaced, so the app icon stays in sync with the web favicon.
6. **Decide when Android is "done"** (test/stabilize/release per the priority order agreed) before opening the `mobile/ios` branch — this file's §0 is the trigger point for that, not a fixed date.

## 7. Things that are effectively permanent once published

Change these before your first real store submission, not after — the store treats them as close to immutable in practice:

- `capacitor.config.ts`'s `appId` (`org.iqraspace.quran`) — changing it after publishing creates a *new* listing, not an update to the existing one.
- Android's upload keystore (generated the first time you build a signed release) — losing it means losing the ability to update the app under the same listing (Google Play App Signing mitigates this if enrolled, but the *upload* key itself still needs safekeeping).
