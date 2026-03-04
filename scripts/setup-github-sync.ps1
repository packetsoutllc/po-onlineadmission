# Two-way GitHub sync setup for po-onlineadmission
# Run once from repo root. Requires: Git installed and in PATH.
# Optional: set $env:GITHUB_TOKEN to your token so remote uses it (otherwise you'll be prompted on first push).

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Set-Location $repoRoot

$gitExe = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitExe) {
    $possiblePaths = @(
        "${env:ProgramFiles}\Git\bin\git.exe",
        "${env:ProgramFiles(x86)}\Git\bin\git.exe"
    )
    foreach ($p in $possiblePaths) {
        if (Test-Path $p) { $env:PATH = (Split-Path $p) + ";" + $env:PATH; break }
    }
    $gitExe = Get-Command git -ErrorAction SilentlyContinue
}
if (-not $gitExe) {
    Write-Error "Git not found. Install Git from https://git-scm.com and ensure it is in your PATH."
    exit 1
}

# Init repo if needed
if (-not (Test-Path ".git")) {
    git init
    Write-Host "Initialized git repository."
}

# Remote: use token from env if set (no token stored in repo)
$token = $env:GITHUB_TOKEN
$remoteUrl = "https://github.com/packetsoutllc/po-onlineadmission.git"
if ($token) {
    $remoteUrl = "https://${token}@github.com/packetsoutllc/po-onlineadmission.git"
}

$existing = git remote get-url origin 2>$null
if (-not $existing) {
    git remote add origin $remoteUrl
    Write-Host "Added remote origin."
} else {
    git remote set-url origin $remoteUrl
    Write-Host "Updated remote origin URL."
}

# Install post-commit hook (auto-push)
$hookDir = Join-Path $repoRoot ".git\hooks"
$hookSrc = Join-Path $repoRoot "scripts\hooks\post-commit"
$hookDest = Join-Path $hookDir "post-commit"

if (-not (Test-Path $hookDir)) { New-Item -ItemType Directory -Path $hookDir -Force | Out-Null }
Copy-Item -Path $hookSrc -Destination $hookDest -Force
Write-Host "Installed post-commit hook (auto-push)."

# If Git Bash is available, make hook executable (optional on Windows)
$bash = Get-Command bash -ErrorAction SilentlyContinue
if ($bash) {
    & bash -c "chmod +x '$hookDest'" 2>$null
}

Write-Host ""
Write-Host "Done. Usage:"
Write-Host "  Pull changes from GitHub:  npm run sync:in"
Write-Host "  Commit and push:          git add -A && git commit -m \"your message\"  (push runs automatically)"
Write-Host "  Or one-shot sync out:     npm run sync:out"
