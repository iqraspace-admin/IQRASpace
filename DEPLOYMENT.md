# IqraSpace — Deployment (Cloudflare)

Status: **live on Cloudflare Workers since 3 Oct 2026.** `iqraspace.org`, `/quran` and `/learning` are served by Cloudflare (DNS `@`/`www` are proxied to the placeholder `192.0.2.1`; the Worker routes answer first). All web apps run on Cloudflare only (Workers, D1, R2, Durable Objects). CI deploys are gated by `CF_DEPLOY_ENABLED` and still need token fixes (see the CI notes); production was deployed manually with `wrangler`. Per-app details live in each app's own docs (`apps/<app>/`); this file covers the repo-wide picture.

## Architecture

Three independent Cloudflare Workers (Workers Static Assets), one per app, on one Cloudflare zone (`iqraspace.org`), plus a small fourth redirect Worker for `www`. Each app has its own `wrangler.jsonc`, is built with `npm run build:cf` (inside the app dir, output `./dist`) and deployed with `npx wrangler deploy` (inside the app dir).

| App | Worker | Route(s) | Backend |
|---|---|---|---|
| `apps/site` | `iqraspace-site` | `iqraspace.org/*` (fallback for everything not matched below) | D1 binding `DB` (contact form); secrets `TURNSTILE_SECRET_KEY`, optional `RESEND_API_KEY`, `CONTACT_ALERT_EMAIL`, `CONTACT_FROM_EMAIL`. The Worker runs only for `/api/*`: `POST /api/contact` and `GET /api/duas` (the published Duas feed, read from the Learning Worker's `/learning/api/duas/content` through the service binding `LEARNING`, var `DUAS_SOURCE_URL` as fallback; edge-cached 60 s; no secret — see `apps/site/DUAS.md`) |
| `apps/site/www-redirect` | `iqraspace-www-redirect` | `www.iqraspace.org/*` | none; 301 to the apex, path and query preserved. Deployed by hand (`cd apps/site/www-redirect && npx wrangler deploy`); CI does not deploy it |
| `apps/quran` | `iqraspace-quran` | `iqraspace.org/quran*` | none required (static, synced content) |
| `apps/learning` | `iqraspace-learning` | `iqraspace.org/learning*` The Worker's own API at `/learning/api/*` (`worker/api/`): D1 database `iqraspace-learning` (binding `DB`), R2 bucket `iqraspace-learning` (binding `MATERIALS`, lesson PDFs), Durable Object `LessonRoom` (binding `LESSON_ROOMS`, live Teach → Share sync). No secrets, only bindings. UI is a static export (`output: "export"`, `basePath` `/learning`); the Worker script runs only for `/learning/api/*` and dynamic-route URLs (`/learning/share/*`, `/learning/teach/*`, `/learning/admin/duas/<id>`, `.../categories/<slug>`; see `run_worker_first` in `apps/learning/wrangler.jsonc`), for which it serves a placeholder HTML shell. See `apps/learning/BACKEND.md` |

**Path routing on one zone:** Cloudflare picks the most specific route, so `/quran*` and `/learning*` go to their Workers and everything else falls to `iqraspace-site`. There is no proxying and no Multi-Zones `rewrites()` any more. Routing changes are edits to the relevant app's `wrangler.jsonc` `routes`.

`apps/mobile/android` (Flutter) is not part of this web pipeline; its audio lives in a dedicated Cloudflare R2 bucket (`apps/mobile/android/AUDIO.md`).

## CI/CD

```text
push / PR touching apps/<app>/**  (path-filtered, one workflow per app)
        ↓
validate: npm ci, lint, next typegen, typecheck, tests (incl. test:duas, test:worker / worker/*.test.mjs if present), npm run build:cf
        ↓  (push to main only, AND repo variable CF_DEPLOY_ENABLED == 'true')
deploy:   npm run build:cf  →  cf-preflight.sh  →  wrangler deploy (in apps/<app>)
        ↓
health check with retries against ${CF_HEALTHCHECK_BASE:-https://iqraspace.org}
```

Workflows: `ci.yml` (learning), `ci-quran.yml`, `ci-site.yml`, `ci-flutter.yml` (Flutter; branch `mobile/android` only), and `sync-quran-content.yml` (weekly Quran content re-sync, see below). Each has its own `concurrency` group; PRs only run `validate`.

Health-check paths: site `/`, `/robots.txt`, `/sitemap.xml`; quran `/quran`, `/quran/surah`, `/quran/sitemap.xml`; learning `/learning/login`, `/learning/share/00000000-0000-0000-0000-000000000000` (dynamic-route shell, must be 200), `/learning/api/duas/version` (API + D1).

Learning's `test:worker` runs the routing tests plus the API tests (policies, query compiler, hooks/audit, RPCs, auth) against `node:sqlite` with the D1 migrations applied. CI never applies D1 migrations (see "Databases" below).

### GitHub secrets and variables (repo → Settings → Secrets and variables → Actions)

Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and for the content sync `QURAN_FOUNDATION_ENV`, `QURAN_FOUNDATION_CLIENT_ID`, `QURAN_FOUNDATION_CLIENT_SECRET`, `QURAN_FOUNDATION_PROD_CLIENT_ID`, `QURAN_FOUNDATION_PROD_CLIENT_SECRET` (only those matching the chosen env are needed; names per `apps/quran/.env.local.example`).

Variables: `CF_DEPLOY_ENABLED` (`true` to allow deploy jobs; unset = validate-only), `CF_HEALTHCHECK_BASE` (optional, default `https://iqraspace.org`; during staging set it to the `*.workers.dev` URL of the worker being checked), `QURAN_SYNC_ENABLED` (`true` to enable the weekly sync).

Worker runtime secrets (`TURNSTILE_SECRET_KEY` etc.) are set once with `wrangler secret put` by the owner; CI never holds them. Never run `wrangler deploy` from a developer/agent session — deploys are CI-only.

### Deploy preflight and the Cloudflare token

Each deploy job runs `.github/scripts/cf-preflight.sh` before `wrangler deploy`. It calls the Cloudflare API with the CI token and fails with the exact missing permission (visible in the run's annotations/log) instead of an opaque `wrangler` exit 1. The token in `CLOUDFLARE_API_TOKEN` needs: **Account → Workers Scripts: Edit**, **Account → D1: Edit** (site and learning bindings), **Account → Workers R2 Storage: Edit** (learning's `MATERIALS` binding), **Zone (iqraspace.org) → Workers Routes: Edit**, **Zone → Zone: Read**, **Account → Account Settings: Read**; Durable Objects need nothing extra. `CLOUDFLARE_ACCOUNT_ID` must be the account that owns the zone. Create it at dash.cloudflare.com → My Profile → API Tokens (template "Edit Cloudflare Workers" plus D1:Edit and Workers R2 Storage:Edit), then update only the GitHub secret.

### Quran content re-sync

The Quran Foundation licence requires content to be re-synced at least every 7 days. `sync-quran-content.yml` runs weekly (and on manual dispatch), runs `node scripts/sync-content.mjs` in `apps/quran` with credentials from secrets, and if `apps/quran/src/content/generated` changed opens a PR from branch `chore/quran-content-sync` (never pushes to `main`). Merging the PR deploys via `ci-quran.yml`. Guarded by `QURAN_SYNC_ENABLED`.

## DNS and routes

Worker routes only fire for **proxied** records, so the `@` and `www` records in zone `iqraspace.org` are proxied (orange cloud) A records pointing at the placeholder `192.0.2.1` (reserved TEST-NET address) — the Worker route answers before any origin is contacted, so the address is never used. Routes are declared in each app's `wrangler.jsonc` and applied by the next deploy. When standing up a Worker for the first time, set `CF_HEALTHCHECK_BASE` to its `*.workers.dev` URL while verifying, then delete the variable so checks hit `https://iqraspace.org`.

One-time `iqraspace-site` setup (owner, local wrangler): `wrangler d1 create` the contact DB (put its id in `apps/site/wrangler.jsonc`), apply `apps/site` migrations (`wrangler d1 migrations apply ... --remote`), and `wrangler secret put TURNSTILE_SECRET_KEY` (plus optional `RESEND_API_KEY`, `CONTACT_ALERT_EMAIL`, `CONTACT_FROM_EMAIL`). See `apps/site/ADMIN.md`. The equivalent for `iqraspace-learning` (D1 create, schema, token permissions) is in `apps/learning/BACKEND.md`.

### Rollback

To roll back a bad Worker deploy, use Workers → Deployments → rollback to a previous version (or `wrangler rollback` run by the owner). Set `CF_DEPLOY_ENABLED` to anything other than `true` to stop further deploys while investigating. D1 migrations are not rolled back by a Worker rollback; a schema change that must be undone needs a new forward migration.

## Databases

- **apps/learning:** Cloudflare D1 database `iqraspace-learning` (binding `DB`), including users, sessions and the **Duas** tables managed at `/learning/admin/duas` by `admin`/`super_admin` users; the website (`/api/duas`) and the Flutter app read only the published snapshot through the public `GET /learning/api/duas/content` / `/duas/version`. Lesson PDFs are in R2 (binding `MATERIALS`). Schema lives in `apps/learning/d1/migrations/` and is **never** applied by CI; the owner runs `npx wrangler d1 migrations apply iqraspace-learning --remote` before merging code that needs it. Admin accounts: `npm run seed:admins -- --remote` (in `apps/learning`). Access control is the Worker (`worker/api/policies.js`), not the database. Details: `apps/learning/BACKEND.md`.
- **apps/site:** Cloudflare D1 for the contact form (see `apps/site/ADMIN.md`).
- **apps/quran:** no database.

### Pending owner clean-up

- Delete the old Vercel projects and any leftover `VERCEL_*` GitHub secrets / Environments if they still exist.
- Delete the GitHub secrets `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (no longer used by CI).
- After the one-time data cutover and soak period, delete the Supabase project(s) — runbook in `apps/learning/BACKEND.md` ("Cutover from Supabase").

## Costs and limits (free tier, re-check before relying on them)

- Workers Free: 100,000 Worker invocations/day; Static Assets requests are free and unlimited (only dynamic Worker-script hits count).
- D1 Free: 5 GB storage, 5 M rows read/day, 100 k rows written/day.
- R2 Free: 10 GB storage (shared by the Flutter audio bucket and Learning's lesson-PDF bucket).
- Durable Objects: included on Workers Free (SQLite-backed class; Learning's `LessonRoom`).
- GitHub Actions: standard free minutes.

## Stale docs corrected

- Capacitor / Android shell for `apps/quran` and `ci-quran-mobile.yml` no longer exist; `apps/quran` is web-only (SSG/PWA).
- Flutter CI is `ci-flutter.yml` (branch `mobile/android` only).
- Multi-Zones rewrites are gone; each app is its own Worker on its own route.
- `apps/learning` no longer has Edge Functions, a root `supabase/` folder or `NEXT_PUBLIC_SUPABASE_*` build variables; its backend is the Worker API (`apps/learning/BACKEND.md`).

## Manual verification checklist (post-deploy)

- Site pages load; `/contact` form submits (D1 row appears, alert email if configured).
- `/quran` reader loads; sitemap returns 200.
- Learning: Admin/Super Admin/Tutor/Student can log in by username; Materials PDFs render; Schedule booking works; a live Teach → Share session syncs; no API/auth/CORS errors in the browser console.
- Duas: an admin can open `/learning/admin/duas`, edit and publish a Dua; `https://iqraspace.org/learning/api/duas/content` and `https://iqraspace.org/api/duas` return it (within ~60 s) and `/duas` renders it.
- `https://www.iqraspace.org/<path>` 301s to the apex.
