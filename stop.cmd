@echo off
setlocal

rem Screenshot Studio - stop all local servers started from THIS folder.
rem Double-click in File Explorer to cleanly shut down the editor's server(s),
rem freeing their ports and memory. Scoped to this project by command line, so
rem other apps and other Next.js projects are left alone.

cd /d "%~dp0"

echo Screenshot Studio - stopping servers...
echo ---------------------------------------

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$repo = $env:CD; $procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like ('*' + $repo + '*') }; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; Write-Host 'Stopped' $procs.Count 'process(es).' } else { Write-Host 'No servers from this folder are running.' }"

echo.
pause
