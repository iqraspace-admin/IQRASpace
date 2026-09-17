---
name: iqs-git
description: Safely push the latest IqraSpace code and merge it into the appropriate branch — checks status/diff, screens for secrets and unrelated changes, runs the right per-app tests/build checks, commits, pushes, merges into the correct target branch, resolves conflicts carefully, re-verifies, and reports. Trigger when the user says "iqs-git".
---

# iqs-git

**Inspect → Review Diff → Screen → Test → Commit → Push (source) →
Determine Target → Merge → Resolve Conflicts → Test Again → Push (target)
→ Report**

This repo is a monorepo of **four fully independent apps**
(`apps/learning`, `apps/quran`, `apps/flutter`, `apps/landing` — see root
`CLAUDE.md`), each with its own CI workflow, path-filtered to that app's
files. This skill mirrors that: it figures out which app(s) a change
touches and only runs the checks relevant to those apps — the same thing
each `.github/workflows/ci*.yml` does.

**Hard rule: this skill runs the real push/merge steps below — that is
its whole purpose — but only once every safety check in it passes.** It
halts and asks instead of proceeding when: the target branch is
ambiguous, a likely secret/generated/unrelated file is found, a
test/build check fails, or a merge conflict needs a semantic judgment
call it can't safely make alone. It never force-pushes, never discards
user work, never overwrites remote history, and never edits application
code just to make a git operation succeed.

## 1. Inspect current state

```
git status
git branch --show-current
git fetch origin --prune
git log --oneline -10
git log --oneline origin/<current-branch>..HEAD   # local commits not yet pushed
git log --oneline HEAD..origin/<current-branch>   # remote commits not yet local
```

Note: current branch, ahead/behind counts vs. its own remote tracking
branch, and whether the working tree has uncommitted changes (tracked
and untracked). If the branch is behind its own remote, do not overwrite
that remote history — fetch and reconcile (merge, never force) before
anything else.

## 2. Review changed files and the diff

```
git status --short
git diff                 # unstaged
git diff --cached        # staged
git diff main...HEAD     # everything this branch adds relative to main (adjust base if not merging into main)
```

Read the actual diff, not just filenames. Identify which app(s) it
touches by path prefix (`apps/learning/`, `apps/quran/`, `apps/flutter/`,
`apps/landing/`, or repo-root files like `CLAUDE.md`/`DEPLOYMENT.md`/
root `package.json`). Per root `CLAUDE.md`, changes spanning multiple
apps in one commit are unusual (apps share nothing) — if the diff
touches more than one app and that doesn't look deliberate (e.g. it's
not a docs-only or CI-config change), flag it and ask before continuing
rather than assuming it's intentional.

## 3. Screen for secrets, generated files, and unrelated changes

Check `git status --short` / the diff against all of the following
before anything gets staged or committed:

- **Secrets / credentials** — reject if present: any `.env`, `.env.*`
  (except already-committed `.env.example`-style templates),
  `key.properties`, `google-services.json`, `*.jks`, `*.keystore`,
  `service-account*.json`, `apps/flutter/scripts/deploy/.env.local`, or
  any file matching entries already in `.gitignore` (root and per-app —
  `apps/quran/.gitignore`, `apps/flutter/.gitignore`). Also scan the
  actual diff content (not just filenames) for obvious inline secrets —
  API keys, private keys, tokens, connection strings with embedded
  passwords — since a secret can land in a file that isn't named like
  one.
- **Generated / build artifacts** — reject: `node_modules/`, `.next/`,
  `dist/`, `build/`, `apps/flutter/.dart_tool/`,
  `apps/flutter/android/.gradle`, `*.apk`, `*.aab`, `.dart_tool/`,
  Supabase local artifacts already covered by `.gitignore`
  (`supabase/.branches`, `supabase/.temp`, etc).
- **Unrelated changes** — anything in the diff that has nothing to do
  with the work being pushed (leftover debug prints, commented-out
  code, IDE config, stray formatting-only churn in untouched files).

If anything above is found: **do not commit or push it.** Unstage it
(`git restore --staged <file>` — never `git checkout -- <file>` /
`git clean` without confirming first, since that discards content, not
just staging) and tell the user what was excluded and why. If a secret
was already committed in local history (not yet pushed), stop and ask
the user how they want to handle it rather than rewriting history
unilaterally.

## 4. Run the appropriate tests/build checks (pre-push)

Based on which app(s) step 2 identified, run that app's real CI-equivalent
checks — don't run all four apps' checks for a single-app change, and
don't skip an app's checks because "it's probably fine":

- **apps/learning**: `npm install --prefix apps/learning` (if
  `node_modules` missing) → `npx next typegen` (fresh-checkout caveat
  per root `CLAUDE.md`) → `npm run --prefix apps/learning lint` →
  `npm run --prefix apps/learning typecheck` → `npm run --prefix
  apps/learning build`
- **apps/quran**: same pattern from `apps/quran` — `npm install` (if
  needed) → `npm run typecheck` caveat (same `next typegen` step) →
  `npm run lint` → `npm run typecheck` → `npm run build`
- **apps/flutter**: `flutter analyze` → `flutter test` (from
  `apps/flutter`)
- **apps/landing**: validate the HTML and confirm `vercel.json` is valid
  JSON (no real build step, matching `ci-landing.yml`)
- **Root-only changes** (e.g. root `CLAUDE.md`, `package.json`
  delegator scripts): no app build is required; just sanity-check any
  changed script actually runs.

If a check fails: diagnose the real cause. Fix genuine issues in the
code being pushed. Never mask a failure by disabling a lint rule,
skipping a test, or weakening a check just to get green — and never
touch application code purely to make a git operation succeed rather
than because the code was actually wrong. If a failure isn't something
this skill can legitimately fix (needs a product decision, or the
change is stale), stop and report it as a failure — do not push.

## 5. Commit

If everything relevant is already committed, skip to step 6. Otherwise,
stage only the files reviewed and cleared in steps 2–3 (name them
explicitly — avoid `git add -A`/`git add .` for exactly this reason: an
overly broad add can vacuum in a secret or a generated file you already
decided to exclude):

```
git add <file1> <file2> ...
git commit -m "<type>(<app>): <clear, specific summary>"
```

Match this repo's existing commit style (see `git log --oneline` —
`type(scope): summary`, e.g. `feat(quran): ...`, `fix(learning): ...`,
`chore(flutter): ...`). One commit per logical change — don't create
multiple small commits for a single piece of work just to "checkpoint";
squash-worthy noise isn't checked in here in the first place. Use the
attribution trailer from the system reminder.

## 6. Push the source branch

```
git push origin <current-branch>
```

If the branch has no upstream yet: `git push -u origin <current-branch>`.
If the push is rejected because the remote has commits this branch
doesn't (someone else pushed): `git fetch origin` then `git merge
origin/<current-branch>` (never `--force`, never `rebase` a branch
that's already been pushed and might be shared) and resolve any
conflicts per step 10 before retrying the push.

## 7. Keep history clean

Before/while doing the above: no empty commits, no "wip"/"fix typo"
noise commits for work that hasn't been pushed yet (amend or `git reset
--soft HEAD~1` and recommit is fine *only* for commits that are still
local and not yet pushed — never rewrite anything already on the
remote). Don't invent extra commits just to have "a commit per step" of
this skill.

## 8. Determine the correct target branch

This repo's actual branching pattern (see `git branch -a` /
`git log --all --oneline`): short-lived, scoped feature branches per
app or concern — `feat/...`, `fix/...`, `chore/...`, `mobile/android`,
`landing/...`, `quran/...` — merge into `main`, which is the branch each
app's CI deploys from (`ci.yml`, `ci-quran.yml`, `ci-landing.yml` all
gate/deploy on `main`; `ci-flutter.yml`/`ci-quran-mobile.yml` only run on
`mobile/android` and never touch `main` directly — see root `CLAUDE.md`
CI/CD section).

- If the current branch is a feature/scoped branch and not `main`: the
  target is `main`, unless the user says otherwise.
- If the current branch already **is** `main`: there is nothing to
  merge — steps 9–12 don't apply, just confirm the push in step 6
  covered everything.
- If the branch name or situation doesn't clearly map to this pattern
  (e.g. merging one long-lived feature branch into another, or the user
  hasn't said where this should land), **stop and ask** which branch is
  the real target rather than guessing. Don't default to `main` in an
  unclear case just because it's the common case.

## 9. Merge into the target branch

```
git checkout <target-branch>
git pull origin <target-branch>          # get latest before merging in
git merge --no-ff <source-branch>
```

Use a real merge (`--no-ff`), not a rebase or squash of already-pushed
commits — the source branch may be shared/already on the remote, and
rebasing it would require a force-push, which is forbidden. `--no-ff`
also keeps an honest record that this was a feature-branch merge, which
fits this repo's branching pattern.

## 10. Resolve merge conflicts carefully

If `git merge` reports conflicts:

- Open every conflicted file and read **both** sides in full context —
  don't resolve by pattern-matching on conflict markers alone.
- Preserve intent from both branches wherever they aren't truly
  contradictory (e.g. two independent additions near the same line
  aren't a real conflict — keep both).
- Only take one side wholesale when the other side is genuinely
  superseded (confirm this by reading surrounding code/history, e.g.
  `git log -p` on the file) — never resolve by blindly taking "ours" or
  "theirs" across a whole file.
- If a conflict is a real semantic disagreement (both sides changed the
  same behavior in incompatible ways) and it isn't obvious which is
  correct, **stop and ask the user** rather than guessing — this is
  exactly the kind of judgment call this skill must not make alone.
- After resolving, `git add` the resolved files and continue:
  `git commit` (a merge commit; keep the default merge message unless it
  needs a clarifying note about what was resolved and why).

## 11. Run tests/build checks again (post-merge)

Same logic as step 4, but scoped to what actually changed in the merge:

```
git diff --name-only ORIG_HEAD..HEAD
```

Run each affected app's real check set again on the merged result — a
clean pre-merge check on the source branch doesn't guarantee the merged
combination still builds. If anything fails here, the merge is **not**
safe to push as-is:
- If it's a trivial merge-resolution mistake, fix and re-run.
- If it points to a genuine incompatibility between the two branches'
  changes, do not push the merge — report the failure, and ask how the
  user wants to proceed rather than forcing it through.

## 12. Push the merged target branch

```
git push origin <target-branch>
```

Never force-push this, even if it's rejected — a rejection means the
remote target branch moved since step 9's pull; `git pull origin
<target-branch>` again (which will itself be a merge, handle per step
10 if it conflicts) and retry the plain push.

## 13. Report

Always end with this exact structure, filled in truthfully — never mark
a line SUCCESS unless it actually happened as verified above:

```
iqs-git: SUCCESS / FAILED

Source branch: <branch> (pushed: yes/no)
Target branch: <branch or "n/a — source already is main">

Commit(s) pushed:
- <sha> <subject>
- ...

Merge status: SUCCESS / FAILED / NOT ATTEMPTED (reason)
Conflicts encountered: none / <file list + how each was resolved>

Tests/build — pre-push:  <app>: PASS/FAIL (per app touched)
Tests/build — post-merge: <app>: PASS/FAIL (per app touched, or "n/a — no merge")

Excluded from commit (secrets/generated/unrelated): none / <list + reason>

Final git status:
- <branch>: clean / <what's still outstanding>
```

`iqs-git: SUCCESS` requires: no secrets/unrelated files committed, all
relevant pre-push checks green, the source branch pushed, and — if a
merge was in scope — the merge completed with all conflicts resolved,
post-merge checks green, and the target branch pushed. If any required
step failed or was intentionally skipped (e.g. stopped to ask about an
ambiguous target branch), report `iqs-git: FAILED` (or `PAUSED —
awaiting input` when the stop was to ask a question, not a failure) and
state exactly what's outstanding. Never describe a merge as
"production-ready" or the workflow as fully complete when any check
failed or was skipped.

## Rules

1. **Never force-push**, under any circumstance in this workflow.
2. **Never discard or reset user changes** without explicit approval —
   this includes `git checkout --`/`git restore` (non-staged variants),
   `git reset --hard`, and `git clean` on anything not created by this
   skill itself.
3. **Never overwrite remote changes** — always fetch/pull and merge
   before pushing if the remote has moved.
4. **Never commit secrets** — screen per step 3 before every commit,
   not just once at the start.
5. **Don't modify application code merely to make git operations
   succeed** — a failing lint/test/build gets fixed because the code is
   actually wrong, or the run stops and reports the failure; it never
   gets edited around just to produce a clean push.
6. **Preserve the existing branching strategy** (step 8) — scoped
   feature branches merge into `main`; don't invent a different flow.
7. **If the correct target branch is unclear, stop and ask** before
   merging — do not guess `main` by default in an ambiguous case.
8. **If tests or builds fail, report the failure plainly** — never
   claim the merge is production-ready or that the workflow succeeded.
