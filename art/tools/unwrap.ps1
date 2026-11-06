param([Parameter(Mandatory)] [string] $Path)

# Some PixelLab candidates come back rolled horizontally (the subject wraps around the left
# and right edges). Find the widest run of empty columns, cut the image there, and centre the
# subject horizontally. Writes the result over the file. Rows are left as they are.
Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile($Path)
$w = $src.Width; $h = $src.Height
$empty = 0..($w - 1) | ForEach-Object { $x = $_; -not (0..($h - 1) | Where-Object { $src.GetPixel($x, $_).A -gt 0 } | Select-Object -First 1) }

# Widest cyclic run of empty columns.
$bestStart = -1; $bestLen = 0
for ($s = 0; $s -lt $w; $s++) {
  if (-not $empty[$s] -or $empty[($s - 1 + $w) % $w]) { continue }
  $len = 0; while ($len -lt $w -and $empty[($s + $len) % $w]) { $len++ }
  if ($len -gt $bestLen) { $bestLen = $len; $bestStart = $s }
}

if ($bestLen -eq 0 -or $bestLen -eq $w) { $src.Dispose(); return }

# Content starts right after the empty run; place it centred.
$contentStart = ($bestStart + $bestLen) % $w
$contentWidth = $w - $bestLen
$offset = [Math]::Floor(($w - $contentWidth) / 2)

$out = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($x = 0; $x -lt $contentWidth; $x++) {
  $sx = ($contentStart + $x) % $w
  for ($y = 0; $y -lt $h; $y++) { $out.SetPixel($offset + $x, $y, $src.GetPixel($sx, $y)) }
}
$src.Dispose()
$out.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose()
