$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$node = "C:\Program Files\nodejs\node.exe"
$vite = Join-Path $projectRoot "node_modules\vite\bin\vite.js"

if (-not (Test-Path $node)) {
  Write-Host "Khong tim thay Node.js tai: $node" -ForegroundColor Red
  Write-Host "Hay cai Node.js hoac kiem tra lai duong dan."
  Read-Host "Nhan Enter de thoat"
  exit 1
}

if (-not (Test-Path $vite)) {
  Write-Host "Khong tim thay node_modules. Hay chay: npm install" -ForegroundColor Yellow
  Read-Host "Nhan Enter de thoat"
  exit 1
}

Write-Host "Dang chay Tu Vi local..." -ForegroundColor Green
Write-Host "Mo trinh duyet tai: http://localhost:5173/"
Write-Host "Neu vao tu may khac cung mang: http://192.168.0.108:5173/"
Write-Host ""

& $node $vite --host 0.0.0.0 --port 5173 --strictPort

Write-Host ""
Write-Host "Server da dung. Neu day la loi, chup lai man hinh dong thong bao phia tren." -ForegroundColor Yellow
Read-Host "Nhan Enter de thoat"
