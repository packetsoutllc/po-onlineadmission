# Run InsForge SQL migrations in order (000, 001, 002).
# Requires: npx insforge whoami and npx insforge current to succeed.
# Usage: from project root, .\scripts\run-insforge-migrations.ps1

$ErrorActionPreference = "Stop"
$migrationsDir = Join-Path $PSScriptRoot ".." "insforge" "migrations"
$order = @("000_base_schema.sql", "001_verify_placement.sql", "002_applicant_validate_credentials.sql")

foreach ($file in $order) {
  $path = Join-Path $migrationsDir $file
  if (-not (Test-Path $path)) {
    Write-Warning "Skip (not found): $file"
    continue
  }
  $sql = (Get-Content -Raw $path) -replace "`r`n", " " -replace "`n", " " -replace "`r", " "
  Write-Host "Running $file ..."
  npx insforge db query $sql
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Migration failed: $file"
    exit $LASTEXITCODE
  }
  Write-Host "Done: $file"
}

Write-Host "All migrations completed."
