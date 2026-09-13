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
`0.3.0+3` → `0.3.0+4`); only bump the `x.y.z` part too if the user asks
for a version bump or the changes are a genuine user-visible release
(new feature set, etc.).

See [DEPLOYMENT.md](DEPLOYMENT.md) for the rest of the release checklist
(signing, Play Console setup, Privacy Policy requirement).
