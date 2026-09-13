# IqraSpace Quran (Flutter) — Android test build & Google Play deployment plan

Companion to [README.md](README.md) (app architecture/decisions) and
`apps/quran/MOBILE.md`/`apps/quran/DEPLOYMENT.md` (the sibling Capacitor
app's own Android path — separate app, separate `applicationId`, separate
Play Console listing; nothing here affects that app).

## 1. Test APK — built and verified (2026-09-11)

Built locally (Flutter 3.47.3, Android SDK 36, JDK 17) from the current
working tree on `mobile/android`:

| Variant | Path | Size | Signed with |
|---|---|---|---|
| Debug | `build/app/outputs/flutter-apk/app-debug.apk` | 178.6 MB | debug key (auto) |
| Release | `build/app/outputs/flutter-apk/app-release.apk` | 54.4 MB | debug key (no upload keystore yet — see §3) |

Verified before and after the build:
- `flutter analyze` — no issues.
- `flutter test` — all 51 tests passed.
- `aapt dump badging app-release.apk` — `applicationId=org.iqraspace.app`
  (renamed from `org.iqraspace.mobile` on 2026-09-11 to match the Play
  Console listing that was already created with this package name —
  package names can't be changed in Play Console after app creation),
  `versionCode=2`, `versionName=0.2.0`, `minSdkVersion=24`,
  `targetSdkVersion=36` (Android 16), permissions are only `INTERNET` +
  the auto-added `ACCESS_NETWORK_STATE` — no sensitive/dangerous
  permissions requested.
- Both variants build with a real launcher icon from
  `assets/branding/icon.png` (via `flutter_launcher_icons`), not the
  Flutter default icon.

**Local build environment fix (committed):** `android/gradle.properties`
now sets `kotlin.incremental=false`. The project lives on `F:\` while the
Gradle/Kotlin caches and pub cache live on `C:\`; Kotlin's incremental
compiler crashed (`this and base files have different roots`) trying to
relativize plugin source paths across drive letters on Windows. This is a
local-machine fix, not an app change — harmless on CI/other machines,
just slightly slower incremental Kotlin recompiles.

**Install for testing:** copy `app-release.apk` to an Android device
(Settings → allow install from this source, or `adb install app-release.apk`)
— it's the smaller, R8-shrunk build and closer to what real users will
run. Use `app-debug.apk` only if you need debugging (breakpoints, hot
reload attach); it's unoptimized and ~3× larger.

Neither APK is suitable for Play Store upload as-is: Play requires an
`.aab` (App Bundle, §4) signed with a real upload key (§3), not a debug-signed `.apk`.

## 2. Play Store policy check — where this app already stands

Reviewed against current Play Console requirements:

| Requirement | Status |
|---|---|
| Target API level (must target the most recent major API within Google's rolling window — currently API 35+) | ✅ `targetSdk=36`, well above the floor |
| 16 KB native page size (required for apps bundling native libraries, since Nov 2025) | ✅ likely — the only `.so` files in the APK are Flutter's own engine (`libapp.so`, `libflutter.so`, `libdartjni.so`); Flutter 3.47.3's AGP/NDK toolchain already builds 16 KB-aligned. No app-authored native code, and none of `just_audio`/`hive`/`path_provider`/`dio`/`url_launcher` ship native `.so` libs of their own. Re-confirm at AAB build time with `bundletool build-apks --device-spec` or the Play Console's pre-launch report — it flags this automatically on upload. |
| Sensitive permissions minimized | ✅ Only `INTERNET`/`ACCESS_NETWORK_STATE` — no camera, mic, location, storage, contacts. Nothing needing a Play "permission declaration form" or Restricted Permissions review. |
| No ads SDK | ✅ none in `pubspec.yaml` — Data Safety form's ads question is a straight "No". |
| No analytics/crash SDK (Firebase, Sentry, etc.) | ✅ none present — simplifies the Data Safety form (no third-party data sharing to declare). If one is added later, the form must be updated before that release ships. |
| No accounts/login, no personal data collected | ✅ All state (bookmarks, settings, last-read, cached Surah text) is local `Hive` storage on-device; nothing is uploaded. Network calls are anonymous read-only `GET`s to two public Quran APIs (Al Quran Cloud, Quran.com) — no auth headers, no user identifiers sent. |
| Religious/sacred text accuracy (Play's policy on user-generated & sensitive content, applied loosely here since this is *not* UGC but is Quranic text) | ✅ `AboutScreen` already states the text is from an authenticated source and is not altered — keep this true; never let a future feature (e.g. user-submitted translations) modify the Arabic text without review. |
| `applicationId` decided and stable | ✅ `org.iqraspace.app`, documented in README.md as effectively permanent |
| Unique, non-infringing app name/icon | ✅ "IqraSpace" + custom brand icon, distinct from `apps/quran`'s existing listing (if any) |
| Privacy Policy URL | ❌ **Blocking — see §5.** No privacy policy page exists yet anywhere in this repo (checked `apps/landing`, `apps/quran`). Play Console will not let you publish to *any* track, including internal testing, without one. |
| Target audience / Families policy | ⚠️ Decide explicitly in Play Console (§6) — this is a general-audience reading app with no chat/UGC/ads, so declaring it "not primarily for children" with a standard 18+/general audience is the fitting choice; confirm against the actual questionnaire at submission time since Google's wording changes. |
| Content rating | ⚠️ Run the questionnaire (§6) — expect "Everyone"/"3+" given no violence, UGC, gambling, or objectionable content. |

## 3. Signing — owner-only, do this before the first real submission

This cannot be done from inside a coding session; it needs to happen
under your own Google/keystore identity, and the result must never be
committed to git.

1. Generate an upload keystore (once, ever, for this app):
   ```
   keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
   Store `upload-keystore.jks` **outside this repo**, with a password
   manager entry for the store/key passwords. Losing it, or someone else
   obtaining it, is unrecoverable for this listing (mitigated only if you
   later enroll in Play App Signing, which re-keys the *app* signing key
   but still needs the upload key to push updates).
2. Create `apps/flutter/android/key.properties` (gitignored — verify
   `android/key.properties` and `*.jks` are in `.gitignore`; add them if
   not):
   ```
   storePassword=<...>
   keyPassword=<...>
   keyAlias=upload
   storeFile=<absolute path to upload-keystore.jks>
   ```
3. Update `android/app/build.gradle.kts`'s `signingConfigs`/`buildTypes.release`
   to read from `key.properties` and sign `release` with it instead of
   the current `signingConfigs.getByName("debug")` fallback (mirrors the
   standard `flutter build apk`/`appbundle` signing recipe in the
   [Flutter docs](https://docs.flutter.dev/deployment/android#sign-the-app)).
4. Enroll in **Play App Signing** when creating the app in Play Console
   (default and recommended) — Google then holds the app signing key and
   you only need to safeguard the upload key above.

## 4. Build the real submission artifact (.aab, not .apk)

Once §3 is done:
```
flutter build appbundle --release
```
produces `build/app/outputs/bundle/release/app-release.aab` — this is
what gets uploaded to Play Console, not the `.apk` from §1 (Play accepts
`.apk` only for a few legacy/enterprise flows; standard listings require
App Bundle). Bump `pubspec.yaml`'s `version:` (currently `0.2.0+2`) —
the `+N` build number must increase on every upload, the `x.y.z` part is
the user-visible version.

## 5. Privacy Policy — blocking, needs a decision

Play Console requires a live, publicly reachable privacy policy URL
before any track (including internal testing) can be published. None
exists yet for IqraSpace. Given this app collects no personal data, it
can be short and truthful: what's fetched (public Quran text/audio APIs,
no auth), what's stored locally only (bookmarks/settings/last-read via
Hive, never transmitted), that there's no account system, no ads, no
analytics/crash SDK, and the contact address (`iqraspaceorg@gmail.com`,
already used in `AboutScreen`). The natural home for this is a `/privacy`
page on `apps/landing` (iqraspace.org, a static site) since that's the
domain already referenced from the app's About screen — say the word and
I'll draft that page in this session.

## 6. Play Console setup checklist (owner-only — needs your Google account)

1. **Google Play Console account** — $25 one-time registration fee, if
   not already done for `apps/quran`. One developer account can hold
   multiple app listings, so if that's already set up for `apps/quran`
   this step is done. ✅ Done — app already created.
2. **Create app** → `org.iqraspace.app`, app name "IqraSpace",
   default language, free/paid (free), declarations (not primarily for
   children, complies with policies, export laws). ✅ Done — this is the
   package name the project's `applicationId` was renamed to match
   (§1's build).
3. **Store listing**: short description (≤80 chars), full description
   (≤4000 chars — `README.md`'s scope summary and `AboutScreen`'s mission
   text are good source material), app icon (512×512 32-bit PNG — export
   a high-res version of `assets/branding/icon.png`, distinct from the
   Android adaptive launcher icon asset), feature graphic (1024×500),
   ≥2 phone screenshots (16:9 or 9:16, take from a real device or
   `flutter run --release` on an emulator once one's configured — none
   exist in this environment, see §7), app category (Books & Reference
   or Lifestyle), contact email/website (already decided:
   `iqraspaceorg@gmail.com`, `iqraspace.org`).
4. **App content** section — complete every sub-item, all currently
   straightforward given this app's actual behavior:
   - Privacy policy URL (§5, blocking).
   - Ads: No.
   - App access: no login required, full app accessible without
     credentials — mark as such (no special reviewer instructions
     needed).
   - Content ratings questionnaire: answer per §2's expectation
     ("Everyone").
   - Target audience & content: select the actual age groups this reads
     well for; don't select "primarily for children" (triggers Families
     Policy / stricter ad and data rules this app doesn't need).
   - News apps: No. Government apps: No. Financial features: No.
   - Data safety form: declare *no* data collected/shared, matching §2's
     findings — keep this in sync if a future release adds any SDK.
5. **Release** → **Testing** → **Internal testing** track first: upload
   the signed `.aab`, add tester emails (no 20-tester/14-day requirement
   at this track). This is the fastest way to get the real submission
   pipeline (signing, store listing, content rating, data safety) fully
   validated before wider testing — recommended as the next step after
   §3/§4/§5, ahead of sideloading the debug APK further.
6. **Closed testing** (required before **Production** access for most
   developer accounts under Google's current policy): run a closed test
   with **at least 20 testers, opted in and testing continuously for 14
   days**, before Play grants production-track access for a new app.
   Plan this timeline explicitly — it's 2 weeks of real calendar time,
   not something to rush.
7. **Production release**: once closed testing's 14-day/20-tester bar is
   met and the pre-launch report (Play's automated device-compatibility
   scan, runs on every AAB upload) shows no crashes, promote to
   production.

## 7. What's still missing to fully exercise this locally

- No Android emulator/physical device is connected in this environment
  (`flutter doctor` shows only Windows desktop + Chrome + Edge as
  connected targets) — the APKs above are built but not yet installed
  and run anywhere. Install `app-release.apk` on a real device via
  `adb install`, or set up an emulator (Android Studio → Device Manager)
  to take the store-listing screenshots §6 needs and to smoke-test the
  release build before uploading anything to Play Console.
- No `.aab` has been built yet — blocked on the real upload keystore
  (§3), which is deliberately owner-only.

## 8. Things that are effectively permanent once published

Same category as `apps/quran/MOBILE.md`'s §7 — decide/lock these before
the first Play Console submission, not after:

- `applicationId` (`org.iqraspace.app`) — changing it later creates a
  new listing, not an update to this one.
- The upload keystore (§3) — back it up somewhere durable outside git the
  moment it's generated.
