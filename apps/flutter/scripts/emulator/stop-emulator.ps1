<#
.SYNOPSIS
  Gracefully stops a running iqs- Android emulator so it saves a Quick Boot
  snapshot (makes the next start-emulator.ps1 launch much faster).

.PARAMETER Serial
  adb device serial of the emulator to stop. Defaults to the first
  "emulator-*" device found via `adb devices`. Use `flutter devices` or
  `adb devices` to check the serial if more than one emulator is running.
#>
param(
    [string]$Serial
)

$AndroidHome = $env:ANDROID_HOME
if (-not $AndroidHome) { $AndroidHome = "$env:LOCALAPPDATA\Android\sdk" }
$AdbExe = Join-Path $AndroidHome "platform-tools\adb.exe"

if (-not $Serial) {
    $line = & $AdbExe devices | Select-String "^emulator-" | Select-Object -First 1
    if (-not $line) {
        Write-Error "No running emulator found (checked 'adb devices')."
        exit 1
    }
    $Serial = ($line -split "\s+")[0]
}

Write-Host "Stopping $Serial (saving Quick Boot snapshot)..." -ForegroundColor Yellow
& $AdbExe -s $Serial emu kill
