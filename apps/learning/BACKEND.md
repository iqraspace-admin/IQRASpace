# apps/learning — backend (Cloudflare Worker + D1 + R2 + Durable Objects)

The Learning app's backend runs entirely inside the `iqraspace-learning` Cloudflare Worker. The
same Worker serves the static Next.js export and, for `/learning/api/*`, the API:

```
browser (static Next.js export, src/lib/db.ts)
   │  bearer token (localStorage)          WebSocket (?token=)
   ▼                                        ▼
iqraspace-learning Worker ── /learning/api/* ── worker/api/index.js
   ├── D1  "iqraspace-learning"   (binding DB)        all app data
   ├── R2  "iqraspace-learning"   (binding MATERIALS) lesson PDFs, under learning/
   └── Durable Object LessonRoom  (binding LESSON_ROOMS) live Teach → Share sync
```

There are no secrets: every resource is a Worker binding (`wrangler.jsonc`). Nothing else in the
monorepo talks to D1; `apps/site` reads the public Duas feed through a service binding, and the
Flutter app reads the same feed over HTTPS.

## API surface

| Path (under `/learning/api`) | Auth | What |
|---|---|---|
| `POST /auth/login` `{username,password}` | — | → `{token, user}`; deactivated accounts get `user_banned` |
| `POST /auth/signup` | — | tutor/student/guardian only, never admin |
| `GET /auth/session`, `POST /auth/logout` | token | current profile / revoke this session |
| `POST /db` | token | one query description from `src/lib/db.ts` (select/insert/upsert/update/delete) |
| `POST /rpc/<name>` | token | `set_user_role`, `add_student_to_class`, `notify_user`, `seed_student_lesson_progress` |
| `POST /admin/users` | admin | create, status, reset_password, deactivate, reactivate, delete |
| `POST /storage`, `PUT /storage/upload?filename=` | token | list, list-all (admin), delete, sign-download; upload ≤ 50 MB |
| `GET /storage/file?t=` | ticket | one-hour download link (supports `Range`, used by pdf.js) |
| `GET /realtime/<lessonId>?token=` | token | WebSocket; lesson's tutor, its class's students, or admin |
| `GET /duas/content`, `GET /duas/version` | public | published Duas only (consumed by apps/site and the Flutter app) |

## How access control works

D1 has no row-level security, so the Worker *is* the access control:

- `worker/api/schema.js` lists every reachable table and column. Identifiers in a request are
  looked up there before anything reaches SQL; values are always bound parameters. Tables not
  listed (`user_credentials`, `sessions`, `file_tickets`) and server-only columns are unreachable.
- `worker/api/policies.js` holds one rule set per table (select / insert check / update using+check /
  delete). `worker/api/query.js` ANDs them into every statement, including embedded selects.
- `worker/api/hooks.js` does what triggers would: Duas bookkeeping (`updated_*`,
  `arabic_normalized`, `published_at`), regex checks SQLite can't express, the `dua_audit_log`,
  and seeding student progress when a plan is assigned or a student joins a class.
- `users.role` can only change through the `set_user_role` RPC (admin only; nobody can drop their
  own admin access). Public signup can never create admin/super_admin.

Passwords: PBKDF2-SHA256, 100k iterations (the Workers maximum), per-user salt. Sessions: a random
256-bit bearer token; only its SHA-256 is stored; 30-day sliding expiry; revoked on password reset
(by an admin) and on deactivation.

**Changing the schema** = a new file in `d1/migrations/` + the matching `schema.js` entry (+ a
`policies.js` rule for a new table). `worker/api/api.test.mjs` fails if `schema.js` and the migration
disagree. Apply migrations manually (below) *before* merging code that needs them.

**Bulk Duas content** (not schema) goes through a reviewed catalog + generated SQL, never a
migration: `content/duas-wyn/` mirrors the Wa Iyyaka Nastaeen app's categories and Duas
(`npm run duas:wyn -- check | plan | sql`). New rows land in `review`, published rows are untouched
unless a guarded correction is opted into, and every change is audited — see
`content/duas-wyn/README.md`.

## Local development

```bash
cd apps/learning
npm install
npm run db:migrate:local             # local D1 (.wrangler/state)
npm run seed:admins                  # admin + superadmin from .env.local
npm run seed:surah-lessons           # optional: the 114-Surah lesson library
npm run dev:api                      # API on http://localhost:8787/learning/api (local D1/R2/DO)
npm run dev                          # UI on http://localhost:3000, with
                                     #   NEXT_PUBLIC_API_URL=http://localhost:8787/learning/api in .env.local
```

To try the production bundle locally instead: `npm run build:cf`, then `npm run dev:api` and open
http://localhost:8787/learning (a basePath build always uses the same-origin API).

Tests: `npm run test:worker` runs the routing tests plus the API tests, against real SQLite
(`node:sqlite`) with the D1 migrations applied: policies, compiler, hooks/audit, RPCs, auth.

## One-time production setup (owner)

1. **Create the database** and put its id in `wrangler.jsonc` (`database_id`, replacing
   `REPLACE_WITH_D1_DATABASE_ID`), commit:
   `npx wrangler d1 create iqraspace-learning`
2. **Apply the schema:** `npx wrangler d1 migrations apply iqraspace-learning --remote`
3. **Cloudflare API token** used by CI (`CLOUDFLARE_API_TOKEN`) needs, in addition to what it has:
   *Workers R2 Storage: Edit* (R2 binding) and *D1: Edit*. The R2 bucket `iqraspace-learning`
   already exists. Durable Objects need no extra permission. They are included on the Workers Free
   plan (SQLite-backed class).
4. **GitHub:** the secrets `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are no
   longer used by CI and can be deleted.

## Cutover from Supabase (one-time, owner)

The data move is a read-only export from Supabase plus an import into D1. Passwords can't be
carried over (Supabase keeps bcrypt hashes in its auth schema), so the import sets new ones (see 4).

1. Freeze Duas editing in the old admin for the duration (minutes).
2. `npm run migrate:check`: confirms every Supabase table is readable and shows row counts.
3. `npm run migrate:export`: writes `.migration/supabase-export.json` (gitignored; personal data).
4. `npm run migrate:sql`: writes `.migration/d1-import.sql`. `admin` / `superadmin` get
   `ADMIN_PASSWORD` / `SUPER_ADMIN_PASSWORD` from `.env.local`; every other account gets a random
   temporary password listed in `.migration/temp-passwords.txt`. Hand those out privately, or
   reset them in `/learning/admin/users` after go-live.
5. `npx wrangler d1 execute iqraspace-learning --remote --file .migration/d1-import.sql`
   (repeatable: it clears the tables first).
6. Merge to `main` → CI deploys the Learning Worker. Check `https://iqraspace.org/learning/api/duas/version`
   returns a string, then log in as admin.
7. Deploy `apps/site` (its `/api/duas` now reads Learning through the `LEARNING` service binding).
   **The Learning Worker must be live first.**
8. Flutter: the next release build uses
   `--dart-define=DUAS_API_URL=https://iqraspace.org/learning/api` (no key). Versions already
   installed keep calling Supabase directly; once Supabase is gone they fall back to their Hive
   cache / bundled Duas. That's safe, but they won't see new edits until they update. Decide
   how long to keep the Supabase project alive with that in mind.
9. After a soak period: delete `.migration/`, `scripts/migrate-from-supabase.mjs` and its three
   `migrate:*` npm scripts, the Supabase values in `.env.local`, and finally the Supabase project(s).

**Rollback:** redeploy the previous Learning commit (it still points at Supabase, which is
untouched by the export). Edits made in D1 after cutover would need re-entering.
