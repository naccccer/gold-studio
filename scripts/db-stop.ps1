$ErrorActionPreference = "Stop"

$mysqlAdminPath = "C:\xampp\mysql\bin\mysqladmin.exe"
$port = 3307
$rootPassword = "123456"

if (-not (Test-Path $mysqlAdminPath)) {
  throw "mysqladmin.exe not found at $mysqlAdminPath"
}

$portOpen = Test-NetConnection 127.0.0.1 -Port $port -WarningAction SilentlyContinue
if (-not $portOpen.TcpTestSucceeded) {
  Write-Output "MariaDB is not running on 127.0.0.1:$port."
  exit 0
}

& $mysqlAdminPath --host=127.0.0.1 --port=$port --user=root --password=$rootPassword shutdown

Start-Sleep -Seconds 2
$stopped = Test-NetConnection 127.0.0.1 -Port $port -WarningAction SilentlyContinue
if ($stopped.TcpTestSucceeded) {
  throw "MariaDB is still running on 127.0.0.1:$port."
}

Write-Output "MariaDB stopped on 127.0.0.1:$port."
