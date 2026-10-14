---
name: iqs-run
description: Start IqraSpace's apps locally (site, Quran reader, Learning, Flutter reader) and give the user clickable links to access each one, plus the live production URLs. Trigger when the user says "iqs-run".
---

# iqs-run

Launch the requested IqraSpace apps and report **links to access each**.
Default = all four. If the user names apps (e.g. "iqs-run quran learning"),
start only those. Never run `wrangler deploy` — local dev only.

## Apps, ports, links

| App | Start (run in background) | Local link | Live link |
|---|---|---|---|
| Site (`apps/site`) | `cd apps/site && npm run dev:cf` (builds, then `wrangler dev`) | http://localhost:8787/ (also `/duas`, `/explore`, `/contact`) | https://iqraspace.org/ |
| Quran reader (`apps/quran`) | `cd apps/quran && npm run dev` | http://localhost:3001/ | https://iqraspace.org/quran |
| Learning (`apps/learning`) | `cd apps/learning && npm run dev` | http://localhost:3000/ (login: `/login`) | https://iqraspace.org/learning |
| Flutter reader (`apps/mobile/android`) | `cd apps/mobile/android && flutter run -d web-server --web-port 3002` (or `-d chrome`) | http://localhost:3002/ | Android app only (Play Console) — not on web |

Notes: Quran and Learning only apply their `/quran` / `/learning` basePath when `NEXT_BASE_PATH` is set (production build). In local dev it is unset, so they serve at the **root** — `localhost:3001/quran` and `localhost:3000/learning` 404. Site `/duas` data comes from `/api/duas` (Worker), so it only works under `wrangler dev`.

## Steps

1. For each selected app, check `node_modules` exists (`npm install` if
   missing; `flutter pub get` for Flutter). Check the port is free
   (`netstat -ano | findstr :PORT`); if taken, say so and reuse the link
   instead of starting a duplicate.
2. Start each dev server with `run_in_background`. Never block on them.
3. Wait for readiness (poll with `curl -s -o /dev/null -w "%{http_code}"`
   against the local link (`/` for each app), a few tries) — a 200 means up. Flutter web
   takes longest; allow ~2 minutes.
4. Report a table: app, status (up / failed / already running), local
   link, live link. Include the failing log tail for any app that did not
   come up.
5. Mention how to stop them (TaskStop / Ctrl+C) and that
   `apps/learning` needs its API running locally to log in (`npm run dev:api` in apps/learning, with `NEXT_PUBLIC_API_URL=http://localhost:8787/learning/api` in `.env.local`; see apps/learning/BACKEND.md).
