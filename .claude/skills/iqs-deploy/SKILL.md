---
name: iqs-deploy
description: Run IqraSpace's full production deployment workflow — validate and deploy the website (apps/quran + apps/site) to production, and build/upload the Android app (apps/mobile/android) to Play Console's closed testing track. Trigger when the user says "iqs-deploy".
---

# iqs-deploy

Runs the full release pipeline for **the website** (`apps/quran` +
`apps/site`, both served under `iqraspace.org`), **the Learning app**
(`apps/learning`, served at `iqraspace.org/learning`) and **the Android
app** (`apps/mobile/android`, IqraSpace Quran Flutter reader,
`org.iqraspace.app`): **Inspect → Validate → Build → Deploy → Verify →
Report**, for each, then one combined final report (see "Combined
Report" at the end).

Both halves run every invocation unless one genuinely has nothing to
ship (see each half's own Inspect step) — this skill doesn't ask "which
one do you want" by default.

Never bypass, skip, or hide a build/test/validate failure in either half
to make this pipeline "pass." Fix the genuine root cause, or stop and
report that half as FAILED with the real reason.

---

## Website (apps/quran + apps/site)

**Hard rule: this repo's actual deploy mechanism for both apps is
`wrangler deploy` running *inside GitHub Actions* (`ci-quran.yml` /
`ci-site.yml`, via `cloudflare/wrangler-action@v3`), gated on a push to
`main` AND on the repository variable `CF_DEPLOY_ENABLED == 'true'`,
using the repo secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` —
never a locally-run `wrangler` command.** This session has no Cloudflare
credentials (they are CI-only) and no `gh` CLI, so it cannot
authenticate or directly dispatch/inspect a GitHub Actions run.
**"Deploy" for the website therefore means: validate locally exactly
like CI would, get the change safely onto `main` (which is what
actually triggers the real deploy), then poll the same live production
health-check endpoints CI itself checks.** Never run `wrangler deploy`,
`wrangler secret`, `wrangler d1 ...`, or any other direct Cloudflare
mutation from this session, and never read `.env*`/`.dev.vars` files —
that would bypass the deliberate CI-only, path-filtered, health-checked
pipeline (see root `DEPLOYMENT.md`). If `CF_DEPLOY_ENABLED` is not set to
`true`, a push to `main` only runs `validate` and nothing deploys; say
so in the report if the live site doesn't change (the owner sets the
variable and Cloudflare token — see root `DEPLOYMENT.md`).

### W0. Inspect

- `git status --short` (repo root) — note all uncommitted changes,
  tracked and untracked.
- `git branch --show-current`, then `git fetch origin --prune` and
  compare local `main` to `origin/main` (ahead/behind).
- Determine which of `apps/quran/**` and `apps/site/**` actually have
  pending changes — either uncommitted locally, or committed locally but
  not yet on `origin/main`. Both `ci-quran.yml` and `ci-site.yml` are
  path-filtered, so a push only redeploys the app(s) whose files
  actually changed; if **neither** app has anything pending, skip
  straight to reporting `Website: NOTHING TO DEPLOY` rather than forcing
  an empty push.
- Do not stash, discard, or reset anything found here. If unrelated
  work-in-progress exists alongside the changes meant to ship, call it
  out in the final report rather than silently bundling or dropping it.

### W1. Validate (mirrors each app's own CI `validate` job exactly)

For **apps/quran**, only if it has pending changes, from `apps/quran`:
```
npm ci                       # if node_modules is missing/stale
npm run lint
npx next typegen             # tsc needs next-env.d.ts / .next/types — CI does this too
npm run typecheck
npm run test --if-present    # matches CI exactly
npm run build:cf
```

For **apps/site**, only if it has pending changes, from `apps/site`:
```
npm install                  # if node_modules is missing/stale
npm run test --if-present
node --test worker/*.test.mjs   # only if worker/*.test.mjs exists
npx --yes html-validate index.html
npm run build:cf
```

If any check fails: diagnose and fix the real cause in the source —
never weaken a lint rule, skip a test, or otherwise mask a failure just
to get a clean run. If it isn't something this skill can legitimately
fix (needs a product decision), stop here and report `Website: FAILED`
with the specific error — do not push a change that would fail CI's own
identical checks.

### W2. Commit & push to `main`

Apply the same discipline `iqs-git` uses (see that skill for the full
secret/generated-file screening list) before committing anything:

- Screen `git status --short` / the diff for secrets (any `.env*`
  besides an already-committed `.env.*.example` template, tokens, keys,
  service-account JSON), generated/build output (`node_modules/`,
  `.next/`, `dist/`), and anything unrelated to this deploy. Unstage or
  exclude anything that matches — never `git add -A` / `git add .`
  blindly.
- Stage and commit only the reviewed files:
  `git add <files...> && git commit -m "<type>(<app>): <summary>"` using
  the attribution trailer from the system reminder (skip this bullet if
  everything relevant is already committed).
- If the current branch is **not** `main`: `git fetch origin`,
  `git checkout main`, `git pull origin main`, then
  `git merge --no-ff <source-branch>`. Resolve any real conflicts by
  reading both sides in full context — never blindly take one side
  wholesale; if a conflict is a genuine semantic disagreement and
  neither side obviously wins, **stop and ask** rather than guessing.
  Re-run W1's validate steps on the merged result before pushing.
- `git push origin main`. If rejected because the remote moved,
  `git pull origin main` (a merge, resolved the same careful way) and
  retry — never `--force`.
- Never push if W1 failed and wasn't genuinely fixed.

### W3. Deploy (automatic — the push in W2 *is* the trigger)

`ci-quran.yml` and/or `ci-site.yml` (whichever app(s) had files in
the push) now run their own `validate` job again and, because this is a
push to `main` with `CF_DEPLOY_ENABLED == 'true'`, their `deploy` job —
`npm run build:cf` + `wrangler deploy` against the real Cloudflare
Worker, using CI-only secrets this session doesn't have. Nothing further
to run locally for this step.

### W4. Verify (post-deploy health check)

A Workers deploy plus the CI health check typically takes a few minutes.
Poll rather than checking once immediately after pushing — retry every
~30s for up to ~5-6 minutes if a path doesn't return 200 right away:

```
# apps/quran — only if it was deployed
for path in /quran /quran/surah /quran/sitemap.xml; do
  curl -s -o /dev/null -w "%{http_code} $path
" "https://iqraspace.org$path"
done

# apps/site — only if it was deployed
for path in / /robots.txt /sitemap.xml; do
  curl -s -o /dev/null -w "%{http_code} $path
" "https://iqraspace.org$path"
done
```

(If the repo variable `CF_HEALTHCHECK_BASE` points CI at a `workers.dev`
URL during staging, `iqraspace.org` may still be served by the old host —
say so rather than reporting production as verified.)

**Be honest about what this does and doesn't prove.** A passing check
confirms the site is reachable and healthy after pushing — the same
thing CI's own health check confirms — but this session has no `gh` CLI
token, so it **cannot** directly confirm the specific GitHub
Actions run for this push actually succeeded, or distinguish "the new
deploy is live" from "the previous deploy is still serving because the
new one is still building or silently failed after checkout." State
this limitation plainly in the report rather than claiming full
certainty — point the user at the Actions tab or the Cloudflare dashboard (Workers → Deployments)
if they want that stronger confirmation.

If a health check still fails after the full wait window, report
`Website: FAILED` with which path(s) failed and the HTTP code seen — do
not claim success.

---

## Learning (apps/learning)

Same mechanism as the website: deploy is `ci.yml` running `wrangler deploy` (Worker
`iqraspace-learning`) on a push to `main` (path-filtered to `apps/learning/**`), gated by
`CF_DEPLOY_ENABLED == 'true'`, with CI-only Cloudflare secrets this session does not have.
Never run `wrangler` locally. "Deploy" = validate like CI, get the change onto `main`, then poll
the live health endpoints.

### L0. Inspect
- Pending changes under `apps/learning/**` (uncommitted or not yet on `origin/main`) **and** under the
  repo-root `supabase/migrations/` (the Learning database history). If neither has anything, report
  `Learning: NOTHING TO DEPLOY`.
- **Database migrations are NOT applied by this pipeline.** CI never runs `supabase db push`. If any
  `supabase/migrations/*.sql` file is new on this push, say plainly in the report that the owner must run
  `npx supabase db push` (repo root, linked project) — and that any new Learning pages depending on those
  tables will error in production until it is run. Never read `.env*`/credential files to try to apply it.

### L1. Validate (mirrors ci.yml), from `apps/learning`
```
npm ci                       # if node_modules missing/stale
npm run lint
npx next typegen
npm run typecheck
npm run test:duas            # pure-logic unit tests
node --test worker/*.test.mjs   # only if worker/*.test.mjs exists
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder npm run build:cf
```
(The placeholder public env vars go on the command line only — never into a file.) Fix real failures at
the source; never weaken a rule or skip a test.

### L2. Commit & push
Same screening and commit discipline as W2 (no secrets/env files/build output; never `git add -A`; no
force-push; merge to `main` carefully if on another branch). Learning and website changes may go in the
same push.

### L3. Deploy — the push is the trigger (`ci.yml`).

### L4. Verify
Poll every ~30s for up to ~6 min:
```
curl -s -o /dev/null -w "%{http_code} https://iqraspace.org/learning/login
" https://iqraspace.org/learning/login
curl -s -o /dev/null -w "%{http_code} https://iqraspace.org/learning/share/00000000-0000-0000-0000-000000000000
" https://iqraspace.org/learning/share/00000000-0000-0000-0000-000000000000
```
For a change that adds a route, also request the new route (it is behind client-side auth, so expect 200 or a
redirect to login, not 404), e.g. `/learning/admin/duas`. Same honesty caveat as W4: this cannot prove which
GitHub Actions run produced what is live.

---

## Android (apps/mobile/android)

Runs the full release pipeline for `apps/mobile/android` (IqraSpace Quran
Flutter reader, `org.iqraspace.app`): **Inspect → Validate → Build →
Generate .aab → Deploy → Verify → Report**.

**Hard rule: Deploy always means uploading to Play Console's closed
testing track (`alpha`), and nothing else.** Never target production —
promoting past closed testing is a manual, owner-driven decision per
`apps/mobile/android/DEPLOYMENT.md` §6, made once the 20-tester/14-day
closed-testing bar and pre-launch report review are satisfied. The
upload script (`apps/mobile/android/scripts/deploy/upload-to-play.mjs`)
hardcodes the `alpha` track for this reason — do not edit it to take a
track argument or point it anywhere else as part of running this skill.
That track must already have its own tester list configured in Play
Console (owner-only, one-time) — this skill only uploads a build to it,
it never creates the track or manages testers.

Every invocation must produce a real signed `.aab` and verify it exists
on disk before claiming success. If `.aab` generation fails, the overall
result is FAILED — never report success without the file existing.
Never bypass, skip, or hide a build/test/analyze failure to make this
pipeline "pass" — fix the genuine root cause, or stop and report FAILED
with the real reason.

### A0. Inspect

- `git -C apps/mobile/android status --short` — note any uncommitted changes.
  This skill will itself commit exactly one file (the `pubspec.yaml`
  version bump, step A2) — do not stash, discard, or otherwise touch
  unrelated in-progress work; if there are unrelated uncommitted changes,
  proceed but call them out in the final report rather than silently
  including or discarding them.
- Confirm `apps/mobile/android/android/key.properties` exists. If missing, stop
  here and report FAILED — signing setup is owner-only (DEPLOYMENT.md
  §3) and cannot be created from this session.
- Read `apps/mobile/android/pubspec.yaml`'s `version:` line to know the current
  version before bumping it in step A2.

### A1. Validate

From `apps/mobile/android`:
```
flutter analyze
flutter test
```
Both must be clean. If either fails:
- Diagnose the real cause and fix genuine bugs in the source.
- Do not silently disable/skip failing tests, weaken lint rules, or
  otherwise mask the failure just to get a green run.
- If you fix something, re-run both commands before continuing.
- If a failure isn't something you can legitimately fix (e.g. needs a
  product decision), stop and report FAILED with the specific error.

### A2. Build — bump the version

Per `apps/mobile/android/CLAUDE.md`: bump only the `+N` build number by default
(e.g. `0.3.0+8` → `0.3.0+9`). Only bump the `x.y.z` part too if the user
explicitly asked for a version bump this invocation, or the changes
being shipped are a genuine user-visible release.

- Edit `apps/mobile/android/pubspec.yaml`'s `version:` line accordingly.
- Commit just this file:
  `git -C apps/mobile/android add pubspec.yaml && git -C apps/mobile/android commit -m "chore(flutter): bump build number to <new version>"`
  using the attribution trailer from the system reminder.
- Do not push. Mention in the final report that the bump is committed
  locally and needs a manual push.

### A3. Generate .aab

From `apps/mobile/android`:
```
flutter build appbundle --release
```
Expected output: `apps/mobile/android/build/app/outputs/bundle/release/app-release.aab`.

If this fails, the whole run is FAILED — do not proceed to Deploy, and
do not report AAB or overall success.

### A4. Verify (build artifact)

- Confirm the `.aab` file exists on disk and has non-trivial size (reject
  a 0-byte or missing file as a failure, don't just check the build
  command's exit code).
- Cross-check that the version you bumped in step A2 is what actually got
  built (the `.aab`'s embedded version comes directly from
  `pubspec.yaml`, so this is mostly a sanity check that step A2's edit
  didn't get reverted/overwritten).

### A5. Deploy (Play Console closed testing track)

Check `apps/mobile/android/scripts/deploy/.env.local` exists and
`PLAY_SERVICE_ACCOUNT_JSON_PATH` is set:
- If missing: this is the one-time owner-only setup described in
  `apps/mobile/android/DEPLOYMENT.md` §9 (Google Cloud service account, Play
  Console permission grant). Do not attempt to create GCP/Play Console
  resources yourself. Stop the Deploy step, report it as FAILED with
  this exact reason, but still report the AAB build itself as SUCCESS
  since it did complete and was verified — the two are reported
  separately.
- If present but `apps/mobile/android/scripts/deploy/node_modules` is missing,
  run `npm install --prefix apps/mobile/android/scripts/deploy` first.
- Then run (from `apps/mobile/android/scripts/deploy`):
  ```
  node --env-file=.env.local upload-to-play.mjs ../../build/app/outputs/bundle/release/app-release.aab
  ```
- The script only ever uploads to the `alpha` (closed testing) track
  (hardcoded — see the hard rule above). Capture the `versionCode` it
  reports uploading.

### A6. Verify (post-deploy)

- Confirm the upload script exited `0` and printed a successful upload
  with a `versionCode` matching the `.aab` you built.
- The Play Console pre-launch report and processing take a few minutes
  after upload — this skill can't wait on that synchronously. Note that
  in the report rather than claiming it's fully processed.

---

## Combined Report

Always end with this exact structure, filled in truthfully — never mark
a line SUCCESS unless it actually happened as verified above. Both
halves always report here, even if one had nothing to do or was
skipped.

```
iqs-deploy: SUCCESS / PARTIAL / FAILED

Website
  Status: SUCCESS / FAILED / NOTHING TO DEPLOY
  Apps deployed: apps/quran / apps/site / both / none
  Commit pushed: <sha> <subject>  (or "n/a")
  Validate: <apps/quran and/or apps/site check results>
  Production URL(s): https://iqraspace.org , https://iqraspace.org/quran
  Health check: <per-path HTTP codes>
  Note: <the "cannot confirm the exact GitHub Actions run" caveat from W4,
  every time — never omit it just because checks passed>

Learning
  Status: SUCCESS / FAILED / NOTHING TO DEPLOY
  Commit pushed: <sha> <subject>  (or "n/a")
  Validate: <lint / typecheck / test:duas / build results>
  Production URL(s): https://iqraspace.org/learning
  Health check: <per-path HTTP codes>
  DB migrations: <new files under supabase/migrations and whether the owner has applied them — never claim applied unless verified>
  Note: <the same "cannot confirm the exact GitHub Actions run" caveat>

Android
  Status: SUCCESS / FAILED
  Version: x.x.x
  Build: xxx
  AAB: <exact .aab path>
  Validate: flutter analyze/test results
  Deploy: Play Console closed-track (alpha) upload result / versionCode

Errors/warnings:
- <anything needing the owner's attention from either half — missing
  credentials, a check that couldn't be fixed, unrelated uncommitted
  changes noticed along the way, etc. "None" if genuinely nothing>
```

`iqs-deploy: SUCCESS` requires **every** half (website, Learning, Android) to have actually
succeeded as verified above (or a half legitimately had nothing to
deploy). Use `PARTIAL` when one half succeeded and the other failed or
is blocked on something owner-only (missing Play Console credentials
per A5; a website check that can't fully verify without `gh`
access, or CF_DEPLOY_ENABLED not set, per W4) — say exactly which half and why. Use `FAILED` only when
neither half completed successfully. Never describe either half as
production-verified beyond what was actually checked.
