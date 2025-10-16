Param(
  [string]$Port = '8081'
)

$ErrorActionPreference = 'Continue'

$root = (Get-Location).Path
$base = "http://localhost:$Port"

Write-Host "Checking site at $base from root $root"

$results = @()

# Check root route
try {
  $resp = Invoke-WebRequest -Uri ($base + '/') -UseBasicParsing -TimeoutSec 10
  $results += [pscustomobject]@{ Path = '/'; StatusCode = $resp.StatusCode }
} catch {
  $results += [pscustomobject]@{ Path = '/'; StatusCode = 'ERROR'; Error = $_.Exception.Message }
}

# Enumerate HTML files
$files = Get-ChildItem -Path $root -Recurse -Filter *.html
foreach ($f in $files) {
  $rel = $f.FullName.Substring($root.Length).Replace('\\','/')
  if (-not $rel.StartsWith('/')) { $rel = '/' + $rel }
  $url = $base + $rel
  try {
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
    $results += [pscustomobject]@{ Path = $rel; StatusCode = $resp.StatusCode }
  } catch {
    $results += [pscustomobject]@{ Path = $rel; StatusCode = 'ERROR'; Error = $_.Exception.Message }
  }
}

$failures = $results | Where-Object { $_.StatusCode -ne 200 }
Write-Host ('Total pages: ' + $results.Count)
Write-Host ('OK (200): ' + ($results.Count - $failures.Count))
Write-Host ('Failures: ' + $failures.Count)
if ($failures.Count -gt 0) {
  Write-Host 'Failure list:'
  foreach ($item in $failures) {
    $msg = " - {0} => {1}" -f $item.Path, $item.StatusCode
    if ($item.PSObject.Properties.Match('Error').Count -gt 0 -and $item.Error) {
      $msg += " (" + $item.Error + ")"
    }
    Write-Host $msg
  }
}