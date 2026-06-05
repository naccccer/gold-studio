$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$dbRoot = Join-Path $repoRoot ".local-mariadb"
$dataDir = Join-Path $dbRoot "data"
$pidFile = Join-Path $dbRoot "mysqld.pid"
$socketFile = Join-Path $dbRoot "mysql.sock"
$mysqldPath = "C:\xampp\mysql\bin\mysqld.exe"
$mysqlBaseDir = "C:\xampp\mysql"
$port = 3307

if (-not (Test-Path $mysqldPath)) {
  throw "mysqld.exe not found at $mysqldPath"
}

if (-not (Test-Path $dataDir)) {
  throw "Local MariaDB data directory is missing: $dataDir"
}

$resolvedDataDir = (Resolve-Path $dataDir).Path
$replicationMetadataPatterns = @(
  "master-*.info",
  "relay-log-*.info",
  "*-relay-bin-*",
  "mysqld-relay-bin-*",
  "relay-log.info",
  "master.info",
  "multi-master.info"
)

foreach ($pattern in $replicationMetadataPatterns) {
  Get-ChildItem -LiteralPath $resolvedDataDir -Filter $pattern -File -ErrorAction SilentlyContinue | ForEach-Object {
    $targetPath = $_.FullName
    if (-not $targetPath.StartsWith($resolvedDataDir, [StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing to remove replication metadata outside local MariaDB data directory: $targetPath"
    }
    Remove-Item -LiteralPath $targetPath -Force
  }
}

$portOpen = Test-NetConnection 127.0.0.1 -Port $port -WarningAction SilentlyContinue
if ($portOpen.TcpTestSucceeded) {
  Write-Output "MariaDB is already running on 127.0.0.1:$port."
  exit 0
}

Start-Process -FilePath $mysqldPath -ArgumentList @(
  "--no-defaults",
  "--basedir=$mysqlBaseDir",
  "--datadir=$dataDir",
  "--port=$port",
  "--bind-address=127.0.0.1",
  "--pid-file=$pidFile",
  "--socket=$socketFile",
  "--skip-slave-start",
  "--skip-grant-tables"
) -WindowStyle Hidden

Start-Sleep -Seconds 3

$started = Test-NetConnection 127.0.0.1 -Port $port -WarningAction SilentlyContinue
if (-not $started.TcpTestSucceeded) {
  throw "MariaDB did not start on 127.0.0.1:$port."
}

Write-Output "MariaDB started on 127.0.0.1:$port."
