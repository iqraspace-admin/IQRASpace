# IQRASpace — Quranic Teacher

Online Quran learning management for a solo tutor and their students. Full
architecture, requirements, and rationale live in
[`Iqra-space-architecture.md`](./Iqra-space-architecture.md) — read that first.

Build status and phase-by-phase notes: [`docs/PROGRESS.md`](./docs/PROGRESS.md).
Hosting, CI and rollback: [`DEPLOYMENT.md`](./DEPLOYMENT.md). This README covers `apps/learning` only;
the monorepo also holds `apps/site`, `apps/quran` and `apps/mobile/android` (see `CLAUDE.md`).

## Stack

- **Frontend:** Next.js 16 (App Router, TypeScript, Tailwind CSS) — `apps/learning`
- **Backend:** the same Cloudflare Worker, at `/learning/api/*` (`apps/learning/worker/api/`) — Cloudflare D1 (database `iqraspace-learning`, binding `DB`), username + password auth with bearer-token sessions in D1, Durable Object `LessonRoom` (binding `LESSON_ROOMS`) for live Teach → Share sync. No secrets, only bindings. See [`apps/learning/BACKEND.md`](./apps/learning/BACKEND.md).
- **Lesson material files:** private Cloudflare R2 bucket `iqraspace-learning` (binding `MATERIALS`), uploaded and downloaded through the Worker API
- **PDF rendering:** PDF.js (client-side)
- **Hosting:** Cloudflare Workers (Static Assets) — Worker `iqraspace-learning`, route `iqraspace.org/learning*`. The app is a Next.js **static export** (`output: "export"`, `basePath` `/learning`); there is no Node server, middleware or Next.js API routes (the API is the Worker). See [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Prerequisites

- Node.js 20+ and npm (this repo was set up with Node 24)
- No cloud account is needed for local development: `wrangler dev` runs the Worker against a local D1/R2/Durable Object store (`apps/learning/.wrangler/state`)

## First-time setup

1. **Install dependencies:**
   ```bash
   npm install --prefix apps/learning
   ```

2. **Configure the local env:**
   ```bash
   cp apps/learning/.env.local.example apps/learning/.env.local
   # set ADMIN_PASSWORD / SUPER_ADMIN_PASSWORD; keep NEXT_PUBLIC_API_URL=http://localhost:8787/learning/api
   ```

3. **Apply the database schema to the local D1:**
   ```bash
   npm run db:migrate:local --prefix apps/learning   # applies apps/learning/d1/migrations/*.sql
   ```

4. **Seed the first admin accounts:** `npm run seed:admins --prefix apps/learning` (creates usernames `admin` and `superadmin` in the local D1 from `ADMIN_*` / `SUPER_ADMIN_*` in `.env.local`; add `-- --remote` to target production). Sign-in is by **username** + password.

5. **Run the API and the app** (two terminals):
   ```bash
   npm run dev:api --prefix apps/learning   # Worker API on http://localhost:8787/learning/api (root: npm run learning:dev:api)
   npm run dev --prefix apps/learning       # UI on http://localhost:3000
   ```
   Visit http://localhost:3000 (served from the bare origin; the `/learning` base path is only applied by `npm run build:cf`).

Production setup (creating the D1 database, applying migrations with `npx wrangler d1 migrations apply iqraspace-learning --remote`, Cloudflare token permissions) is in [`apps/learning/BACKEND.md`](./apps/learning/BACKEND.md).

## Roles and admin area

Roles: `tutor`, `student`, `guardian`, `admin`, `super_admin` (`users.role`, enforced by the Worker's access policies in `worker/api/policies.js`; the UI gating is UX only). Admins land on `/admin` (dashboard, `/admin/users` user management, `/admin/duas`); `super_admin` additionally assigns roles.

**Duas admin (`/learning/admin/duas`)** — admin and super_admin only. It manages the remotely-served supplications content (D1 tables `duas`, `dua_categories`, `dua_category_map`, `dua_audit_log`): list/search, create/edit with validation and duplicate warnings, categories and ordering, draft → review → published (+ archived) workflow, per-field audit history with restore, and an activity view. Only **published** content is exposed, through the public feed `GET /learning/api/duas/content` / `/duas/version`; the Flutter app (`DUAS_API_URL`) and the website's `/api/duas` (service binding `LEARNING`) read that snapshot. See `apps/site/DUAS.md`.

## Build, test and deploy

```bash
npm run lint --prefix apps/learning
npx --prefix apps/learning next typegen   # once on a fresh checkout, then:
npm run typecheck --prefix apps/learning
npm run test:duas --prefix apps/learning   # Duas validation unit tests
npm run test:worker --prefix apps/learning # routing + API tests against node:sqlite
npm run build:cf --prefix apps/learning    # static export + dist/ for Cloudflare
```

Deploys are CI-only (`.github/workflows/ci.yml`, `wrangler deploy`, gated by `CF_DEPLOY_ENABLED`). D1 migrations are **not** applied by CI: run `npx wrangler d1 migrations apply iqraspace-learning --remote` manually, before merging code that needs them.

## Project structure

```
IqraSpace/
├─ apps/learning/            # Next.js app (App Router)
│  ├─ src/app/           # (public): /, /login, /signup — (app): dashboard, classes, lessons,
│  │                     #   students, materials, schedule, attendance, progress, notes,
│  │                     #   meet, notifications, settings, teach/[lessonId], admin/{users,duas/**}
│  │                     #   — share/[lessonId]
│  ├─ src/components/    # ui/ (design-system primitives), shell/ (Sidebar/Topbar/AppShell),
│  │                     #   pdf/ (PdfViewer), teach/ (TeachClient/ShareClient), lessons/
│  ├─ src/lib/           # db.ts (API client), realtime.ts, sharing.ts, storage.ts,
│  │                     #   notifications.ts, quranContent.ts, theme.ts, format.ts, duas/
│  ├─ worker/            # Cloudflare Worker: dynamic-route placeholder shells + tests
│  │  └─ api/            #   /learning/api/*: auth, query compiler, policies, hooks, RPCs,
│  │                     #   admin users, storage (R2), realtime (Durable Object), Duas feed
│  ├─ d1/migrations/     # D1 schema (applied manually, never by CI)
│  ├─ scripts/           # build-cf, prepare-cf, seed-admin-accounts, seed-surah-lessons, ...
│  ├─ BACKEND.md         # backend architecture, local dev, production setup
│  └─ wrangler.jsonc     # Worker iqraspace-learning, route iqraspace.org/learning*, bindings
├─ docs/PROGRESS.md      # phase-by-phase build log, decisions, deviations
└─ Iqra-space-architecture.md
```

## Notable deviations from the architecture doc

- **Backend:** the architecture doc is built around a hosted Postgres backend with
  row-level security, Auth, Realtime and Edge Functions. The backend is now the
  `iqraspace-learning` Worker's own API: Cloudflare D1 for data, access rules in
  `worker/api/policies.js` instead of RLS, a Durable Object instead of Realtime, and
  Worker endpoints instead of Edge Functions. See [`apps/learning/BACKEND.md`](./apps/learning/BACKEND.md).
- **Hosting:** the architecture doc proposes Cloudflare Pages/Netlify. Production is
  **Cloudflare Workers Static Assets**; the UI is a static export, so the doc's
  API-route/SSR variants do not apply.
- **File storage:** lesson PDFs are in a private Cloudflare R2 bucket bound to the Worker.
- **Auth:** username + password sign-in, plus `admin`/`super_admin` roles that the
  architecture doc does not describe.
- **Duas admin:** `/admin/duas` and its tables are outside the architecture doc.
- **Router:** using Next.js **App Router** rather than the Pages Router file
  examples shown in architecture §19 (e.g. `pages/teach/[lessonId].tsx` →
  `app/teach/[lessonId]/page.tsx`). Same dynamic-route convention, App Router
  is Next's current default/recommended approach. No functional impact.
- **Local dev backend:** `wrangler dev` (`npm run dev:api`) with local D1/R2/Durable
  Object state — no Docker and no hosted dev project.
- **Architecture doc location:** kept at repo root (`Iqra-space-architecture.md`)
  instead of `docs/architecture.md` per §19, to avoid duplicating/renaming the
  file the user already has open. Purely cosmetic.
- **Phases 1–5 collapsed into one pass** (2026-08-29, at the user's explicit
  request, matching a supplied HTML product demo): the PDF viewer, live
  highlight-sync, attendance, schedule, progress, notes and notifications
  originally spread across architecture §20's Phases 2–5 are implemented now
  rather than later. See docs/PROGRESS.md's "Phase 1 (expanded scope)" entry.
- **Google Drive/Calendar OAuth is the one deliberate exception**: it needs a
  Google Cloud OAuth client (client ID/secret) that only the project owner
  can provision — not something achievable from this environment. The
  "Connect Google Drive" UI builds a real consent-screen redirect, but the
  server-side token exchange was never deployed (it would need porting to the
  Worker API), and the feature correctly shows a "not configured" state rather
  than faking a connection. Direct PDF upload to R2 (architecture §8's own
  "simpler fallback... recommended for the very first MVP cut") is the
  fully-working path for lesson materials today. Google Meet uses architecture §9's Option A (manual link) — no OAuth
  needed there at all, and it's fully functional.
