# Start Central Admin on port 3100 (Cloudflare Tunnel target)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path ".next")) {
  Write-Host "Building..."
  npm run build
}

Write-Host "Starting production server on http://127.0.0.1:3100"
Write-Host "Public URL: https://aladmin.sikaupaisa.com"
npm run start:3100
