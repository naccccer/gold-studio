$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$envPath = Join-Path $repoRoot ".env"
$mysqldumpExe = "C:\xampp\mysql\bin\mysqldump.exe"
$defaultOutput = Join-Path ([Environment]::GetFolderPath("Desktop")) "gold_studio_local.sql"
$outputPath = if ($args.Count -gt 0 -and $args[0]) { $args[0] } else { $defaultOutput }

if (-not (Test-Path $envPath)) {
  throw ".env not found at $envPath"
}

if (-not (Test-Path $mysqldumpExe)) {
  throw "mysqldump.exe not found at $mysqldumpExe"
}

$databaseUrlLine = Get-Content -Path $envPath | Where-Object { $_ -match '^\s*DATABASE_URL=' } | Select-Object -First 1
if (-not $databaseUrlLine) {
  throw "DATABASE_URL is missing from .env"
}

$databaseUrl = ($databaseUrlLine -replace '^\s*DATABASE_URL=', '').Trim().Trim('"').Trim("'")
$uri = [Uri]$databaseUrl
$userInfo = $uri.UserInfo.Split(":", 2)

if ($userInfo.Count -lt 1 -or -not $userInfo[0]) {
  throw "DATABASE_URL must include a database user."
}

$dbUser = [Uri]::UnescapeDataString($userInfo[0])
$dbPassword = if ($userInfo.Count -gt 1) { [Uri]::UnescapeDataString($userInfo[1]) } else { "" }
$dbName = $uri.AbsolutePath.TrimStart("/")
$dbHost = if ($uri.Host) { $uri.Host } else { "127.0.0.1" }
$dbPort = if ($uri.Port -gt 0) { $uri.Port } else { 3306 }

if (-not $dbName) {
  throw "DATABASE_URL must include a database name."
}

$resolvedOutput = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($outputPath)
$outputDir = Split-Path -Parent $resolvedOutput
if (-not (Test-Path $outputDir)) {
  New-Item -Path $outputDir -ItemType Directory | Out-Null
}

$dumpArgs = @(
  "--host=$dbHost",
  "--port=$dbPort",
  "--user=$dbUser",
  "--default-character-set=utf8mb4",
  "--single-transaction",
  "--routines",
  "--triggers",
  "--result-file=$resolvedOutput",
  $dbName
)

if ($dbPassword) {
  $dumpArgs = @("--password=$dbPassword") + $dumpArgs
}

& $mysqldumpExe @dumpArgs

Write-Output "Local database dump written to $resolvedOutput"
