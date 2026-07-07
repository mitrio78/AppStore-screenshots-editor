@echo off
setlocal

rem Screenshot Studio launcher for Windows.
rem Double-click this file in File Explorer to start the editor.
rem Runs the PRODUCTION server by default (fast, low memory - right for daily
rem use). Pass "dev" for the development server with hot reload:
rem   start.cmd       - production (recommended)
rem   start.cmd dev   - development

cd /d "%~dp0"

set "MODE=%~1"
if "%MODE%"=="" set "MODE=prod"
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

rem Stop any Screenshot Studio server already running FROM THIS FOLDER, so
rem servers never pile up on new ports. Scoped by command line to this repo path.
echo Clearing any previous server from this folder...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like ('*' + $env:CD + '*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>nul

start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process '%URL%'"

echo Starting server at %URL%
echo Press Ctrl+C in this window to stop it.
echo.

if "%MODE%"=="dev" (
  call npm run dev
) else (
  rem Rebuild only when there is no production build yet. After pulling code
  rem changes, delete the .next folder (or run "npm run build") to refresh.
  if not exist ".next\BUILD_ID" (
    echo Building the production bundle, this takes a minute or two...
    call npm run build
    if errorlevel 1 (
      echo.
      echo npm run build failed.
      pause
      exit /b 1
    )
  )
  call npm start
)
