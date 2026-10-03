# IqraSpace Quran — Production Deployment

Status: **migrating from Vercel to Cloudflare Workers Static Assets** (branch `cloudflare-migration`). The app is now a fully static export (`output: "export"`) served by an assets-only Cloudflare Worker routed at `iqraspace.org/quran*`. Items below marked **[manual]** are owner-only steps that were NOT performed by the migration work (no Cloudflare login/deploy has happened from the repo yet). CI/CD for this app is owned by `.github/workflows/ci-quran.yml` and is updated separately from this document.

## Architecture

```text
https://iqraspace.org/           → apps/site   (static pages; owns the domain root)
https://iqraspace.org/quran/*    → apps/quran  (this app: Cloudflare Worker "iqraspace-quran", static assets only)
https://iqraspace.org/learning/* → apps/learning (separate product, separate deployment)
```

`apps/quran` is a Next.js 16 static export. There is no server runtime: no ISR, no route handlers, no middleware, no server actions. All 114 `/surah/[n]` and 604 `/page/[n]` pages are generated at build time from `generateStaticParams` (with `dynamicParams = false`), and the Worker has **no `main` script** — Cloudflare serves files straight from the uploaded asset directory.

| | |
|---|---|
| Framework | Next.js 16.3.3 (App Router, `output: "export"`), React 19, TypeScript, Tailwind v4 |
| Node.js | `>=20.9.0` |
| Build command | `npm run build:cf` → `scripts/build-cf.mjs` (sets `NEXT_BASE_PATH=/quran`, runs `npm run build`, then `scripts/prepare-cf.mjs`) |
| Output | `dist/` — `dist/quran/**` (the export, so `/quran/_next/...` maps 1:1 to `dist/quran/_next/...`), `dist/_headers`, `dist/404.html` |
| Worker config | `wrangler.jsonc` — name `iqraspace-quran`, `assets.directory: ./dist`, `html_handling: drop-trailing-slash`, `not_found_handling: 404-page`, route `iqraspace.org/quran*` (zone `iqraspace.org`), `workers_dev: true` |
| Deploy | `npx wrangler deploy` from `apps/quran` after `npm run build:cf` **[manual / CI]** |
| Lint / Typecheck | `npm run lint` / `npx next typegen && npm run typecheck` |

`npm run dev` (port 3001) is unchanged and uses no base path. `next start` no longer applies (static export) — to preview the production build locally run `npm run build:cf` and then `npx wrangler dev` (works without logging in; uses local workerd).

### Why `scripts/build-cf.mjs`

A plain `NEXT_BASE_PATH=/quran next build` is shell-specific, and Git Bash on Windows rewrites a bare `/quran` argument into a Windows path. The Node script sets the variable itself, so the same command works on Windows, macOS, Linux and CI.

### `dist/_headers` is generated, not hand-edited

`output: "export"` does not support `headers()` in `next.config.ts`, so the security headers, CSP and cache rules live in `scripts/prepare-cf.mjs`, which writes `dist/_headers` (scoped to `/quran/*`):

- Security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and the CSP (identical to the former `headers()` — including `media-src` for `cdn.islamic.network` / `audio.iqraspace.org` and `connect-src` for `api.alquran.cloud`; the `'unsafe-eval'` dev-only allowance is gone because the production build never had it).
- `/quran/pdf/*`: `Access-Control-Allow-Origin: *` (the Learning app's pdf.js fetches these cross-origin), 1 day cache + stale-while-revalidate.
- `/quran/_next/static/*`: `max-age=31536000, immutable` (hashed filenames).
- HTML routes and RSC payload files: `max-age=0, must-revalidate`. Un-hashed assets (`brand/`, `pdf-worker/`, `search-index.json`, icons, manifest, sitemap): short/moderate cache with revalidate.
- Extensionless generated files (`icon`, `apple-icon`, `opengraph-image`, `manifest.webmanifest`) get an explicit `Content-Type`.

Cloudflare applies every matching `_headers` rule, so each path gets `Cache-Control` from exactly one rule — keep it that way when editing the script.

### URL behaviour

`html_handling: drop-trailing-slash` matches how the Next export is laid out (`surah/2.html`, `surah.html`, `index.html`) and the links Next generates (no trailing slash):

| Request | Result |
|---|---|
| `/quran`, `/quran/surah`, `/quran/surah/2`, `/quran/page/604`, `/quran/search`, `/quran/bookmarks` | 200 |
| `/quran/`, `/quran/surah/2/` | redirect (307) to the no-slash form |
| `/quran/surah/200`, `/quran/page/700`, `/quran/anything-else` | 404 with the branded not-found page (`dist/quran/404.html`; a copy at `dist/404.html` too) |
| `/quran/sitemap.xml`, `/quran/manifest.webmanifest`, `/quran/search-index.json`, `/quran/pdf/surah/1.pdf` | 200 |

Differences vs. the Vercel/Next server: the trailing-slash redirect is 307 (Next used 308); out-of-range Surah/page numbers are a host-level 404 (`dynamicParams = false`) rather than a server-rendered `notFound()`; the route pattern `iqraspace.org/quran*` also captures paths like `/quranfoo` (they 404).

### Asset limits (checked at build time by `prepare-cf.mjs`)

Cloudflare Workers Static Assets: max 25 MiB per file and 20,000 files per version on the free plan. Current `dist/`: ~4,534 files, ~376 MiB, largest file `quran/pdf/surah/2.pdf` at ~14.8 MiB. The script warns if either limit is approached/exceeded.

### Next.js export notes

- Metadata routes (`icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`, `manifest.ts`, `sitemap.ts`) are marked `export const dynamic = "force-static"` — required for `output: "export"`. They are emitted as static files (`icon`, `apple-icon`, `opengraph-image`, `manifest.webmanifest`, `sitemap.xml`).
- `layout.tsx` sets `metadata.icons` explicitly with the base path: with export + `basePath` Next otherwise emitted `<link rel="icon" href="/icon?...">` without `/quran`, which would hit the apex site.
- Fonts come from `next/font/google` at build time (self-hosted under `_next/static/media`); no runtime font requests.

## Environment variables

Build-time only; nothing is read at runtime (there is no runtime). Full detail in `.env.local.example`.

| Variable | Notes |
|---|---|
| `NEXT_BASE_PATH` | `/quran` — set by `scripts/build-cf.mjs`; do not set it for local dev. Also exposed to client code as `NEXT_PUBLIC_BASE_PATH` via `next.config.ts`. |
| `QURAN_FOUNDATION_*` | Only used by `npm run sync:content` (a manual local step), never by the build or the deployed site. |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | Not used by any current feature. |

**Content sync is deliberately not part of the build** — a deploy never re-fetches content from a third-party API. `npm run sync:content` is run manually, its output (`src/content/generated/`) reviewed and committed. The licence requires re-syncing at least weekly; see `QURAN-CONTENT.md` (currently a manual obligation).

## DNS and routing **[manual]**

`iqraspace.org` DNS is on Cloudflare. A Worker route (`iqraspace.org/quran*`) only fires for **proxied** (orange-cloud) DNS records, so the apex record must be proxied for the route to take effect. The earlier "DNS only" requirement existed purely for Vercel and no longer applies to this app. The root site (`apps/site`) and `/learning` are handled by their own deployments/routes; the old Multi-Zones `vercel.json` rewrite to this app must be removed/replaced by whoever owns `apps/site` — otherwise it will still point at the Vercel deployment.

## Rollback

Cloudflare dashboard → Workers & Pages → `iqraspace-quran` → Deployments → pick a previous version → roll back; or `npx wrangler rollback`. Alternatively revert the commit and redeploy.

## Manual verification checklist (post-deploy)

- `https://iqraspace.org/quran`, `/quran/surah/1`, `/quran/page/1` load; `/quran/surah/200` shows the branded 404 with a 404 status.
- Response headers include the CSP and `X-Frame-Options`; `/quran/pdf/surah/1.pdf` carries `Access-Control-Allow-Origin: *`.
- `/quran/sitemap.xml`, `/quran/manifest.webmanifest`, `/quran/search-index.json` return 200; the page `<head>` icon/manifest/OG links all start with `/quran`.
- Reader controls work (theme, font, bookmarks, Go-to-Ayah) — confirms the inline-script CSP allowance is effective; audio plays (media-src); search works.
- Responsive spot-check at 320 / 390 / 768 / 1280 px (no horizontal scroll, reader toolbar tappable, RTL/LTR layout correct, footer at the bottom, theme persists across reload).
