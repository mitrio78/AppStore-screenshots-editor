@echo off
setlocal

rem Screenshot Studio launcher for Windows.
rem Double-click this file in File Explorer to start the editor.
rem It installs dependencies on first run, starts the dev server, and opens the browser.

cd /d "%~dp0"

set "PORT=3000"
set "URL=http://localhost:%PORT%"

echo Screenshot Studio
echo -----------------

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Install the LTS version from https://nodejs.org and run this file again.
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set "NODE_VERSION=%%v"
echo Node.js %NODE_VERSION%

if not exist "node_modules\" (
  echo First run: installing dependencies. This can take a few minutes...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed.
    pause
    exit /b 1
  )
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing -Uri '%URL%' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 (
  echo Server is already running. Opening %URL%
  start "" "%URL%"
  exit /b 0
)

start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process '%URL%'"

echo Starting server at %URL%
echo Press Ctrl+C in this window to stop it.
echo.

call npm run dev
