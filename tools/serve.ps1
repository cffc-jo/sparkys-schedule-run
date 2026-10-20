# Tiny static file server for local testing (no Node needed). Run from anywhere:
#   powershell -ExecutionPolicy Bypass -File tools/serve.ps1
# then open http://localhost:8541/
#
# Dev-only extra: the dev tools can save generated images with PUT, limited to:
#   /assets/logos/<CODE>.png        (tools/logo-preview.html)
#   /assets/sprites/sparky.png, /assets/og-image.png, /assets/favicon.png,
#   /assets/apple-touch-icon.png    (tools/export-art.html)
# PNG files only, localhost only. GitHub Pages is static, so none of this exists once deployed.
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$port = 8541
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".json" = "application/json"
  ".ico"  = "image/x-icon"
  ".woff2" = "font/woff2"
}

function Send-Text($res, $code, $text) {
  $res.StatusCode = $code
  $msg = [Text.Encoding]::UTF8.GetBytes($text)
  $res.OutputStream.Write($msg, 0, $msg.Length)
}

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ($path -eq "/") { $path = "/index.html" }
    $filePath = [IO.Path]::GetFullPath((Join-Path $root ($path.TrimStart("/") -replace "/", [IO.Path]::DirectorySeparatorChar)))
    $res.AddHeader("Cache-Control", "no-store")

    if (-not $filePath.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
      Send-Text $res 403 "Forbidden"
    } elseif ($req.HttpMethod -eq "PUT") {
      if ($path -cmatch '^/assets/(logos/[A-Z0-9_]{1,12}|sprites/sparky|og-image|favicon|apple-touch-icon)\.png$') {
        $ms = New-Object IO.MemoryStream
        $req.InputStream.CopyTo($ms)
        $bytes = $ms.ToArray()
        # PNG signature check
        if ($bytes.Length -gt 8 -and $bytes.Length -lt 2000000 -and $bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50 -and $bytes[2] -eq 0x4E -and $bytes[3] -eq 0x47) {
          [IO.File]::WriteAllBytes($filePath, $bytes)
          Write-Host "Saved $path ($($bytes.Length) bytes)"
          Send-Text $res 200 "Saved"
        } else {
          Send-Text $res 400 "Not a PNG"
        }
      } else {
        Send-Text $res 403 "Only the dev-tool images can be saved"
      }
    } elseif (Test-Path $filePath -PathType Leaf) {
      $ext = [IO.Path]::GetExtension($filePath).ToLower()
      $ct = $mime[$ext]
      if (-not $ct) { $ct = "application/octet-stream" }
      $bytes = [IO.File]::ReadAllBytes($filePath)
      $res.ContentType = $ct
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      Send-Text $res 404 "Not found: $path"
    }
    $res.OutputStream.Close()
  } catch {
    Write-Host "Error: $_"
  }
}
