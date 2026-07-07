#!/bin/bash
# Screenshot Studio — stop all local servers started from THIS folder.
#
# Double-click in Finder (or run from a terminal) to cleanly shut down the
# editor's dev/production server(s), freeing their ports and memory. Safe: it
# only touches servers whose working directory is this project — other apps and
# other Next.js projects are left alone.

cd "$(dirname "$0")"
REPO="$(pwd)"

echo "Screenshot Studio — stopping servers…"
echo "-------------------------------------"

# Candidate processes (Next server/launcher, npm dev/start), then keep only the
# ones whose working directory is THIS repo.
candidates=$( { pgrep -f "next-server" ; pgrep -f "$REPO/node_modules/.bin/next" ; pgrep -f "npm run dev" ; pgrep -f "npm start" ; } 2>/dev/null | sort -u )
pids=""
for p in $candidates; do
  cwd=$(lsof -a -d cwd -p "$p" -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)
  [ "$cwd" = "$REPO" ] && pids="$pids $p"
done

if [ -z "$pids" ]; then
  echo "Активных серверов этой папки не найдено."
else
  echo "Завершаю процессы:$pids"
  kill $pids 2>/dev/null || true
  sleep 2
  kill -9 $pids 2>/dev/null || true
  echo "Готово — серверы остановлены, порты и память освобождены."
fi

echo ""
read -n 1 -s -r -p "Нажмите любую клавишу, чтобы закрыть…"
