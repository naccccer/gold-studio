param(
  [Parameter(Position = 0)]
  [ValidateSet("jewelry", "food")]
  [string]$Vertical = "jewelry"
)

$ErrorActionPreference = "Stop"
$env:OVALA_LOCAL_VERTICAL = $Vertical

Write-Host "Starting Ovala local dev in '$Vertical' mode."
Write-Host "OVALA_LOCAL_VERTICAL=$env:OVALA_LOCAL_VERTICAL"

npm run dev
