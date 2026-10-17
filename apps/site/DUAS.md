# Duas on the website (`/duas`)

Dua content is managed in the Learning app's admin area (`/learning/admin/duas`, admin / super_admin
only) and stored in Learning's Cloudflare D1 database. Only **published** Duas in **active**
categories are public, through the Learning API's read-only feed:

```
Learning admin (/learning/admin/duas) ──► Learning D1 ──► GET /learning/api/duas/content  (published only)
                                                              │
         apps/site  GET /api/duas  ◄── service binding LEARNING ┘        Flutter app (DUAS_API_URL)
```

- `apps/site/worker/duas.js` serves `GET /api/duas` by calling the Learning Worker through the
  `LEARNING` service binding (`wrangler.jsonc`; `DUAS_SOURCE_URL` is only a fallback). The result is
  edge-cached for 60 s, so an admin's publish shows up on the site within ~1–2 minutes with no
  website change or deploy. It needs no secrets.
- The feed shape is defined in `apps/learning/worker/api/duas.js` (`getDuaContent()`).

The page (`/duas`, not in the primary header nav; reached from the home Quick Access tiles, the
footer and Explore) shows categories as a grid or list (view choice is not persisted); opening a Dua
opens a side reading panel (prev/next within the category, deep-linkable via the URL hash) with the
Arabic, an optional Latin/Telugu/Urdu transliteration and English/Urdu translation (only options the
published data contains are offered; Urdu falls back to English per Dua) and a Tasbeeh counter.
Reading preferences, per-Dua counts and the last good snapshot (offline fallback) are kept in this
browser's `localStorage` only (`iqs.duas.*`); nothing is sent to a server, and the browser only
talks to this site's own `/api/duas` (CSP `connect-src 'self'`).

Deploy order: the Learning Worker (which serves the feed) must be deployed before a site deploy
that relies on the `LEARNING` binding.

**Wa Iyyaka Nastaeen content.** The site's first 23 Duas categories mirror the Wa Iyyaka Nastaeen app
(same categories, order and counts). That content enters Learning's D1 through a reviewed catalog
and an approval step (new Duas are `review` until an admin publishes them) — see
`apps/learning/content/duas-wyn/README.md`. The site needs no change for it: categories and Duas
appear here as soon as they are published.
