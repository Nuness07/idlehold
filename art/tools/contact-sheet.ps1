param(
  [Parameter(Mandatory)] [string] $JobId,
  [Parameter(Mandatory)] [string] $Name,
  [string] $OutRoot = (Join-Path $PSScriptRoot '..\candidates'),
  [int] $Count = 64,
  [int] $Scale = 4,
  [int] $Size = 32
)

# Downloads every candidate of a PixelLab job, realigns them, and tiles them into a numbered
# contact sheet at art/candidates/<Name>-sheet.png.
#
# PixelLab sometimes slices its candidate sheet off the real grid (often by half a cell), so one
# downloaded "candidate" holds half of one drawing and half of the next. The raw downloads go to
# art/candidates/<Name>/raw/; they are laid back into the sheet, the offset is found as the grid
# line with the fewest painted pixels, and the corrected candidates are written to
# art/candidates/<Name>/NN.png. Never glue halves of a raw download together by hand.
Add-Type -AssemblyName System.Drawing

$dir = Join-Path $OutRoot $Name
$rawDir = Join-Path $dir 'raw'
New-Item -ItemType Directory -Force $rawDir | Out-Null

for ($i = 0; $i -lt $Count; $i++) {
  $file = Join-Path $rawDir ('{0:D2}.png' -f $i)
  if (-not (Test-Path $file)) {
    Invoke-WebRequest -Uri "https://api.pixellab.ai/mcp/images/$JobId/download?index=$i" -OutFile $file -UseBasicParsing
  }
}

# Lay the raw candidates back into the sheet they were cut from.
$gridCols = 8
$gridRows = [Math]::Ceiling($Count / $gridCols)
$gw = $gridCols * $Size; $gh = $gridRows * $Size
$grid = New-Object System.Drawing.Bitmap $gw, $gh, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gg = [System.Drawing.Graphics]::FromImage($grid)
$gg.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
for ($i = 0; $i -lt $Count; $i++) {
  $img = [System.Drawing.Image]::FromFile((Join-Path $rawDir ('{0:D2}.png' -f $i)))
  $gg.DrawImage($img, ($i % $gridCols) * $Size, [Math]::Floor($i / $gridCols) * $Size, $Size, $Size)
  $img.Dispose()
}
$gg.Dispose()

# Read the alpha channel once.
$rect = New-Object System.Drawing.Rectangle 0, 0, $gw, $gh
$data = $grid.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, $grid.PixelFormat)
$bytes = New-Object byte[] ($data.Stride * $gh)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
$stride = $data.Stride
$grid.UnlockBits($data)
$colInk = New-Object int[] $gw
$rowInk = New-Object int[] $gh
for ($y = 0; $y -lt $gh; $y++) {
  for ($x = 0; $x -lt $gw; $x++) {
    if ($bytes[$y * $stride + $x * 4 + 3] -gt 0) { $colInk[$x]++; $rowInk[$y]++ }
  }
}

# The true grid lines are where the fewest pixels are painted.
function Find-Offset([int[]] $ink, [int] $cell) {
  $best = 0; $bestInk = [int]::MaxValue
  for ($o = 0; $o -lt $cell; $o++) {
    $sum = 0
    for ($x = $o; $x -lt $ink.Length; $x += $cell) { $sum += $ink[$x] }
    if ($sum -lt $bestInk) { $best = $o; $bestInk = $sum }
  }
  return $best
}
$dx = Find-Offset $colInk $Size
$dy = Find-Offset $rowInk $Size
Write-Verbose "Grid offset: dx=$dx dy=$dy"

# Each corrected candidate starts at the emptiest line; it wraps within its own row and column.
for ($i = 0; $i -lt $Count; $i++) {
  $cx = ($i % $gridCols) * $Size + $dx
  $cy = [Math]::Floor($i / $gridCols) * $Size + $dy
  $out = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $Size; $y++) {
    $sy = ($cy + $y) % $gh
    for ($x = 0; $x -lt $Size; $x++) {
      $out.SetPixel($x, $y, $grid.GetPixel(($cx + $x) % $gw, $sy))
    }
  }
  $out.Save((Join-Path $dir ('{0:D2}.png' -f $i)), [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
}
$grid.Dispose()

$cols = 8
$cell = $Size * $Scale
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
