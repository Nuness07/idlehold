param(
  [Parameter(Mandatory)] [string] $JobId,
  [Parameter(Mandatory)] [string] $Name,
  [string] $OutRoot = (Join-Path $PSScriptRoot '..\candidates'),
  [int] $Count = 64,
  [int] $Scale = 4
)

# Downloads every candidate of a PixelLab job into art/candidates/<Name>/ and tiles them into a
# numbered contact sheet at art/candidates/<Name>-sheet.png. Run unwrap.ps1 on the downloads
# first when candidates come back rolled horizontally, then run this again to rebuild the sheet.
Add-Type -AssemblyName System.Drawing

$dir = Join-Path $OutRoot $Name
New-Item -ItemType Directory -Force $dir | Out-Null

for ($i = 0; $i -lt $Count; $i++) {
  $file = Join-Path $dir ('{0:D2}.png' -f $i)
  if (-not (Test-Path $file)) {
    Invoke-WebRequest -Uri "https://api.pixellab.ai/mcp/images/$JobId/download?index=$i" -OutFile $file -UseBasicParsing
  }
}

$cols = 8
$cell = 32 * $Scale
$pad = 18
$rows = [Math]::Ceiling($Count / $cols)
$sheet = New-Object System.Drawing.Bitmap ($cols * ($cell + 8)), ($rows * ($cell + $pad + 8))
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$g.Clear([System.Drawing.Color]::FromArgb(236, 237, 234))
$font = New-Object System.Drawing.Font 'Segoe UI', 10, ([System.Drawing.FontStyle]::Bold)
$ink = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(27, 23, 18))

for ($i = 0; $i -lt $Count; $i++) {
  $x = ($i % $cols) * ($cell + 8) + 4
  $y = [Math]::Floor($i / $cols) * ($cell + $pad + 8) + 4
  $img = [System.Drawing.Image]::FromFile((Join-Path $dir ('{0:D2}.png' -f $i)))
  $g.DrawImage($img, $x, $y + $pad, $cell, $cell)
  $img.Dispose()
  $g.DrawString("$i", $font, $ink, $x, $y)
}

$out = Join-Path $OutRoot "$Name-sheet.png"
$sheet.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $sheet.Dispose()
$out
