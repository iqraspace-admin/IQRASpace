<#
.SYNOPSIS
  Runs the apps/flutter app on a running iqs- emulator with hot reload.

.DESCRIPTION
  Thin wrapper around `flutter run` that targets the emulator by AVD name
  instead of guessing the device id, and fails fast with a clear message
  if no matching device is attached (i.e. you forgot to run
  start-emulator.ps1 first, or it's still booting).

.PARAMETER Avd
  Which AVD to target. Defaults to the primary device, same default as
  start-emulator.ps1.
#>
param(
    [string]$Avd = "iqra_primary_api36"
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")
$flutterDir = Join-Path $repoRoot "apps\flutter"

$AndroidHome = $env:ANDROID_HOME
if (-not $AndroidHome) { $AndroidHome = "$env:LOCALAPPDATA\Android\sdk" }
$AdbExe = Join-Path $AndroidHome "platform-tools\adb.exe"

$devices = & $AdbExe devices | Select-String "^emulator-"
if (-not $devices) {
    Write-Error "No emulator is running. Run scripts\emulator\start-emulator.ps1 -Avd $Avd first and wait for it to fully boot."
    exit 1
}

Push-Location $flutterDir
try {
    # -d emulator-* matches whichever emulator is running; if you start more
    # than one AVD at once, pass the exact serial from `flutter devices` instead.
    flutter run -d emulator-5554
} finally {
    Pop-Location
}
