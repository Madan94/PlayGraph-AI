# Load PlayGraph .env into the current PowerShell session (same Cognee paths for CLI + app).
# Usage:  . .\scripts\load-env.ps1

$Root = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Root ".env"

if (-not (Test-Path $EnvFile)) {
    Write-Error ".env not found at $EnvFile"
    return
}

Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()
    Set-Item -Path "Env:$key" -Value $val
}

Write-Host "Loaded $EnvFile"
Write-Host "DATA_ROOT_DIRECTORY=$env:DATA_ROOT_DIRECTORY"
Write-Host "SYSTEM_ROOT_DIRECTORY=$env:SYSTEM_ROOT_DIRECTORY"
