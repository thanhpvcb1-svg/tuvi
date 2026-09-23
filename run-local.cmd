@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
if not exist "serve-dist.mjs" (
  echo Khong tim thay serve-dist.mjs.
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo Khong tim thay node_modules. Hay chay: npm install
  pause
  exit /b 1
)

echo Dang build ban local moi nhat...
call "C:\Program Files\nodejs\npm.cmd" run build
if errorlevel 1 (
  echo.
  echo Build bi loi. Kiem tra thong bao phia tren.
  pause
  exit /b 1
)

echo.
echo Dang mo server local. Trinh duyet se tu mo link dung, thuong la http://127.0.0.1:5173/
"C:\Program Files\nodejs\node.exe" serve-dist.mjs

if errorlevel 1 (
  echo.
  echo Dev server da dung hoac bi loi. Kiem tra thong bao phia tren.
  pause
)
