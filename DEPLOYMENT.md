# IqraSpace — Deployment (Cloudflare)

Status: **migrating from Vercel to Cloudflare Workers** (branch `cloudflare-migration`). Until the DNS cutover below is done, `iqraspace.org` is still served by the old Vercel projects. Per-app details live in each app's own docs (`apps/<app>/`); this file covers the repo-wide picture.

## Architecture

Three independent Cloudflare Workers (Workers Static Assets), one per app, on one Cloudflare zone (`iqraspace.org`). Each app has its own `wrangler.jsonc`, is built with `npm run build:cf` (inside the app dir, output `./dist`) and deployed with `npx wrangler deploy` (inside the app dir).

| App | Worker | Route(s) | Backend |
|---|---|---|---|
| `apps/site` | `iqraspace-site` | `iqraspace.org/*`, `www.iqraspace.org/*` | D1 binding `DB` (contact form); secrets `TURNSTILE_SECRET_KEY`, optional `RESEND_API_KEY`, `CONTACT_ALERT_EMAIL`, `CONTACT_FROM_EMAIL` |
| `apps/quran` | `iqraspace-quran` | `iqraspace.org/quran*` | none required (static, synced content) |
| `apps/learning` | `iqraspace-learning` | `iqraspace.org/learning*` | Supabase (Postgres/Auth/Storage); small Worker script for dynamic routes |

**Path routing on one zone:** Cloudflare picks the most specific route, so `/quran*` and `/learning*` go to their Workers and everything else falls to `iqraspace-site`. There is no proxying and no Multi-Zones `rewrites()` any more. Routing changes are edits to the relevant app's `wrangler.jsonc` `routes`.

`apps/mobile/android` (Flutter) is not part of this web pipeline; its audio lives in a dedicated Cloudflare R2 bucket (`apps/mobile/android/AUDIO.md`).

## CI/CD

```text
push / PR touching apps/<app>/**  (path-filtered, one workflow per app)
        ↓
validate: npm ci, lint, next typegen, typecheck, tests (incl. test:duas, worker/*.test.mjs if present), npm run build:cf
        ↓  (push to main only, AND repo variable CF_DEPLOY_ENABLED == 'true')
deploy:   npm run build:cf  →  cloudflare/wrangler-action@v3 (wrangler deploy, workingDirectory apps/<app>)
        ↓
health check with retries against ${CF_HEALTHCHECK_BASE:-https://iqraspace.org}
```

Workflows: `ci.yml` (learning), `ci-quran.yml`, `ci-site.yml`, `ci-flutter.yml` (Flutter; branch `mobile/android` only), and `sync-quran-content.yml` (weekly Quran content re-sync, see below). Each has its own `concurrency` group; PRs only run `validate`.

Health-check paths: site `/`, `/robots.txt`, `/sitemap.xml`; quran `/quran`, `/quran/surah`, `/quran/sitemap.xml`; learning `/learning/login`, `/learning/share/00000000-0000-0000-0000-000000000000` (dynamic-route shell, must be 200).

### GitHub secrets and variables (repo → Settings → Secrets and variables → Actions)

Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (learning build), and for the content sync `QURAN_FOUNDATION_ENV`, `QURAN_FOUNDATION_CLIENT_ID`, `QURAN_FOUNDATION_CLIENT_SECRET`, `QURAN_FOUNDATION_PROD_CLIENT_ID`, `QURAN_FOUNDATION_PROD_CLIENT_SECRET` (only those matching the chosen env are needed; names per `apps/quran/.env.local.example`).

Variables: `CF_DEPLOY_ENABLED` (`true` to allow deploy jobs; unset = validate-only), `CF_HEALTHCHECK_BASE` (optional, default `https://iqraspace.org`; during staging set it to the `*.workers.dev` URL of the worker being checked), `QURAN_SYNC_ENABLED` (`true` to enable the weekly sync).

Worker runtime secrets (`TURNSTILE_SECRET_KEY` etc.) are set once with `wrangler secret put` by the owner; CI never holds them. Never run `wrangler deploy` from a developer/agent session — deploys are CI-only.

### Quran content re-sync

The Quran Foundation licence requires content to be re-synced at least every 7 days. `sync-quran-content.yml` runs weekly (and on manual dispatch), runs `node scripts/sync-content.mjs` in `apps/quran` with credentials from secrets, and if `apps/quran/src/content/generated` changed opens a PR from branch `chore/quran-content-sync` (never pushes to `main`). Merging the PR deploys via `ci-quran.yml`. Guarded by `QURAN_SYNC_ENABLED`.

## DNS cutover runbook

Starting state: zone `iqraspace.org` has DNS-only A records for `@` and `www` pointing at Vercel (`76.76.21.21`).

1. **Cloudflare API token + GitHub config.** Create a token with: Workers Scripts:Edit, D1:Edit, Zone → Workers Routes:Edit (zone `iqraspace.org`), Account Settings:Read. Add secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and the Supabase/Quran secrets above.
2. **One-time `iqraspace-site` setup (owner, local wrangler):** `wrangler d1 create` the contact DB (put its id in `apps/site/wrangler.jsonc`), apply `apps/site` migrations (`wrangler d1 migrations apply ... --remote`), and `wrangler secret put TURNSTILE_SECRET_KEY` (plus optional `RESEND_API_KEY`, `CONTACT_ALERT_EMAIL`, `CONTACT_FROM_EMAIL`). See `apps/site/ADMIN.md`.
3. **Merge and deploy.** Merge `cloudflare-migration` to `main`, set `CF_DEPLOY_ENABLED=true`, (re-)run the three workflows. Set `CF_HEALTHCHECK_BASE` to each worker's `*.workers.dev` URL while verifying (the production domain still hits Vercel at this point); verify pages, `/contact`, Learning login.
4. **Attach routes.** Worker routes only fire for **proxied** records. Switch the `@` and `www` records to proxied (orange cloud). A proxied record still needs a target: use a placeholder such as `A 192.0.2.1` (reserved TEST-NET address) — the Worker route answers before any origin is contacted, so the address is never used. (Routes are declared in each `wrangler.jsonc` and applied by the next deploy; re-run the workflows if they were deployed before the zone was ready.)
5. **Verify production.** Reset `CF_HEALTHCHECK_BASE` (delete it) so checks hit `https://iqraspace.org`; re-run all three workflows and manually check `/`, `/quran`, `/learning/login`, the contact form.
6. **Decommission Vercel.** After a soak period (suggest 1–2 weeks), delete the three Vercel projects (learning, quran, landing/site), and delete any leftover `VERCEL_*`, `QURAN_VERCEL_*`, `LANDING_VERCEL_*` GitHub secrets and the old `vercel*` GitHub Environments. Update Supabase Auth `site_url`/redirect URLs (Learning) to `https://iqraspace.org/learning` if still pointing at `iqraspace.vercel.app`.

### Rollback

Re-point the `@` and `www` A records to the Vercel IP (`76.76.21.21`, DNS-only/grey cloud), and remove the three Workers' routes (Workers → each worker → Settings → Domains & Routes, or delete the `routes` and redeploy). Vercel projects must still exist (hence the soak period). Set `CF_DEPLOY_ENABLED` to anything other than `true` to stop further deploys while rolled back. To roll back a bad Worker deploy only, use Workers → Deployments → rollback to a previous version (or `wrangler rollback` run by the owner).

## Supabase

- **apps/learning** still uses Supabase (project `IQRASpace Project`, Postgres + Auth + Storage + Edge Functions). Migrations in `supabase/migrations/` are **never** applied by CI; run `npx supabase db push` manually (repo root, linked project, `SUPABASE_ACCESS_TOKEN` exported). Learning's build needs `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (GitHub secrets). Roles, auth model and pilot-account notes are in `README.md` and `apps/learning` docs.
- **apps/site's contact form** moved from Supabase to Cloudflare D1. The old dedicated Supabase project for it can be deleted once the D1 data (if any) has been exported.
- **apps/quran's** Supabase project is unused by the current reader and can be deleted.

## Costs and limits (free tier, re-check before relying on them)

- Workers Free: 100,000 Worker invocations/day; Static Assets requests are free and unlimited (only dynamic Worker-script hits count).
- D1 Free: 5 GB storage, 5 M rows read/day, 100 k rows written/day.
- R2 Free: 10 GB storage (Flutter audio bucket).
- GitHub Actions: standard free minutes; Supabase free tier for Learning.

## Stale docs corrected

- Capacitor / Android shell for `apps/quran` and `ci-quran-mobile.yml` no longer exist; `apps/quran` is web-only (SSG/PWA).
- Flutter CI is `ci-flutter.yml` (branch `mobile/android` only).
- All Vercel, Multi-Zones and `vercel.json` rewrite instructions are obsolete; `iqraspace.vercel.app` and `*.vercel.app` aliases are historical.

## Manual verification checklist (post-deploy)

- Site pages load; `/contact` form submits (D1 row appears, alert email if configured).
- `/quran` reader loads; sitemap returns 200.
- Learning: Admin/Super Admin/Tutor/Student can log in by username; Materials PDFs render; Schedule booking works; no Supabase/auth/CORS errors in the browser console.
