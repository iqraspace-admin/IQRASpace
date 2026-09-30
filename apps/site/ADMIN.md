# Contact form — admin area & setup

## What "admin area" means here

There is no custom admin UI. Managing contact messages means logging into
the **Supabase dashboard** (Table Editor) for the small, dedicated Supabase
project below — it already gives you search, filtering, editing the
`status` column (`new` / `read` / `resolved`), and deleting rows, with no
code to build or maintain. This was a deliberate choice over building a
custom login+UI (see the conversation this was decided in) to keep
`apps/site` simple and avoid adding a whole authentication system for what
is, at this project's scale, a handful of messages.

The `contact_messages` table has Row Level Security enabled with **no
policies** — the public Supabase API (the only key ever shipped to the
browser doesn't even exist here; there is no anon key in the client)
cannot read or write it. The only two ways in are the Supabase dashboard
(you, signed in as the project owner) and the `service_role` key, which
only `api/contact.js` holds, server-side, in Vercel.

## One-time setup (all manual — only the project owner can do these)

### 1. Create the Supabase project
1. In the [Supabase dashboard](https://supabase.com/dashboard), create a
   **new project** (Free tier) — e.g. named `iqraspace-site`. Use the
   `iqraspaceorg@gmail.com` Google account or whichever account should own
   it, consistent with `apps/quran` and `apps/learning` each having their
   own separate project.
2. Note the project's **Project URL** and **`service_role` secret key**
   (Project Settings → API). The `service_role` key is highly privileged —
   never put it in any client-side code, `NEXT_PUBLIC_*` var, or commit.

### 2. Apply the migration
From `apps/site`:
```bash
npx supabase login                      # if not already logged in
npx supabase link --project-ref <ref>   # <ref> is in the project URL / Settings → General
npx supabase db push                    # applies supabase/migrations/0001_contact_messages.sql
```
This creates the `contact_messages` table with RLS enabled and no
policies, as described above.

### 3. Create a Gmail App Password for the alert email
1. Turn on **2-Step Verification** for `iqraspaceorg@gmail.com` if it isn't
   already (Google Account → Security).
2. Go to <https://myaccount.google.com/apppasswords>, create an app
   password (any label, e.g. "IqraSpace contact form"). Copy the 16-character
   password — Google only shows it once.

### 4. Create a Cloudflare Turnstile widget (spam protection)
`iqraspace.org`'s DNS already lives on Cloudflare, so this uses the same
account — no new vendor.
1. In the [Cloudflare dashboard](https://dash.cloudflare.com) → **Turnstile**,
   add a site. Domain: `iqraspace.org` (add `localhost` too if you want to
   test locally). Widget mode: **Managed** (the default — shows a checkbox,
   only challenges suspicious traffic).
2. Copy the **Site Key** and **Secret Key** it gives you.
3. Open `apps/site/contact.html`, find `data-sitekey="YOUR_TURNSTILE_SITE_KEY"`
   and replace `YOUR_TURNSTILE_SITE_KEY` with the real Site Key. (The site
   key is meant to be public — it's safe to commit; it's already visible in
   every visitor's page source. The Secret Key is not — it only goes in the
   Vercel env var below, never in any file in this repo.)

### 5. Add environment variables to the Vercel project
In `apps/site`'s Vercel project → **Settings → Environment Variables**,
add (Production, and Preview if you want to test on PR deploys):

| Name | Value |
|---|---|
| `SUPABASE_URL` | the Project URL from step 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | the `service_role` key from step 1 |
| `GMAIL_USER` | `iqraspaceorg@gmail.com` |
| `GMAIL_APP_PASSWORD` | the app password from step 3 |
| `TURNSTILE_SECRET_KEY` | the Secret Key from step 4 |
| `CONTACT_ALERT_EMAIL` | `iqraspaceorg@gmail.com` (optional — this is the default if unset) |

Redeploy after adding these (env var changes don't apply to already-running
deployments, and `contact.html`'s site-key edit needs a redeploy too).

Until `TURNSTILE_SECRET_KEY` is set, `api/contact.js` skips the captcha
check entirely rather than blocking real visitors on an unfinished setup —
so it's safe to ship the widget and finish this step slightly later.

### 6. Local testing (optional)
Copy `.env.local.example` to `.env.local` in `apps/site` and fill in the
same values, then run `vercel dev` from `apps/site` to test `/api/contact`
locally against the real Supabase project and Gmail SMTP.

## How it works at a glance

1. Visitor submits the form on `/contact`. Cloudflare Turnstile (a
   checkbox widget, usually invisible/automatic for real visitors) must
   complete before the form allows submitting.
2. `site.js` validates client-side, then `POST`s JSON to `/api/contact`,
   including the Turnstile token.
3. `api/contact.js` (Vercel serverless function) re-validates server-side,
   silently drops obvious bot submissions (a filled honeypot field, or a
   submission faster than 3 seconds after the page loaded), verifies the
   Turnstile token with Cloudflare, then:
   - inserts the message into `contact_messages` using the `service_role`
     key, and
   - best-effort emails an alert to `iqraspaceorg@gmail.com` over Gmail
     SMTP. If the email fails to send, the message is still saved — check
     Vercel's function logs for the error, and the message itself in
     Supabase's Table Editor either way.
4. You check new messages in Supabase's Table Editor (sort by
   `created_at`, filter by `status`), and reply directly to the sender's
   email address from your own inbox.

## Known limitations (by design, at this project's scale)

- No rate limiting beyond the above (Vercel serverless functions are
  stateless; proper rate limiting would need a KV store, which isn't
  justified yet — Turnstile already handles the bulk of automated spam).
- No reply-from-the-dashboard feature — you reply from your own email
  client, same as any other email.
