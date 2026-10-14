# COST — IqraSpace Quran

> **Freshness note (copied deliberately from this repo's own precedent in `Iqra-space-architecture.md`):** free-tier limits, ToS clauses, and pricing for Cloudflare and any Quran content/audio API change often. Every figure below is a scale-relative estimate, not a verified current number — re-check each provider's live pricing/limits page before relying on any of them, especially the ones marked **[VERIFY]**.

Every paid service follows the master prompt's required format (§6): purpose, estimated usage, estimated monthly cost, free/cheaper alternative, reason it's necessary. Nothing below is paid at pilot scale.

## 1. Infrastructure at pilot scale (target: first real public users, order of hundreds–low thousands)

| Service | Purpose | Estimated usage | Tier | Estimated cost | Notes |
|---|---|---|---|---|---|
| Cloudflare Workers (Static Assets) | Hosting for `apps/quran` (everything under `/quran`) as an assets-only Worker with a route on the `iqraspace.org` zone (`DEPLOYMENT.md`) | Static export: ~4.5k files, ~376 MiB (mostly the per-Surah PDFs), moderate traffic | Workers Free | $0 | Static asset requests are free and unlimited on Workers; there is no server code, so no Worker invocations are billed. Limits to respect: 20,000 files per version and 25 MiB per file on the free plan (currently ~4.5k files, largest 14.8 MiB; `scripts/prepare-cf.mjs` warns). **[VERIFY]** current limits and the commercial-use terms of the free plan before relying on them. |
| Quran content API (candidate: Quran Foundation / Quran.com) | Source of Quran text, translations, audio metadata — pulled by the sync layer, not per-request | One sync run per content update, not per visitor | Free (public API) | $0 | **[VERIFY]** as Phase 0's first task: current auth model, rate limits, and licensing terms for a free/non-commercial site — not yet confirmed at all. |
| Reciter audio CDN | Serves actual audio bytes to visitors' browsers directly (never proxied through our servers): per-Ayah audio from the Quran API's CDN (`cdn.islamic.network`); Listening Mode's whole-Surah files from `audio.iqraspace.org` (Cloudflare R2, same bucket the Flutter app uses, see `apps/mobile/android/AUDIO.md`) | Scales with listeners, not with our infra | External / R2 (free-tier egress) | $0 | This is the one line item that would otherwise dominate cost if self-hosted — deliberately avoided (`ARCHITECTURE.md` §7). |
| DNS (Cloudflare) | DNS hosting for `iqraspace.org` (nameservers on Cloudflare) | Records for `iqraspace.org`/`www`; the apex must be **proxied** so the Worker route can fire | Free | $0 | Already in use; not a new decision. |
| Domain name | `iqraspace.org` — already owned | 1 domain/year | N/A | **[VERIFY]** actual renewal price — not tracked in this repo | Pre-existing cost, not introduced by this deployment. |
| Monitoring | Uptime/error tracking | Low volume | Free tier of an existing tool (e.g. Cloudflare's built-in Workers/zone analytics, or a free uptime checker) | $0 | No paid monitoring justified at this scale (§27). |

**Total at pilot scale: $0/month**, plus an optional ~$10–20/year if a custom domain is chosen. This matches the master prompt's "$0/month development, free tiers for pilot" target (§6) exactly.

## 2. Alternatives considered (for the record, per §6's required format)

| Decision | Free/cheaper option | Chosen | Why |
|---|---|---|---|
| Frontend hosting | Netlify, GitHub Pages, Cloudflare Pages | Cloudflare Workers Static Assets | The site is a pure static export and the domain's DNS is already on Cloudflare, so serving it from the same account avoids a CDN-in-front-of-CDN setup and per-request cost. |
| Backend/DB | Firebase/Firestore, a hosted or self-hosted Postgres | None (browser `localStorage`) | Anonymous-first design needs no server-side user data. Do not introduce a backend without a documented reason; reading must stay account-free. |
| Search | Elasticsearch/Algolia | Postgres full-text or a shipped client-side index | Explicitly avoided per §14 until real usage numbers justify more. |
| Audio hosting | Self-hosted storage + our own bandwidth | External reciter CDN | Removes the single largest potential cost driver entirely; standard practice for Quran apps. |

## 3. Expected scaling (per §38 — explain, don't pre-build for it)

| Users | What changes | Action needed now |
|---|---|---|
| 1,000 | Negligible load on any layer above. Content is CDN-cached; user-data rows are tiny. | None. |
| 10,000 | Still comfortably inside every free tier **[VERIFY at the time]** — there is no database, and static asset serving on Cloudflare is not metered. | None; no architecture change. |
| 100,000 | First point where a free-tier ceiling is plausible — most likely the Workers asset limits (file count/size) or any backend added later for optional sync (Phase 5+, not built). Static asset serving stays free on Workers; reciter audio bandwidth is still not our cost (external CDN). | Re-run the cost analysis with real traffic numbers before upgrading anything; not a database or hosting migration. |
| 1,000,000 | Would need a real capacity/cost review with actual measured traffic, not a projection made today. Likely candidates: a paid Cloudflare plan if limits are hit, possibly a paid backend tier if optional sync is ever built and heavily used — still no justification foreseeable today for Kubernetes, microservices, Elasticsearch, or self-hosted audio at this scale, since the content-serving path stays CDN-shaped regardless of user count. | Do not pre-build for this now (§38 explicit instruction) — revisit only once 100k-scale numbers are real. |

## 4. What's deliberately not budgeted for

Per §6's explicit "do not introduce" list: no Kubernetes, no microservices, no dedicated servers, no expensive/managed search, no Redis, no paid CMS, no expensive monitoring, no unnecessary third-party APIs, and no AI APIs for basic Quran functionality (text/translation/audio/search/bookmarks need none of this). Any future proposal to add one of these must come with the full decision/alternatives/reason/cost table this document uses, per §33.
