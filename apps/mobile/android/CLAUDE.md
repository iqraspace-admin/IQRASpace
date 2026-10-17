# IqraSpace Flutter — agent instructions

## Every release build: bump the version first

Before running `flutter build appbundle --release` (or `apk --release`)
for an actual Play Console upload, bump the build number in
[pubspec.yaml](pubspec.yaml)'s `version:` line — the `+N` suffix, which
becomes the Android `versionCode`.

Play Console rejects an upload whose `versionCode` was already used for
this app (`org.iqraspace.app`), even if the previous upload was to a
different track or just a local test build that was never actually
published — the error is:

```
Version code N has already been used. Try another version code.
```

There is no way to query Play Console's history of already-used version
codes from this environment, so **always increment `+N` before building
a release artifact for upload**, never reuse or guess whether a prior
number is safe. Bump only the `+N` build number by default (e.g.
`0.3.0+18` → `0.3.0+19`); only bump the `x.y.z` part too if the user asks
for a version bump or the changes are a genuine user-visible release
(new feature set, etc.).

See [DEPLOYMENT.md](DEPLOYMENT.md) for the rest of the release checklist
(signing, Play Console setup, Privacy Policy requirement, and the optional
`DUAS_API_URL` override for remote Duas content).

## The `iqs-deploy` skill

Saying "iqs-deploy" runs `.claude/skills/iqs-deploy/SKILL.md`, which
automates validate → bump build number → build the signed `.aab` →
verify → upload to Play Console's **closed testing** track (the API's
`alpha` track id; never production — see DEPLOYMENT.md §9). It needs one-time
owner-only credential setup (DEPLOYMENT.md §9) before the upload step
will work.

## Duas (supplications) feature — things to keep in mind

- Content resolution is remote (the Learning API's public feed,
  `{DUAS_API_URL}/duas/version` + `/duas/content`; `DUAS_API_URL` defaults to
  production `https://iqraspace.org/learning/api`, an empty define disables it) → Hive cache
  (`duas_content_cache`) → bundled `assets/supplications.json`. The feed
  needs no key; never put any admin credential in the app. See `lib/features/supplications`.
- Persisted Duas settings live in the `reader_settings` Hive box, keys
  `supplicationsCategoryViewMode`, `supplicationsTasbeehEnabled`,
  `supplicationsTranslationLanguage`, `supplicationsTransliterationEnabled`,
  `supplicationsFontScale` (`duaFontScaleProvider`, 0.8–1.8, step 0.1 —
  scales the reading screen *and* category tile/row labels). The tasbeeh
  counter state itself is intentionally ephemeral.
- UI strings are in `lib/l10n/app_{en,ur,te}.arb`; add every new string to
  all three and regenerate (`flutter gen-l10n`).
- Layout-sensitive changes to Duas screens should keep
  `test/features/supplications/presentation/screens/dua_font_size_layout_test.dart`
  passing (no overflow at 180% on a 320px screen with raised system text
  scale, against the real bundled content).
