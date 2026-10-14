# ARCHITECTURE — IqraSpace Quran

Proposed architecture for the public Quran reading platform described in [`Readme.md`](./Readme.md). Companion docs: [`COST.md`](./COST.md) (what it costs), [`DEPLOYMENT.md`](./DEPLOYMENT.md) (Cloudflare hosting), [`QURAN-CONTENT.md`](./QURAN-CONTENT.md) and [`PDF-CONTENT.md`](./PDF-CONTENT.md) (content sources).

> **Status note:** this started as a proposal and has been partly overtaken by what was built. Where the text below differs from the code, the code wins; the current reality is: fully static export on Cloudflare Workers (no ISR, no server), anonymous-only user data in `localStorage` (no backend, no auth, no sync layer — see §5), client-side UI language switching (en/te/ur, no locale routes), and a web manifest without a service worker.

Every decision below follows the master prompt's own rule (§33): decision, alternatives, reason, cost impact, future reversibility. Anything marked **[NEEDS VERIFICATION]** is a claim about a third-party API/free-tier/ToS that must be re-checked against current documentation before being relied on — not assumed from training data, per the source repo's own precedent (`Iqra-space-architecture.md`'s freshness note).

---

## 1. High-level shape

```
Quran Foundation / Quran.com API  (source of truth for text/translations/audio metadata)
        │
        ▼
Content Sync Layer (build-time + scheduled revalidation)
        │
        ▼
Cached/validated Quran content (static JSON + CDN, edge-cached)
        │
        ▼
apps/quran  (Next.js — SSR/SSG reader, PWA shell)
        │
        ├── User data (bookmarks, last read, prefs) ──► browser localStorage only (anonymous-first)
        │       (optional cross-device sync is a possible future idea, not built — see §5)
        │
        └── Audio ──► reciter CDN, streamed directly, never proxied through our servers
```

This mirrors the master prompt's own architecture (§8, §39): the Quran text/translation/audio itself is treated as **immutable reference content**, decoupled from live API calls and decoupled from user-specific data. A visitor should never wait on, or be blocked by, a third-party API being slow or down (§42).

## 2. Decision: independent app, independent infra

**Decision:** `apps/quran` is a new, independent Next.js app inside the existing monorepo — its own `package.json`, own Cloudflare Worker deployment, own CI job. It does not import from or depend on `apps/learning` (formerly `apps/web`), and the two share no data store — `apps/quran` has no backend at all, while `apps/learning`'s data lives in its own Cloudflare D1 database.

**Alternatives considered:**
- Add Quran-reading routes directly into `apps/learning` (then called `apps/web`). Rejected — different audience (public/anonymous vs. authenticated tutor-student), different auth model, different privacy posture (minors' PII lives in `apps/learning`'s D1 database; this product should not need to touch that data at all), different deploy cadence and risk profile. Mixing them raises the blast radius of any access-control mistake and couples two products' release cycles for no benefit.
- Turborepo/pnpm workspaces with a shared UI/config package. Rejected for now — two apps sharing zero runtime code today doesn't justify workspace tooling the rest of this repo doesn't use (KISS, §41). Revisit only if real duplicated code becomes a maintenance problem.

**Reason:** matches how `apps/learning` itself is already structured (fully self-contained app, root `package.json` just delegates via `--prefix`), and keeps the two products able to fail, scale, and deploy independently.

**Cost impact:** $0 — a Cloudflare Worker (static assets) is free-tier at this scale; no database is in use.

**Future impact:** fully reversible — nothing in this design prevents later consolidation (e.g. a shared design-tokens package) if it ever earns its complexity.

## 3. Frontend

- **Framework:** Next.js (App Router) + React + TypeScript — same major-version family as `apps/learning` (currently Next 16 / React 19) for consistency of developer knowledge in this repo, re-verified against current stable releases at scaffold time.
- **Styling:** Tailwind CSS. A **new**, purpose-built design-token set (not imported from `apps/learning`) — same *methodology* (CSS custom properties, class-based dark mode, `next/font/google` for Amiri/Arabic + a calm Latin pair) but tuned for a reading surface, not a dashboard. Reader typography (Arabic size, translation size, line-height, reading width) are runtime-adjustable tokens, not hardcoded (§11).
- **Rendering strategy:** a pure static export (`output: "export"`): all 114 `/surah/[n]` and 604 `/page/[n]` routes are generated at build time (`dynamicParams = false`). There is no ISR or server runtime; new synced content goes live only via a redeploy — first paint of Quran text never waits on a client-side fetch (§19, §22 SEO).
- **PWA:** a Web App Manifest only (`src/app/manifest.ts`, basePath-aware, installable). No service worker exists yet; offline support is a later phase (§20).
- **i18n:** as built, a client-side UI-language preference (English, Telugu, Urdu; Urdu is RTL) backed by a plain string table (`src/lib/i18n/strings.ts`, `useT()`), with no locale route segments. Quran text and translations are never part of it.
- **Navigation / branding:** the header (`SiteHeader.tsx`) links Surahs, Bookmarks, Search, and two cross-app links, Duas (`/duas`, owned by `apps/site`) and Learning (`/learning`), as plain `<a>` tags because they are different Workers (outside this app's basePath). The Supplications/Duas feature that once lived in this app was removed; Duas now live only in `apps/site` (data published from the Learning admin). The UI is rebranded to match `apps/site`'s design system and logo.

## 4. Quran content: provider, sync, caching

**Decision:** the Quran Foundation Content APIs (`api-docs.quran.foundation`, content API v4.0.0 — the current home of what was `api-docs.quran.com`) are the confirmed content source. Phase 0's research task is complete — see [`QURAN-CONTENT.md`](./QURAN-CONTENT.md) for the full authentication model, licensing terms, and sources. Everything below reflects that research, including one correction it forced on this document's earlier draft (the cadence point below).

**Sync/cache pipeline:**
- A small, separate sync script (not part of the request path) authenticates via OAuth2 client-credentials, pulls Surah/Ayah text, selected translation(s), Juz/Page/Hizb/Ruku metadata, and reciter/audio manifests from the API, validates it, and writes it to a static content store (versioned JSON, one bundle per locale/content-type) checked into build output or an object store — not queried live per request.
- The running app reads only from this cache/CDN layer. If the upstream API is unreachable, the app is **unaffected** — it was never in the request path (§42, "failure handling").
- **Revalidation cadence is a license requirement, not a convenience:** Quran Foundation's terms cap cached/stored content at **1 week maximum** unless re-synced at least every 7 days (`QURAN-CONTENT.md` §3). The sync job therefore must run **at least weekly, automatically** (e.g. a scheduled GitHub Actions workflow that re-runs the sync script and redeploys, or an ISR revalidation window ≤ 7 days; as built: `.github/workflows/sync-quran-content.yml`, weekly, which opens a PR) starting from Phase 1 — this is a correction to an earlier draft of this document, which had deferred scheduling to a later hardening phase. Running it more often (e.g. daily) is fine and simpler to reason about than cutting it close to the 7-day limit.

**Alternatives considered:**
- Store full Quran text in Postgres and query it per page request. Rejected as the default — this is large, effectively immutable content; static/CDN caching is both cheaper and faster than a DB round trip on every read (§8 explicitly warns against this).
- Call the content API directly from the browser per page view. Rejected — couples every visitor's experience to a third party's uptime/latency and rate limits, and risks leaking any API credential that isn't meant for the browser (§7.9).

**Reason:** resilience and performance are named as the two highest priorities (§19, §42); a static/CDN-first design satisfies both and costs nothing extra.

**Cost impact:** $0 at this scale — static assets served from Cloudflare Workers Static Assets (free plan: static asset requests are free and unlimited) are within any relevant free tier.

**Future impact:** fully reversible — a future move to a different provider only touches the sync script and its output format, not the app's read path.

**Translations:** only verified, properly licensed translations are used, matching whatever the chosen provider serves with attribution — never machine-translated (§7, explicit "critical rule"). Attribution requirements per translation are recorded in `QURAN-CONTENT.md` once the provider research is done (Phase 0 deliverable, not yet written).

## 5. User-specific data (bookmarks, progress, prefs)

**Status (as built):** user data is anonymous and browser-only. Bookmarks, last-read position and reader preferences (theme, font size, translation, reciter, UI language) are kept in `localStorage` (`src/lib/preferences/storage.ts` and the bookmark/last-read stores). No account, no server call, no backend client in the app. Optional cross-device sync (Phase 5) remains only a possible future idea with no chosen provider; the rest of this section records the principles any such sync would have to follow.

**Scope if sync is ever added:** only what the master prompt actually lists (§25): bookmarks, reading progress, reading history, preferences, notes (future), collections (future). No table is created ahead of a genuine feature needing it.

- **Anonymous-first:** bookmarks, last-read position, and reader preferences (font size, theme, translation visibility) are stored in the browser (`localStorage`/IndexedDB) by default — reading, listening, searching, and adjusting the reader all work with zero account (§9). This is also why the *content* layer above must never require auth.
- **Optional sync:** signing in (Phase 5) upgrades local data to server-synced rows tied to the user, for cross-device continuity — not a prerequisite for using the app.
- **Access control:** every table denies-by-default; a user can only read/write their own rows. Any such enforcement is designed for this app on its own, not as shared code with `apps/learning`.

**Alternatives considered:** requiring an account for any personalization. Rejected outright — directly contradicts §9's explicit requirement that reading never requires signing in.

**Cost impact:** $0 — data lives in the visitor's browser. If sync is ever added, bookmarks/progress/prefs are tiny rows that should fit a free tier at pilot scale (verify at the time, per `COST.md`).

## 6. Search

**Decision:** start with Postgres full-text search (`tsvector`/`tsquery`) over the cached Arabic text and English translation, or, if search volume is small enough, a client-side indexed search (e.g. a prebuilt lightweight index shipped with the static content bundle) — whichever proves fast enough in Phase 3, decided with a measurement, not a guess.

**Alternatives considered:** Elasticsearch/Algolia. Explicitly rejected per §14 ("do not introduce Elasticsearch merely because it is available") and §6 (avoid unnecessary paid services) — revisit only if real search-latency numbers demand it.

**Cost impact:** $0 either way at this scale.

## 7. Audio

**Decision:** stream reciter audio directly from an existing, licensed audio CDN rather than hosting/storing audio files ourselves. Candidate sources to evaluate in Phase 0/2 research (not yet chosen): the audio CDN Quran.com's own API references, or another established reciter-audio host — chosen based on licensing clarity and bandwidth cost, mirroring the existing repo's own precedent of "reference, don't copy" for large media (§13, §39 "Quran Content / Audio Services" as an explicit external box in the target architecture diagram).

**Reason:** avoids any self-hosted bandwidth or storage cost for audio, which would otherwise be the single largest cost driver of this product (§13: "Audio should not unnecessarily consume application server bandwidth").

## 8. Hosting, CI/CD

- **Hosting:** Cloudflare Workers Static Assets (assets-only Worker `iqraspace-quran`, free plan) serving a Next.js static export (`output: "export"`); see `DEPLOYMENT.md`.
- **CI/CD:** a path-filtered workflow scoped to `apps/quran/**` (`.github/workflows/ci-quran.yml`), so this app's pipeline is fully independent of the tutoring app's — a break in one never blocks or redeploys the other. `validate` (lint/typecheck/`npm run build:cf`) → `deploy` (`wrangler deploy`) → health check.
- **Environments:** `development` (local, `npm run dev`), `production` — per the master prompt's explicit naming rule (§30: "do not use confusing environment names such as 'pilot' for the production deployment environment"). There are no per-PR preview deployments (a preview Worker version can be added later if wanted).
- **Domain — decided:** `iqraspace.org/quran` (a path under the main IqraSpace domain, not a subdomain). This means `apps/quran` is not the only thing served from `iqraspace.org` — something else owns the domain root, and this app owns only the `/quran` path.

  **What owns the root — decided 2026-08-31, during the production deployment pass:** `apps/site` (originally a single-page `apps/landing`), a static site with no framework. Path routing to this app is done on the Cloudflare side: the `iqraspace-quran` Worker has the route `iqraspace.org/quran*` (see `wrangler.jsonc`), so the root site can be replaced later without apps/quran changing at all. This was chosen over the two other options on the table (the tutoring app owning the root; a future ecosystem hub per Readme.md §40 owning it) because both would have blocked getting `iqraspace.org` live now on work that doesn't exist yet.

  **How this is wired up (Cloudflare Worker routes):** `apps/quran` stays a fully independent app/deployment (per §2), configured with `basePath: '/quran'` so every route, link, and static asset it generates is automatically prefixed; the build output is placed under `dist/quran/` so URLs map 1:1 to files. The Worker route `iqraspace.org/quran*` sends matching requests to it; each app keeps deploying independently — this is a routing-layer stitch, not a merge.

  **Base path:** `next.config.ts` reads `basePath` from `NEXT_BASE_PATH`, unset for local dev; `npm run build:cf` sets it to `/quran` and nothing else in the app needs to hardcode the `/quran` prefix — Next.js's own `<Link>`/asset handling does it automatically (the one exception is the explicit `metadata.icons` in `layout.tsx`, needed because Next omits the prefix for file-convention icons under static export).

## 9. Security & privacy posture

- No secrets in the browser: the shipped app holds none (no backend client, no API keys). If sync is ever added, nothing beyond public, non-secret configuration may ship to the browser.
- Any content-provider API key (if the chosen provider requires one) is used only server-side (sync script / server component), never shipped to the client (§7.9).
- If server-side user data is ever added: access control on every user-data table from day one, deny-by-default, narrow allow rules added as features land.
- Minimal data collection throughout (§28): no tracking beyond what's needed to know the app works (errors, performance, aggregate popular-Surah counts) — no advertising profiles, ever.

## 10. What's deliberately deferred

Per §37 (avoid feature creep), the following are named in the master prompt but explicitly **not** part of the initial architecture — recorded here so they're tracked, not forgotten:

- Google Drive/Calendar-style third-party integrations — not applicable to this product at all.
- Tajweed-aware color annotations, memorization tools, offline audio downloads, multi-tutor concepts — none of these apply; this is a reading product, not the tutoring product.
- A full CMS/admin panel — only build the minimum needed to operate (e.g. re-run content sync, see basic error/usage stats), per §26.
- Elasticsearch, Kubernetes, microservices, Redis, paid monitoring — none justified at any scale discussed in `COST.md`.
