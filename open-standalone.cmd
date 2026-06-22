@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

echo Dang build ban local moi nhat...
call "C:\Program Files\nodejs\npm.cmd" run build
if errorlevel 1 (
  echo.
  echo Build bi loi. Kiem tra thong bao phia tren.
  pause
  exit /b 1
)

echo.
echo Dang tao file HTML doc lap...
"C:\Program Files\nodejs\node.exe" make-standalone.mjs
if errorlevel 1 (
  echo.
  echo Tao file standalone bi loi. Kiem tra thong bao phia tren.
  pause
  exit /b 1
)

echo.
echo Dang mo dist\standalone.html...
start "" "%~dp0dist\standalone.html"
