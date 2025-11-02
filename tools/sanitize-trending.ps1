Param(
  [string]$File = 'index.html'
)

$ErrorActionPreference = 'Stop'

$path = Join-Path (Get-Location) $File
$content = Get-Content $path -Raw

$startMarker = '<!-- Tranding news  carousel-->'
$endMarker = '<!-- End Tranding news carousel -->'
$start = $content.IndexOf($startMarker)
$end = $content.IndexOf($endMarker)
if ($start -lt 0 -or $end -lt 0 -or $end -le $start) {
  Write-Error 'Could not locate trending carousel markers.'
}

# Extract section between markers
$sectionStart = $start + $startMarker.Length
$section = $content.Substring($sectionStart, $end - $sectionStart)

# Replace inner items with an empty dynamic container
$section = [Regex]::Replace($section,
  '<div class="wrapp__list__article-responsive wrapp__list__article-responsive-carousel">[\s\S]*?</div>',
  '<div class="wrapp__list__article-responsive wrapp__list__article-responsive-carousel">\n  <!-- Items populated dynamically by homepage.supabase.js -->\n</div>',
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$newContent = $content.Substring(0, $sectionStart) + $section + $content.Substring($end)
Set-Content -Path $path -Value $newContent
Write-Host 'Trending carousel sanitized.'