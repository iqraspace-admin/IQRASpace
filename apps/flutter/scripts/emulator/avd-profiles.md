# iqs- Android emulator profiles

Two AVDs, covering the app's supported Android range
(`minSdkVersion 24` / `targetSdkVersion 36`, see [pubspec.yaml](../../pubspec.yaml))
and a meaningfully different screen size, without downloading more than two
system images:

| AVD name | Device profile | API level | Screen | Purpose |
|---|---|---|---|---|
| `iqra_primary_api36` | Pixel 7 | 36 (Android 16) — matches `targetSdkVersion` | 6.3", 1080×2400 | Default day-to-day dev target |
| `iqra_legacy_api24` | Nexus 5X | 24 (Android 7.0) — matches `minSdkVersion` | 5.2", 1080×1920 | Oldest-supported-OS + smaller-screen smoke checks |

Both use `google_apis` x86_64 system images (not `google_apis_playstore`) —
this app makes no Play Services calls, and the plain `google_apis` image is
the smaller/faster download of the two.

## One-time creation

Requires `JAVA_HOME` pointed at a JDK 17+ (Android Studio ships one; the
system `java` on this machine is 1.8 and `avdmanager` will refuse to run
under it):

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$sdk = "$env:LOCALAPPDATA\Android\sdk"

# One-time: download the two system images (~1-1.5GB each)
& "$sdk\cmdline-tools\latest\bin\android.exe" sdk install "system-images;android-36;google_apis;x86_64"
& "$sdk\cmdline-tools\latest\bin\android.exe" sdk install "system-images;android-24;google_apis;x86_64"

# Create the AVDs (answer "no" to the "custom hardware profile" prompt)
echo no | & "$sdk\cmdline-tools\latest\bin\avdmanager.bat" create avd -n iqra_primary_api36 -k "system-images;android-36;google_apis;x86_64" -d pixel_7
echo no | & "$sdk\cmdline-tools\latest\bin\avdmanager.bat" create avd -n iqra_legacy_api24 -k "system-images;android-24;google_apis;x86_64" -d nexus_5x
```

**Note on the `android.exe sdk install` package syntax:** the legacy
`sdkmanager.bat --list`/install commands on this SDK's cmdline-tools version
(23.0.0) mis-parse semicolon-delimited package IDs (splits
`system-images;android-36;google_apis;x86_64` into separate unrecognized
packages) — that's a bug in this cmdline-tools release's `sdkmanager.bat`
wrapper, reproduced identically from both Git Bash and PowerShell. Use the
newer `android.exe sdk install <package-id>` command shown above instead;
`avdmanager.bat create avd` (used for the AVD itself) is unaffected.

## Why these two, not more

Every additional API level is another ~1-1.5GB download and, since this
machine has no hardware virtualization (see `start-emulator.ps1`'s doc
comment), another slow-to-boot software-rendered AVD. Two that bracket the
app's actual supported range (`24`–`36`) plus a real screen-size difference
covers the practical risk without turning every test run into a multi-AVD
slog. Add a third profile here if a specific bug report needs a size/API
combination these two don't cover.
