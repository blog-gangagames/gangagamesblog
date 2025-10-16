Param(
  [string]$File = 'index.html'
)

$ErrorActionPreference = 'Stop'

$path = Join-Path (Get-Location) $File
$content = Get-Content $path -Raw

$startTag = '<div class="popular__news-header-carousel">'
$endMarker = '<!-- End Popular news carousel -->'
$start = $content.IndexOf($startTag)
$end = $content.IndexOf($endMarker)
if ($start -lt 0 -or $end -lt 0 -or $end -le $start) {
  Write-Error 'Could not locate under-hero carousel block markers.'
}

$block = $content.Substring($start, $end - $start)

# Fix the slider inner HTML: ensure it ends immediately after the placeholder comment
$fixedBlock = $block
$fixedBlock = [Regex]::Replace(
  $fixedBlock,
  '<div class="top__news__slider" id="underHeroNewsSlider">[\s\S]*?<!-- Items populated dynamically by homepage.supabase.js -->[\s\S]*?</div>',
  '<div class="top__news__slider" id="underHeroNewsSlider">\n    <!-- Items populated dynamically by homepage.supabase.js -->\n</div>',
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$newContent = $content.Substring(0, $start) + $fixedBlock + $content.Substring($end)
Set-Content -Path $path -Value $newContent
Write-Host 'Under-hero carousel sanitized.'