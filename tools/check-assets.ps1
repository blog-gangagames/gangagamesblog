Param(
  [string]$Port = '8081'
)

$ErrorActionPreference = 'Continue'
$root = (Get-Location).Path
$base = "http://localhost:$Port"

Write-Host "Checking assets at $base from root $root"

$files = Get-ChildItem -Path $root -Recurse -Filter *.html
$totalAssets = 0
$fail = @()

foreach ($f in $files) {
  $rel = $f.FullName.Substring($root.Length).Replace('\\','/')
  if (-not $rel.StartsWith('/')) { $rel = '/' + $rel }
  $pageUrl = New-Object System.Uri($base + $rel)
  try { $html = Get-Content $f.FullName -Raw } catch { $html = '' }
  $matches = @()
  $matches += [regex]::Matches($html, 'href="([^"]+\.css)"')
  $matches += [regex]::Matches($html, 'src="([^"]+\.js)"')
  $matches += [regex]::Matches($html, 'href="([^"]*site\.webmanifest)"')
  foreach ($m in $matches) {
    foreach ($g in $m) {
      $a = $g.Groups[1].Value
      if (-not $a) { continue }
      if ($a -match '^https?://') { continue }
      $totalAssets++
      $assetUrl = New-Object System.Uri($pageUrl, $a)
      try {
        $resp = Invoke-WebRequest -Uri $assetUrl.AbsoluteUri -UseBasicParsing -TimeoutSec 10
        Write-Host ('OK ' + $assetUrl.AbsolutePath + ' (from ' + $rel + ') => ' + $resp.StatusCode)
      } catch {
        $fail += $assetUrl.AbsolutePath + ' (from ' + $rel + ')'
        Write-Host ('FAIL ' + $assetUrl.AbsolutePath + ' (from ' + $rel + ') => ' + $_.Exception.Message)
      }
    }
  }
}

Write-Host ('Total asset requests: ' + $totalAssets)
Write-Host ('Asset failures: ' + $fail.Count)
if ($fail.Count -gt 0) { $fail | ForEach-Object { Write-Host (' - ' + $_) } }