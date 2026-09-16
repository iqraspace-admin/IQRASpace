<#
.SYNOPSIS
  Launches one of the iqs- Android emulators for local apps/flutter testing.

.DESCRIPTION
  This machine's BIOS/UEFI has hardware virtualization (VT-x/AMD-V) disabled,
  so the Android Emulator hypervisor driver (WHPX) isn't available here —
  `emulator -accel-check` returns "hypervisor driver is not installed".
  These AVDs therefore run in software-rendered mode (-no-accel -gpu
  swiftshader_indirect), which is slower to boot than a hardware-accelerated
  emulator but works reliably. Quick Boot snapshots (the emulator's default)
  make the *second and later* launches much faster than the first cold boot
  — avoid closing the emulator by force-killing it; use `stop-emulator.ps1`
  or the emulator window's close button so it saves a snapshot on exit.

  If you later enable virtualization in BIOS/UEFI and the Windows Hypervisor
  Platform feature, delete the `-no-accel -gpu swiftshader_indirect` flags
  below (or pass -Accelerated) to get full hardware-accelerated speed.

.PARAMETER Avd
  Which AVD to launch. Defaults to the primary device (see avd-profiles.md).

.PARAMETER Accelerated
  Skip the software-rendering flags and let the emulator auto-detect
  acceleration. Only useful once hardware virtualization is enabled.

.EXAMPLE
  .\start-emulator.ps1
  .\start-emulator.ps1 -Avd iqra_legacy_api24
#>
param(
    [string]$Avd = "iqra_primary_api36",
    [switch]$Accelerated
)

$AndroidHome = $env:ANDROID_HOME
if (-not $AndroidHome) { $AndroidHome = "$env:LOCALAPPDATA\Android\sdk" }
$EmulatorExe = Join-Path $AndroidHome "emulator\emulator.exe"

if (-not (Test-Path $EmulatorExe)) {
    Write-Error "Emulator not found at $EmulatorExe. Set `$env:ANDROID_HOME or check your SDK install."
    exit 1
}

$avdList = & (Join-Path $AndroidHome "emulator\emulator.exe") -list-avds
if ($avdList -notcontains $Avd) {
    Write-Error "AVD '$Avd' not found. Available AVDs:`n$($avdList -join "`n")`nSee scripts/emulator/avd-profiles.md to create it."
    exit 1
}

$flags = @("-avd", $Avd, "-no-boot-anim", "-netdelay", "none", "-netspeed", "full")
if (-not $Accelerated) {
    $flags += @("-no-accel", "-gpu", "swiftshader_indirect")
    Write-Host "Starting '$Avd' in software-rendered mode (no HW virtualization available on this machine)." -ForegroundColor Yellow
    Write-Host "First boot can take a few minutes; later boots reuse the Quick Boot snapshot and are much faster." -ForegroundColor Yellow
} else {
    Write-Host "Starting '$Avd' with hardware acceleration." -ForegroundColor Green
}

& $EmulatorExe @flags
