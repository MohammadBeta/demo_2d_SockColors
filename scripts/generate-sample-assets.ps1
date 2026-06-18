Add-Type -AssemblyName System.Drawing

$assetDir = Join-Path $PSScriptRoot "..\public\assets"
New-Item -ItemType Directory -Force -Path $assetDir | Out-Null

function New-Bitmap($width, $height) {
  $bitmap = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bitmap.SetResolution(144, 144)
  return $bitmap
}

function New-PathFromPoints($points) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddCurve($points)
  $path.CloseFigure()
  return $path
}

function Save-Png($bitmap, $name) {
  $path = Join-Path $assetDir $name
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function Draw-Shoe {
  $bitmap = New-Bitmap 1000 520
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $upperPoints = @(
    [System.Drawing.PointF]::new(96, 278),
    [System.Drawing.PointF]::new(170, 210),
    [System.Drawing.PointF]::new(286, 164),
    [System.Drawing.PointF]::new(432, 132),
    [System.Drawing.PointF]::new(548, 144),
    [System.Drawing.PointF]::new(640, 226),
    [System.Drawing.PointF]::new(778, 248),
    [System.Drawing.PointF]::new(900, 302),
    [System.Drawing.PointF]::new(920, 348),
    [System.Drawing.PointF]::new(760, 366),
    [System.Drawing.PointF]::new(444, 360),
    [System.Drawing.PointF]::new(190, 344),
    [System.Drawing.PointF]::new(92, 316)
  )
  $upper = New-PathFromPoints $upperPoints
  $graphics.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(230, 238, 242, 247))), $upper)
  $graphics.DrawPath((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 20, 28, 38)), 10), $upper)

  $sole = New-Object System.Drawing.Drawing2D.GraphicsPath
  $sole.AddBezier(76, 330, 180, 374, 706, 388, 916, 354)
  $sole.AddBezier(916, 354, 930, 376, 904, 414, 824, 424)
  $sole.AddBezier(824, 424, 600, 452, 238, 432, 102, 388)
  $sole.AddBezier(102, 388, 54, 370, 44, 346, 76, 330)
  $sole.CloseFigure()
  $graphics.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 245, 247, 250))), $sole)
  $graphics.DrawPath((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 20, 28, 38)), 8), $sole)

  $panel = New-Object System.Drawing.Drawing2D.GraphicsPath
  $panel.AddBezier(238, 252, 326, 184, 440, 176, 548, 246)
  $panel.AddBezier(548, 246, 514, 292, 374, 304, 230, 292)
  $panel.CloseFigure()
  $graphics.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(90, 255, 255, 255))), $panel)
  $graphics.DrawPath((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(130, 20, 28, 38)), 4), $panel)

  $collar = New-Object System.Drawing.Drawing2D.GraphicsPath
  $collar.AddEllipse(430, 152, 180, 112)
  $graphics.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 232, 236, 242))), $collar)
  $graphics.DrawPath((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(150, 20, 28, 38)), 5), $collar)

  $lacePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(220, 20, 28, 38)), 7
  $graphics.DrawLine($lacePen, 346, 226, 484, 284)
  $graphics.DrawLine($lacePen, 388, 204, 538, 282)
  $graphics.DrawLine($lacePen, 430, 190, 590, 286)
  $graphics.DrawLine($lacePen, 312, 274, 520, 224)
  $graphics.DrawLine($lacePen, 364, 294, 570, 238)

  $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 10, 15, 24))
  $graphics.FillEllipse($shadowBrush, 160, 404, 650, 34)

  $graphics.Dispose()
  Save-Png $bitmap "shoe.png"
}

function Draw-StarLogo {
  $bitmap = New-Bitmap 512 512
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 15, 118, 110))), 52, 52, 408, 408)
  $points = @()
  for ($i = 0; $i -lt 10; $i++) {
    $angle = -90 + ($i * 36)
    $radius = if ($i % 2 -eq 0) { 156 } else { 66 }
    $x = 256 + [Math]::Cos($angle * [Math]::PI / 180) * $radius
    $y = 256 + [Math]::Sin($angle * [Math]::PI / 180) * $radius
    $points += [System.Drawing.PointF]::new([single]$x, [single]$y)
  }
  $graphics.FillPolygon((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255, 255))), $points)
  $graphics.Dispose()
  Save-Png $bitmap "logo-spark.png"
}

function Draw-BoltLogo {
  $bitmap = New-Bitmap 512 512
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 248, 250, 252))), 56, 56, 400, 400)
  $graphics.DrawEllipse((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 15, 23, 42)), 26), 56, 56, 400, 400)
  $bolt = @(
    [System.Drawing.PointF]::new(288, 84),
    [System.Drawing.PointF]::new(158, 276),
    [System.Drawing.PointF]::new(252, 276),
    [System.Drawing.PointF]::new(218, 428),
    [System.Drawing.PointF]::new(366, 218),
    [System.Drawing.PointF]::new(268, 218)
  )
  $graphics.FillPolygon((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 245, 158, 11))), $bolt)
  $graphics.Dispose()
  Save-Png $bitmap "logo-bolt.png"
}

function Draw-WaveLogo {
  $bitmap = New-Bitmap 512 512
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.FillEllipse((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 37, 99, 235))), 52, 52, 408, 408)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 255, 255)), 42
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawBezier($pen, 120, 292, 190, 188, 260, 392, 392, 236)
  $graphics.DrawBezier($pen, 132, 352, 226, 278, 292, 430, 386, 330)
  $graphics.Dispose()
  Save-Png $bitmap "logo-wave.png"
}

Draw-Shoe
Draw-StarLogo
Draw-BoltLogo
Draw-WaveLogo

Write-Host "Generated sample PNG assets in $assetDir"
