$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$envPath = Join-Path $repoRoot ".env"
$mysqlExe = "C:\xampp\mysql\bin\mysql.exe"
$mysqlcheckExe = "C:\xampp\mysql\bin\mysqlcheck.exe"

if (-not (Test-Path $envPath)) {
  throw ".env not found at $envPath"
}

if (-not (Test-Path $mysqlExe)) {
  throw "mysql.exe not found at $mysqlExe"
}

if (-not (Test-Path $mysqlcheckExe)) {
  throw "mysqlcheck.exe not found at $mysqlcheckExe"
}

$databaseUrlLine = Get-Content -Path $envPath | Where-Object { $_ -match '^\s*DATABASE_URL=' } | Select-Object -First 1
if (-not $databaseUrlLine) {
  throw "DATABASE_URL is missing from .env"
}

$databaseUrl = ($databaseUrlLine -replace '^\s*DATABASE_URL=', '').Trim().Trim('"').Trim("'")
$uri = [Uri]$databaseUrl
$userInfo = $uri.UserInfo.Split(":", 2)
if ($userInfo.Count -lt 2) {
  throw "DATABASE_URL must include user and password."
}

$dbUser = [Uri]::UnescapeDataString($userInfo[0])
$dbPassword = [Uri]::UnescapeDataString($userInfo[1])
$dbName = $uri.AbsolutePath.TrimStart("/")
$dbHost = if ($uri.Host) { $uri.Host } else { "127.0.0.1" }
$dbPort = if ($uri.Port -gt 0) { $uri.Port } else { 3306 }

function Escape-SqlString([string]$value) {
  return $value.Replace("\", "\\").Replace("'", "''")
}

$escapedDbName = Escape-SqlString $dbName
$escapedDbUser = Escape-SqlString $dbUser
$escapedDbPassword = Escape-SqlString $dbPassword
$now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

Write-Output "Repairing MariaDB privilege tables..."
& $mysqlcheckExe --host=$dbHost --port=$dbPort --user=root --databases mysql --auto-repair --use-frm | Write-Output

$sql = @"
CREATE DATABASE IF NOT EXISTS ``$escapedDbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SET @auth = PASSWORD('$escapedDbPassword');
REPLACE INTO mysql.global_priv (Host, User, Priv) VALUES
  ('localhost', 'root', '{"access":18446744073709551615}'),
  ('127.0.0.1', 'root', '{"access":18446744073709551615}'),
  ('::1', 'root', '{"access":18446744073709551615}'),
  ('%', 'root', '{"access":18446744073709551615}'),
  ('localhost', '$escapedDbUser', CONCAT('{"access":18446744073709551615,"plugin":"mysql_native_password","authentication_string":"', @auth, '","password_last_changed":$now}')),
  ('127.0.0.1', '$escapedDbUser', CONCAT('{"access":18446744073709551615,"plugin":"mysql_native_password","authentication_string":"', @auth, '","password_last_changed":$now}'));
FLUSH PRIVILEGES;
"@

Write-Output "Restoring root and $dbUser access..."
$sql | & $mysqlExe --host=$dbHost --port=$dbPort --user=root --database=mysql

Write-Output "Checking app database access..."
& $mysqlExe --host=$dbHost --port=$dbPort --user=$dbUser --password=$dbPassword --database=$dbName --execute="SELECT DATABASE() AS database_name;" | Write-Output

Write-Output "Database access repair complete."
