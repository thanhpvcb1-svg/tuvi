@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

"C:\Program Files\nodejs\node.exe" check-local.mjs

echo.
pause
