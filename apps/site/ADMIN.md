# apps/site on Cloudflare - contact form admin & setup

`apps/site` is a Cloudflare Worker with Static Assets (the HTML pages, built
into `dist/` by `npm run build:cf`) plus a small Worker (`worker/`) that
handles `POST /api/contact` and stores messages in a **D1** database.
`/quran*` and `/learning*` are separate Workers bound to their own path
routes; this Worker does not proxy them.

## What "admin area" means here

There is no custom admin UI. Messages live in the D1 database
`iqraspace-site`, table `contact_messages` (`id`, `name`, `email`, `subject`,
`message`, `status` = `new` | `read` | `resolved`, `created_at` ISO text).
Read and manage them from the Cloudflare dashboard (Storage & Databases ->
D1 -> `iqraspace-site` -> Console / Tables) or with Wrangler from `apps/site`:

```bash
# newest messages
npx wrangler d1 execute DB --remote --command "SELECT id, created_at, status, name, email, subject FROM contact_messages ORDER BY created_at DESC LIMIT 20"
# read one in full
npx wrangler d1 execute DB --remote --command "SELECT * FROM contact_messages WHERE id = '<id>'"
# mark status
npx wrangler d1 execute DB --remote --command "UPDATE contact_messages SET status = 'read' WHERE id = '<id>'"
# delete (e.g. on a deletion request - see privacy.html)
npx wrangler d1 execute DB --remote --command "DELETE FROM contact_messages WHERE id = '<id>'"
```
There is no public access path to the table; only the Worker's `DB` binding
and your Cloudflare account can reach it. Reply from your own email client.

> The old Supabase table (`supabase/migrations/0001_contact_messages.sql`) is
> **superseded by D1** and kept only as history. The Supabase project for the
> contact form is no longer used and can be exported/deleted once you have
> copied over anything you want to keep.

## One-time setup (owner only)

All commands run from `apps/site`. `npm install` first (installs Wrangler).

### 1. Create the D1 database and apply the migration
```bash
npx wrangler login
npx wrangler d1 create iqraspace-site
# copy the printed database_id into wrangler.jsonc (replace REPLACE_AFTER_d1_create)
npx wrangler d1 migrations apply DB --remote     # applies d1/migrations/0001_contact_messages.sql
```

### 2. Cloudflare Turnstile (spam protection)
1. Cloudflare dashboard -> **Turnstile** -> add a site. Domain `iqraspace.org`
   (add `localhost` to test locally). Widget mode **Managed**.
2. Copy the **Site Key** and **Secret Key**.
3. **OWNER TODO:** `contact.html` still contains the placeholder
   `data-sitekey="YOUR_TURNSTILE_SITE_KEY"`. Replace it with the real Site Key
   (public, safe to commit). Until then the widget is hidden and, if the secret
   is set, every submission is rejected as unverified - do both together.
4. Store the secret (never in a file in this repo):
   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```
   If `TURNSTILE_SECRET_KEY` is unset, the captcha check is skipped so the form
   works before setup is finished. If it is set and Cloudflare cannot be
   reached, submissions are rejected (fail closed).

### 3. Optional email alert (Resend)
Workers cannot use Gmail SMTP. Alerts use the Resend HTTPS API; if not
configured they are skipped silently (messages are always stored first, and an
alert failure never fails the request).
Create a Resend account, verify a sending domain, create an API key, then:
```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CONTACT_FROM_EMAIL      # e.g. contact@iqraspace.org (verified sender)
npx wrangler secret put CONTACT_ALERT_EMAIL     # optional; defaults to iqraspaceorg@gmail.com
```

### 4. Deploy and routes
```bash
npm run build:cf
npx wrangler deploy
```
`wrangler.jsonc` binds the route `iqraspace.org/*` (zone `iqraspace.org`).
`/quran*` and `/learning*` routes belong to their own Workers and win because
they are more specific. The Gmail/Supabase/Vercel env vars from the old setup
are no longer used.

### 5. www -> apex redirect
Handled by a Cloudflare **Redirect Rule**, not the Worker (static pages never
invoke the Worker): Rules -> Redirect Rules -> custom filter
`Hostname equals www.iqraspace.org` -> Dynamic redirect to
`concat("https://iqraspace.org", http.request.uri.path)` preserving query
string, status 301. The `www` DNS record must exist and be proxied (orange
cloud).

## Required names at a glance

| Name | Kind | Required? |
|---|---|---|
| `DB` | D1 binding (wrangler.jsonc) | yes |
| `ASSETS` | assets binding (wrangler.jsonc) | yes |
| `TURNSTILE_SECRET_KEY` | secret | recommended (skipped if unset) |
| `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` | secrets | only for email alerts |
| `CONTACT_ALERT_EMAIL` | secret/var | optional |

## Local development
```bash
npm run build:cf
npx wrangler d1 migrations apply DB --local
npx wrangler dev --local      # http://localhost:8787
```
Local secrets go in `apps/site/.dev.vars` (gitignored; see
`.env.local.example` for the names). Tests: `npm test`.

## How it works at a glance

1. Visitor submits the form on `/contact`; `site.js` validates, then POSTs JSON
   (`name`, `email`, `subject`, `message`, `company` honeypot, `startedAt`,
   `turnstileToken`) to `/api/contact`.
2. `worker/index.js` -> `worker/contact.js` re-validates, silently drops bot
   submissions (filled honeypot, or under 3 seconds after page load), verifies
   Turnstile, inserts into D1, then best-effort sends the Resend alert.
3. Responses: `200 {ok:true}`, `400 {ok:false, errors:{field:msg}}`,
   `405`, `500 {ok:false, error}`.
4. Security headers/CSP are in `dist/_headers`, generated by `scripts/build.mjs`.

## Known limitations

- No rate limiting beyond Turnstile + honeypot + fill-time check (could use
  Workers rate limiting binding later).
- No reply-from-dashboard feature.
