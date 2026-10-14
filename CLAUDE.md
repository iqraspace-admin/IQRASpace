# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

This is a monorepo of **four fully independent apps** under `apps/`, stitched together at the routing layer only (one Cloudflare zone, path routing). No shared package, no shared types, no shared UI library — each app has its own `package.json`, own git history within the tree, own Cloudflare Worker and bindings (web apps), own CI workflow. Before assuming two apps share anything, check — they almost never do.

| App | Stack | Purpose | Live at |
|---|---|---|---|
| `apps/learning` | Next.js 16 (App Router, TS, Tailwind) static export + Worker API (Cloudflare D1, R2, Durable Objects) — see `apps/learning/BACKEND.md` | Quranic Teacher — tutoring LMS for a solo tutor and students (username auth, lessons, PDF viewer, attendance, scheduling) plus an admin area incl. the **Duas admin** (`/admin/duas`) that publishes supplications to the site and the Flutter app | Cloudflare Worker `iqraspace-learning`, route `iqraspace.org/learning*` |
| `apps/quran` | Next.js 16 (App Router, TS, Tailwind), web-only (no Capacitor/Android shell) | IqraSpace Quran — free public, anonymous-first Quran reader (SSG, PWA; no backend) | Cloudflare Worker `iqraspace-quran`, route `iqraspace.org/quran*` |
| `apps/mobile/android` | Flutter (Dart), Riverpod, Hive | IqraSpace Quran Flutter reader — Tajweed-colored reading, separate data source, Android + Web only. Isolated from `apps/quran` (different `applicationId`s: `org.iqraspace.app` vs `org.iqraspace.quran`, no shared code), except for one deliberate exception: Listening Mode's whole-Surah audio is hosted on its own **dedicated** Cloudflare R2 bucket (S3-compatible object storage, public via a custom subdomain, no DB/auth) — see `apps/mobile/android/AUDIO.md` | Android app (Play Console), not yet deployed to web |
| `apps/site` | Static HTML pages, no framework, + a small Worker script (contact form into Cloudflare D1 with Turnstile; `GET /api/duas` feed of published Duas read from the Learning Worker via the `LEARNING` service binding) and a separate `www` → apex redirect Worker (`apps/site/www-redirect`) | Owns the `iqraspace.org` domain root; a multi-page marketing/info site (home, about, mission, explore, duas, quran-reader, mobile-app, get-involved, contact, faq, privacy, terms, 404). No proxying — other apps are separate Workers on more specific routes | Cloudflare Worker `iqraspace-site`, route `iqraspace.org/*` (`www` is handled by the separate `iqraspace-www-redirect` Worker) |

Root `package.json` only has thin `--prefix` delegator scripts (`npm run dev`, `npm run quran:dev`, `npm run learning:dev:api`, `npm run learning:test`, etc.) — there is no root build/test/lint that does anything real across apps. Always `cd` into (or `--prefix` into) the specific app you're working on.

Root-level docs worth reading before major architectural work: [`Iqra-space-architecture.md`](Iqra-space-architecture.md) (original `apps/learning` architecture, historical) and [`DEPLOYMENT.md`](DEPLOYMENT.md) (Cloudflare CI/CD, DNS/routes, databases, rollback, costs). `README.md` covers `apps/learning` setup and lists known deviations from the architecture doc; `apps/learning/BACKEND.md` is the authoritative description of its current backend.

## Commands

### apps/learning (tutoring LMS)
```bash
npm install --prefix apps/learning
npm run --prefix apps/learning db:migrate:local  # apply d1/migrations to the local D1 (.wrangler/state)
npm run --prefix apps/learning seed:admins       # admin + superadmin from .env.local (local D1; `-- --remote` for production)
npm run --prefix apps/learning dev:api    # Worker API (wrangler dev) on http://localhost:8787/learning/api
npm run dev --prefix apps/learning        # UI on http://localhost:3000 (NEXT_PUBLIC_API_URL=http://localhost:8787/learning/api in .env.local)
npm run --prefix apps/learning lint
npm run --prefix apps/learning typecheck  # needs `npx next typegen` first on a fresh checkout (see ci.yml)
npm run --prefix apps/learning test:duas  # Duas validation tests (CI runs it)
npm run --prefix apps/learning test:worker # routing + API tests (policies, query compiler, hooks, RPCs, auth) against node:sqlite (CI runs it)
npm run --prefix apps/learning build:cf   # Cloudflare build (what CI runs)
```
D1 schema lives in `apps/learning/d1/migrations/`; production migrations are applied manually by the owner (`npx wrangler d1 migrations apply iqraspace-learning --remote`) — CI never applies them. A schema change also needs the matching `worker/api/schema.js` entry (and a `policies.js` rule for a new table). See `apps/learning/BACKEND.md`. `scripts/migrate-from-supabase.mjs` and the `migrate:*` scripts exist only for the one-time data cutover described there ("Cutover from Supabase") and are deleted afterwards — don't build on them.

### apps/quran (public Quran reader)
```bash
cd apps/quran
npm install
npm run dev          # http://localhost:3001 (deliberately not 3000 — see it runs alongside apps/learning)
npm run lint
npm run typecheck     # same next typegen caveat as above
npm run build
npm run build:cf       # Cloudflare Worker build -> ./dist (what CI runs)
# deploy is CI-only (wrangler via GitHub Actions) — never run `wrangler deploy` locally
```
`apps/quran` has no backend or database. Quran text/translations are synced content committed to the repo (`sync:content` script), not fetched live at request time — see `apps/quran/QURAN-CONTENT.md`.

### apps/mobile/android (Flutter reader)
```bash
cd apps/mobile/android
flutter pub get
flutter analyze      # what CI gates on
flutter test
flutter run -d chrome
flutter build web
flutter build apk --debug
```
Before any real release build (`flutter build appbundle --release` / `apk --release`) bump the `+N` build number in `pubspec.yaml`'s `version:` line — Play Console permanently rejects a reused `versionCode` even from a build that was never published. See `apps/mobile/android/CLAUDE.md` and `DEPLOYMENT.md` for the rest of the release checklist.

### apps/site
The pages themselves have no framework by design (hand-authored static HTML sharing `styles.css`/`site.js`); `npm run build:cf` assembles `./dist`. The `/contact` form is handled by the Worker script (validates, Turnstile check, stores to Cloudflare D1, optional Resend alert email). "Managing" messages means querying D1 (wrangler/dashboard). See `apps/site/ADMIN.md` for the owner-only one-time setup (D1 create/migrate, Worker secrets).

## CI/CD

Each app has its own path-filtered GitHub Actions workflow in `.github/workflows/` — a change to one app's files never triggers or blocks another's pipeline:
- `ci.yml` → `apps/learning` (validate on PR/push to `main` — lint, typecheck, `test:duas`, `test:worker`, `build:cf`; path-filtered to `apps/learning/**`; deploy on push to `main`, health check includes `/learning/api/duas/version`; never applies D1 migrations)
- `ci-quran.yml` → `apps/quran` (path-filtered to `apps/quran/**`; deploy on push to `main`)
- `sync-quran-content.yml` → weekly Quran content re-sync PR (branch `chore/quran-content-sync`; licence needs ≤7-day re-sync; gated by variable `QURAN_SYNC_ENABLED`)
- `ci-flutter.yml` → `apps/mobile/android` (`flutter analyze`/`flutter test` only, only on `mobile/android` branch; no build-APK job yet)
- `ci-site.yml` → `apps/site`

Web deploys run `npm run build:cf` then `wrangler deploy` (Learning and Quran call `npx wrangler deploy` after a credential preflight, `.github/scripts/cf-preflight.sh`; the site uses `cloudflare/wrangler-action@v3`) using repo secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` (the token needs D1 Edit and Workers R2 Storage Edit for the Learning Worker's bindings), and only when repository variable `CF_DEPLOY_ENABLED == 'true'`. A post-deploy health check hits `CF_HEALTHCHECK_BASE` (default `https://iqraspace.org`). Deploys are CI-only — never run `wrangler deploy` from a session. See `DEPLOYMENT.md` for secrets/variables, DNS/routes and rollback.

## Architecture notes that span files

- **Path routing on one Cloudflare zone**: three independent Workers (`iqraspace-site`, `iqraspace-quran`, `iqraspace-learning`); the most specific route wins (`/quran*`, `/learning*`, else the site). `apps/quran` and `apps/learning` run with a `basePath` (`/quran`, `/learning`). Routing changes mean editing the relevant app's `wrangler.jsonc` `routes`; there are no rewrites/proxies.
- **Why two separate Quran apps exist** (`apps/quran` and `apps/mobile/android`): different scope by design, not duplication. `apps/quran` does API-rendered text plus a scanned-PDF reading mode, no Tajweed coloring. `apps/mobile/android` is Tajweed-focused colored reading from a different data source (Al Quran Cloud, chosen because it needs no server-held OAuth secret, unlike the Quran Foundation Content API `apps/quran` uses). Neither app depends on the other or shares code.
- **Duas data flow (the one cross-app runtime link):** Dua content lives in `apps/learning`'s D1 database, is edited/published in `/learning/admin/duas` (admin/super_admin only), and is read — published rows in active categories only, via the public feed `GET /learning/api/duas/content` / `/duas/version` (`apps/learning/worker/api/duas.js`) — by `apps/site` (`GET /api/duas` through the `LEARNING` service binding, fallback var `DUAS_SOURCE_URL`, edge-cached 60 s, powers the `/duas` page; no secrets) and by the Flutter app (`--dart-define=DUAS_API_URL=https://iqraspace.org/learning/api`, no key; remote fetch + Hive cache + bundled fallback). Deploy the Learning Worker before a site deploy that relies on the binding. See `apps/site/DUAS.md`. `apps/quran` no longer has a Supplications feature.
- **`apps/learning` and `apps/quran` are deliberately unconnected products**: different audience (authenticated tutor/student vs. anonymous public reader), no shared backend (`apps/quran` has none), different privacy posture (minors' PII lives only in `apps/learning`'s D1 database). Do not introduce a shared dependency between them without a documented reason — see `apps/quran/ARCHITECTURE.md` §2.
- **`apps/learning` route structure**: `src/app/(public)` (`/`, `/login`, `/signup`) vs `src/app/(app)` (dashboard, classes, lessons, students, materials, schedule, attendance, progress, notes, meet, notifications, settings, `teach/[lessonId]`) plus an admin-only `admin/` group (`/admin` dashboard, `/admin/users`, `/admin/duas/**`) and a separate `share/[lessonId]` route. `apps/learning`'s UI is a static export (no Next.js server, middleware or API routes); its dynamic routes use one placeholder shell served by the Worker (`worker/routes.js`, `run_worker_first` in `wrangler.jsonc`). The same Worker serves the backend at `/learning/api/*` (`worker/api/`: D1 binding `DB`, R2 binding `MATERIALS` for lesson PDFs, Durable Object `LessonRoom`/`LESSON_ROOMS` for live Teach→Share sync; username + PBKDF2 password auth with bearer-token sessions in D1; no secrets, only bindings). D1 has no row-level security, so the Worker is the only enforcement: `worker/api/schema.js` (table/column whitelist), `policies.js` (per-table rules), `query.js` (compiler that ANDs policies into every statement), `hooks.js` (former triggers/audit log). The browser client is `src/lib/db.ts`. See `apps/learning/BACKEND.md`. Components split into `ui/` (design-system primitives), `shell/` (Sidebar/Topbar/AppShell), `pdf/` (PdfViewer), `teach/` (TeachClient/ShareClient), `lessons/`.
- **`apps/quran` content pipeline**: Quran Foundation/Quran.com API content is synced at build/deploy time into committed static content (`scripts/sync-content.mjs`), then served via SSG/ISR — a request never blocks on a live third-party API call. Read `apps/quran/QURAN-CONTENT.md` before touching anything content-related (licensing/attribution requirements apply).
- **`apps/quran` is anonymous-first**: reading, search, audio, and theme/font preferences must not require sign-in; auth is only for syncing bookmarks/progress across devices. Don't gate core reading features behind auth.
- **Cost-consciousness is a hard constraint for `apps/quran`**: it's explicitly scoped as a free, low-cost/NGO-style project (see `apps/quran/COST.md`, `apps/quran/Readme.md` for the full brief). Avoid introducing paid infrastructure, and don't add third-party API dependencies for basic reading functionality — the resilience rule is "reading still works if audio/search/login/analytics are down."
- **`apps/mobile/android` isolation**: a sibling directory to `apps/quran`, not nested inside it — this matters for file-watcher performance during Next.js dev, and is why its build artifacts (`.dart_tool/`, `build/`, `android/.gradle`) should never be moved inside another app's tree.
- **`apps/mobile/android`'s one backend dependency**: Listening Mode's whole-Surah audio (Al-Afasy recitation, Urdu translation) is hosted on Cloudflare R2 — a **dedicated bucket**, unrelated to any web app, specifically to avoid contradicting `apps/quran/COST.md`'s explicit rejection of self-hosting audio. See `apps/mobile/android/AUDIO.md`.
- **`docs/`, `design/`, `resources/`** at repo root are gitignored on purpose (local working material, not app code) — don't expect them to exist on a fresh clone, and don't assume anything placed there will survive a commit.
- Per-app `CLAUDE.md`/`AGENTS.md` files exist (`apps/quran/CLAUDE.md`, `apps/quran/AGENTS.md`, `apps/mobile/android/CLAUDE.md`) — read the one for whichever app you're editing; this file only covers repo-wide/cross-app concerns.
