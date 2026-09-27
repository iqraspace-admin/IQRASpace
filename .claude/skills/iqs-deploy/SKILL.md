---
name: iqs-deploy
description: Run IqraSpace's Flutter (apps/mobile/android) Android production deployment workflow — validate, bump the build number, build a signed release .aab, verify it, upload it to Play Console's closed testing track, and report. Trigger when the user says "iqs-deploy".
---

# iqs-deploy

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

## 0. Inspect

- `git -C apps/mobile/android status --short` — note any uncommitted changes.
  This skill will itself commit exactly one file (the `pubspec.yaml`
  version bump, step 2) — do not stash, discard, or otherwise touch
  unrelated in-progress work; if there are unrelated uncommitted changes,
  proceed but call them out in the final report rather than silently
  including or discarding them.
- Confirm `apps/mobile/android/android/key.properties` exists. If missing, stop
  here and report FAILED — signing setup is owner-only (DEPLOYMENT.md
  §3) and cannot be created from this session.
- Read `apps/mobile/android/pubspec.yaml`'s `version:` line to know the current
  version before bumping it in step 2.

## 1. Validate

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

## 2. Build — bump the version

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

## 3. Generate .aab

From `apps/mobile/android`:
```
flutter build appbundle --release
```
Expected output: `apps/mobile/android/build/app/outputs/bundle/release/app-release.aab`.

If this fails, the whole run is FAILED — do not proceed to Deploy, and
do not report AAB or overall success.

## 4. Verify (build artifact)

- Confirm the `.aab` file exists on disk and has non-trivial size (reject
  a 0-byte or missing file as a failure, don't just check the build
  command's exit code).
- Cross-check that the version you bumped in step 2 is what actually got
  built (the `.aab`'s embedded version comes directly from
  `pubspec.yaml`, so this is mostly a sanity check that step 2's edit
  didn't get reverted/overwritten).

## 5. Deploy (Play Console closed testing track)

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

## 6. Verify (post-deploy)

- Confirm the upload script exited `0` and printed a successful upload
  with a `versionCode` matching the `.aab` you built.
- The Play Console pre-launch report and processing take a few minutes
  after upload — this skill can't wait on that synchronously. Note that
  in the report rather than claiming it's fully processed.

## 7. Report

Always end with this exact structure, filled in truthfully — never mark
a line SUCCESS unless it actually happened as verified above:

```
iqs-deploy: SUCCESS / FAILED
Android Build: SUCCESS / FAILED
AAB: SUCCESS / FAILED

Version: x.x.x
Build: xxx
AAB: <exact .aab path>

Changes:
- <brief summary>

Verification:
- <brief summary — what was actually checked: analyze/test results, file
  existence+size, uploaded versionCode, closed-track link>
```

`iqs-deploy: SUCCESS` requires validate + build + AAB verification +
Play closed-track upload to all have actually succeeded. If the Deploy
step failed only due to missing owner credentials (step 5), mark
`AAB: SUCCESS` but `iqs-deploy: FAILED`, and say exactly what's needed
(point at DEPLOYMENT.md §9) rather than guessing. If it failed because
the `alpha` track itself doesn't exist yet or has no testers configured
in Play Console, report that distinctly too — that's also owner-only
Play Console setup, separate from the API credentials in §9.
