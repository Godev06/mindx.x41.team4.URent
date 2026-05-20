# Sync local .env files to Vercel (production, preview, development).
# Usage: .\scripts\sync-vercel-env.ps1
# Requires: Vercel CLI logged in, projects urent + urent-api on scope godev06s-projects

$ErrorActionPreference = "Continue"
$Scope = "godev06s-projects"
$RepoRoot = Split-Path $PSScriptRoot -Parent
# Preview env on Vercel requires a Git branch in non-interactive mode (repo default: dev)
$PreviewGitBranch = if ($env:VERCEL_PREVIEW_BRANCH) { $env:VERCEL_PREVIEW_BRANCH } else { "dev" }

$ProductionUrls = @{
  Api = "https://urent-api.vercel.app"
  Client = "https://urent-jade.vercel.app"
}

function Parse-DotEnv([string]$Path) {
  if (-not (Test-Path $Path)) {
    throw "Env file not found: $Path"
  }
  $vars = [ordered]@{}
  foreach ($raw in Get-Content $Path -Encoding UTF8) {
    $line = $raw.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { continue }
    $eq = $line.IndexOf("=")
    if ($eq -lt 1) { continue }
    $key = $line.Substring(0, $eq).Trim()
    $val = $line.Substring($eq + 1).Trim()
    if ($val.Length -ge 2 -and $val.StartsWith('"') -and $val.EndsWith('"')) {
      $val = $val.Substring(1, $val.Length - 2) -replace '\\n', "`n" -replace '\\r', "`r"
    }
    $vars[$key] = $val
  }
  return $vars
}

function Test-SensitiveKey([string]$Key) {
  $k = $Key.ToUpperInvariant()
  return $k -match "SECRET|PASSWORD|PASS|TOKEN|PRIVATE|KEY|SMTP"
}

function Sync-ToVercel(
  [string]$ProjectDir,
  [string]$EnvFile,
  [hashtable]$Overrides,
  [string]$ProjectName
) {
  Write-Host "`n==> Syncing $ProjectName ($EnvFile)" -ForegroundColor Cyan
  $vars = Parse-DotEnv $EnvFile
  foreach ($key in $Overrides.Keys) {
    $vars[$key] = $Overrides[$key]
  }

  Push-Location $ProjectDir
  try {
    if (-not (Test-Path ".vercel\project.json")) {
      & vercel link --yes --project $ProjectName --scope $Scope 2>&1 | Out-Null
    }

    foreach ($entry in $vars.GetEnumerator()) {
      $name = $entry.Key
      $value = [string]$entry.Value
      if ([string]::IsNullOrWhiteSpace($value)) { continue }

      $sensitive = if (Test-SensitiveKey $name) { "--sensitive" } else { "--no-sensitive" }

      function Invoke-VercelEnv([string]$Action, [string]$EnvName, [string[]]$ExtraArgs) {
        $args = @("env", $Action, $name, $EnvName) + $ExtraArgs + @(
          "--yes", "--force", $sensitive, "--scope", $Scope
        )
        $null = $value | & vercel @args 2>&1 | Out-String
        return $LASTEXITCODE -eq 0
      }

      if (Invoke-VercelEnv "add" "production" @()) {
        Write-Host "  ok $name -> production" -ForegroundColor DarkGray
      } else {
        if (Invoke-VercelEnv "update" "production" @()) {
          Write-Host "  updated $name -> production" -ForegroundColor DarkGray
        } else {
          Write-Warning "  failed: $name (production)"
        }
      }

      if (Invoke-VercelEnv "add" "preview" @($PreviewGitBranch)) {
        Write-Host "  ok $name -> preview ($PreviewGitBranch)" -ForegroundColor DarkGray
      } else {
        if (Invoke-VercelEnv "update" "preview" @($PreviewGitBranch)) {
          Write-Host "  updated $name -> preview ($PreviewGitBranch)" -ForegroundColor DarkGray
        } else {
          Write-Warning "  failed: $name (preview/$PreviewGitBranch)"
        }
      }

      if (Invoke-VercelEnv "add" "development" @()) {
        Write-Host "  ok $name -> development" -ForegroundColor DarkGray
      } else {
        if (Invoke-VercelEnv "update" "development" @()) {
          Write-Host "  updated $name -> development" -ForegroundColor DarkGray
        } else {
          Write-Warning "  failed: $name (development)"
        }
      }
    }
  } finally {
    Pop-Location
  }
}

$clientOverrides = @{
  "VITE_API_URL" = $ProductionUrls.Api
  "VITE_API_BASE_URL" = $ProductionUrls.Api
}

Sync-ToVercel `
  -ProjectDir (Join-Path $RepoRoot "urent-client") `
  -EnvFile (Join-Path $RepoRoot "urent-client\.env") `
  -Overrides $clientOverrides `
  -ProjectName "urent"

Sync-ToVercel `
  -ProjectDir (Join-Path $RepoRoot "urent-server") `
  -EnvFile (Join-Path $RepoRoot "urent-server\.env") `
  -Overrides @{} `
  -ProjectName "urent-api"

Write-Host "`nDone. Redeploy to apply build-time env (VITE_*):" -ForegroundColor Green
Write-Host "  cd urent-client; vercel deploy --prod --yes --scope $Scope"
Write-Host "  cd urent-server; vercel deploy --prod --yes --scope $Scope"
