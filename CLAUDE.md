# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

This is a monorepo of **four fully independent apps** under `apps/`, stitched together at the routing layer only. No shared package, no shared types, no shared UI library — each app has its own `package.json`, own git history within the tree, own Supabase project (where applicable), own Vercel project, own CI workflow. Before assuming two apps share anything, check — they almost never do.

| App | Stack | Purpose | Live at |
|---|---|---|---|
| `apps/learning` | Next.js 16 (App Router, TS, Tailwind) + Supabase | Quranic Teacher — tutoring LMS for a solo tutor and students (auth, lessons, PDF viewer, attendance, scheduling) | `iqraspace.org/learning` |
| `apps/quran` | Next.js 16 (App Router, TS, Tailwind) + Capacitor | IqraSpace Quran — free public, anonymous-first Quran reader (SSG, PWA, own Supabase project for bookmarks/progress only) | `iqraspace.org/quran`, and an Android app via Capacitor |
| `apps/flutter` | Flutter (Dart), Riverpod, Hive | IqraSpace Quran Flutter reader — Tajweed-colored reading, separate data source, Android + Web only. Isolated from `apps/quran` (different `applicationId`s: `org.iqraspace.app` vs `org.iqraspace.quran`, no shared code), except for one deliberate exception: Listening Mode's whole-Surah audio is hosted on its own **dedicated** Cloudflare R2 bucket (S3-compatible object storage, public via a custom subdomain, no DB/auth) — see `apps/flutter/AUDIO.md` | Android app (Play Console), not yet deployed to web |
| `apps/landing` | Static HTML, no framework/build step | Owns the `iqraspace.org` domain root; single page + Vercel `rewrites()` that proxy `/quran/*` and `/learning/*` to the other two apps' own Vercel deployments (Next.js Multi-Zones pattern) | `iqraspace.org` |

Root `package.json` only has a Supabase CLI devDependency (for `apps/learning`'s DB) and thin `--prefix` delegator scripts (`npm run dev`, `npm run quran:dev`, etc.) — there is no root build/test/lint that does anything real across apps. Always `cd` into (or `--prefix` into) the specific app you're working on.

Root-level docs worth reading before major architectural work: [`Iqra-space-architecture.md`](Iqra-space-architecture.md) (original `apps/learning` architecture) and [`DEPLOYMENT.md`](DEPLOYMENT.md) (full CI/CD + Vercel + Multi-Zones deployment writeup). `README.md` covers `apps/learning` setup and lists known deviations from the architecture doc.

## Commands

### apps/learning (tutoring LMS)
```bash
npm install --prefix apps/learning
npm run dev --prefix apps/learning        # http://localhost:3000
npm run --prefix apps/learning lint
npm run --prefix apps/learning typecheck  # needs `npx next typegen` first on a fresh checkout (see ci.yml)
npm run --prefix apps/learning build
```
Supabase: `npx supabase login && npx supabase link --project-ref <ref> && npx supabase db push` applies `supabase/migrations/*.sql` (repo root, not inside `apps/learning`).

### apps/quran (public Quran reader)
```bash
cd apps/quran
npm install
npm run dev          # http://localhost:3001 (deliberately not 3000 — see it runs alongside apps/learning)
npm run lint
npm run typecheck     # same next typegen caveat as above
npm run build
npm run cap:sync      # static export + copy into the Capacitor Android shell
npm run cap:open:android
```
This app has its own Supabase project and its own `supabase/migrations/` under `apps/quran/supabase/` — do not confuse with the root-level `supabase/` (that one belongs to `apps/learning`). Quran text/translations are synced content committed to the repo (`sync:content` script), not fetched live at request time — see `apps/quran/QURAN-CONTENT.md`.

### apps/flutter (Flutter reader)
```bash
cd apps/flutter
flutter pub get
flutter analyze      # what CI gates on
flutter test
flutter run -d chrome
flutter build web
flutter build apk --debug
```
Before any real release build (`flutter build appbundle --release` / `apk --release`) bump the `+N` build number in `pubspec.yaml`'s `version:` line — Play Console permanently rejects a reused `versionCode` even from a build that was never published. See `apps/flutter/CLAUDE.md` and `DEPLOYMENT.md` for the rest of the release checklist.

### apps/landing
No build tooling by design (single static HTML page). CI only validates the HTML and that `vercel.json` is valid JSON.

## CI/CD

Each app has its own path-filtered GitHub Actions workflow in `.github/workflows/` — a change to one app's files never triggers or blocks another's pipeline:
- `ci.yml` → `apps/learning` (validate on every push/PR to `main`; deploy to Vercel on push to `main`)
- `ci-quran.yml` → `apps/quran` web/Vercel pipeline (path-filtered to `apps/quran/**`, `main` only)
- `ci-quran-mobile.yml` → `apps/quran`'s Capacitor Android debug APK build (only on `mobile/android` branch, never `main`)
- `ci-flutter.yml` → `apps/flutter` (`flutter analyze`/`flutter test` only, only on `mobile/android` branch; no build-APK job yet)
- `ci-landing.yml` → `apps/landing`

Each Vercel deploy job uses that app's own dedicated secrets (e.g. `QURAN_VERCEL_*` vs. the default `VERCEL_*`) — never share secrets across apps. `apps/quran`'s deploy step deliberately uses `vercel deploy --prod` (remote build) rather than the local `vercel build` + `--prebuilt` flow `apps/learning` uses, because of a Next.js 16/Vercel CLI SSG lambda-tracing incompatibility — see the comment in `ci-quran.yml` before changing that.

## Architecture notes that span files

- **Multi-Zones routing**: `apps/quran` and `apps/learning` each run with `basePath` set (`/quran`, `/learning` respectively, via `NEXT_BASE_PATH`) and deploy as fully independent Vercel projects. `apps/landing`'s `vercel.json` `rewrites()` is the only thing that stitches them under one domain — routing changes to `/quran/*` or `/learning/*` almost always mean editing `apps/landing/vercel.json`, not the target app.
- **Why two separate Quran apps exist** (`apps/quran` and `apps/flutter`): different scope by design, not duplication. `apps/quran` does API-rendered text plus a scanned-PDF reading mode, no Tajweed coloring. `apps/flutter` is Tajweed-focused colored reading from a different data source (Al Quran Cloud, chosen because it needs no server-held OAuth secret, unlike the Quran Foundation Content API `apps/quran` uses). Neither app depends on the other or shares code.
- **`apps/learning` and `apps/quran` are deliberately unconnected products**: different audience (authenticated tutor/student vs. anonymous public reader), different Supabase projects, different privacy posture (minors' PII lives only in `apps/learning`'s DB). Do not introduce a shared dependency between them without a documented reason — see `apps/quran/ARCHITECTURE.md` §2.
- **`apps/learning` route structure**: `src/app/(public)` (`/`, `/login`, `/signup`) vs `src/app/(app)` (dashboard, classes, lessons, students, materials, schedule, attendance, progress, notes, meet, notifications, settings, `teach/[lessonId]`) plus a separate `share/[lessonId]` route. Components split into `ui/` (design-system primitives), `shell/` (Sidebar/Topbar/AppShell), `pdf/` (PdfViewer), `teach/` (TeachClient/ShareClient), `lessons/`.
- **`apps/quran` content pipeline**: Quran Foundation/Quran.com API content is synced at build/deploy time into committed static content (`scripts/sync-content.mjs`), then served via SSG/ISR — a request never blocks on a live third-party API call. Read `apps/quran/QURAN-CONTENT.md` before touching anything content-related (licensing/attribution requirements apply).
- **`apps/quran` is anonymous-first**: reading, search, audio, and theme/font preferences must not require sign-in; auth is only for syncing bookmarks/progress across devices. Don't gate core reading features behind auth.
- **Cost-consciousness is a hard constraint for `apps/quran`**: it's explicitly scoped as a free, low-cost/NGO-style project (see `apps/quran/COST.md`, `apps/quran/Readme.md` for the full brief). Avoid introducing paid infrastructure, and don't add third-party API dependencies for basic reading functionality — the resilience rule is "reading still works if audio/search/login/analytics are down."
- **`apps/flutter` isolation**: a sibling directory to `apps/quran`, not nested inside it — this matters for file-watcher performance during Next.js dev, and is why its build artifacts (`.dart_tool/`, `build/`, `android/.gradle`) should never be moved inside another app's tree.
- **`apps/flutter`'s one backend dependency**: Listening Mode's whole-Surah audio (Al-Afasy recitation, Urdu translation) is hosted on Cloudflare R2 — a **dedicated bucket**, unrelated to `apps/quran`'s Supabase project, specifically to avoid contradicting `apps/quran/COST.md`'s explicit rejection of self-hosting audio. `iqraspace.org`'s DNS already lives on Cloudflare (kept deliberately DNS-only/un-proxied for Vercel — see `apps/quran/DEPLOYMENT.md`); R2 is unrelated to that and doesn't change it. See `apps/flutter/AUDIO.md`.
- **`docs/`, `design/`, `resources/`** at repo root are gitignored on purpose (local working material, not app code) — don't expect them to exist on a fresh clone, and don't assume anything placed there will survive a commit.
- Per-app `CLAUDE.md`/`AGENTS.md` files exist (`apps/quran/CLAUDE.md`, `apps/quran/AGENTS.md`, `apps/flutter/CLAUDE.md`) — read the one for whichever app you're editing; this file only covers repo-wide/cross-app concerns.
