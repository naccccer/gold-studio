$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$dbRoot = Join-Path $repoRoot ".local-mariadb"
$dataDir = Join-Path $dbRoot "data"
$pidFile = Join-Path $dbRoot "mysqld.pid"
$mysqldPath = "C:\xampp\mysql\bin\mysqld.exe"
$port = 3307

if (-not (Test-Path $mysqldPath)) {
  throw "mysqld.exe not found at $mysqldPath"
}

if (-not (Test-Path $dataDir)) {
  throw "Local MariaDB data directory is missing: $dataDir"
}

$portOpen = Test-NetConnection 127.0.0.1 -Port $port -WarningAction SilentlyContinue
if ($portOpen.TcpTestSucceeded) {
  Write-Output "MariaDB is already running on 127.0.0.1:$port."
  exit 0
}

Start-Process -FilePath $mysqldPath -ArgumentList @(
  "--datadir=$dataDir",
  "--port=$port",
  "--bind-address=127.0.0.1",
  "--pid-file=$pidFile"
) -WindowStyle Hidden

Start-Sleep -Seconds 3

$started = Test-NetConnection 127.0.0.1 -Port $port -WarningAction SilentlyContinue
if (-not $started.TcpTestSucceeded) {
  throw "MariaDB did not start on 127.0.0.1:$port."
}

Write-Output "MariaDB started on 127.0.0.1:$port."
