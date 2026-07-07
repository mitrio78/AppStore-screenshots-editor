#!/bin/bash
# Screenshot Studio launcher.
# Double-click this file in Finder to start the editor, or run it from a terminal.
#
# Runs the PRODUCTION server by default (fast, low memory — right for daily use).
# The dev server (hot reload, but heavy and it grows in memory over long
# sessions) is only for working on the editor's code:
#
#   ./start.command       # production (recommended)
#   ./start.command dev   # development with hot reload

set -e

# Always work from the folder this script lives in, regardless of where it's launched from.
cd "$(dirname "$0")"

MODE="${1:-prod}"
PORT=3000
URL="http://localhost:$PORT"

echo "Screenshot Studio ($MODE)"
echo "-------------------------"

# 1. Check Node.js is available.
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js не найден. Установите его с https://nodejs.org (LTS) и запустите снова."
  echo ""
  read -n 1 -s -r -p "Нажмите любую клавишу, чтобы закрыть…"
  exit 1
fi
echo "✓ Node.js $(node -v)"

# 2. Install dependencies on first run (or after they were removed).
if [ ! -d node_modules ]; then
  echo "Первый запуск — устанавливаю зависимости (несколько минут)…"
  npm install
fi

# 3. If the server is already up on this port, just open the browser and exit.
if curl -s -o /dev/null "http://localhost:$PORT" 2>/dev/null; then
  echo "Сервер уже запущен — открываю $URL"
  open "$URL"
  exit 0
fi

# 4. Open the browser a few seconds after the server starts booting.
( sleep 4; open "$URL" ) &

echo "Запускаю сервер на $URL"
echo "Чтобы остановить — нажмите Ctrl+C в этом окне."
echo ""

if [ "$MODE" = "dev" ]; then
  # 5a. Development server (hot reload; heavier on CPU/RAM).
  npm run dev
else
  # 5b. Production: rebuild only when the app's source is newer than the last build.
  #     (Project JSON, uploads and fonts are runtime data — they never need a rebuild.)
  if [ ! -f .next/BUILD_ID ] || [ -n "$(find src package.json next.config.mjs tailwind.config.ts -newer .next/BUILD_ID -print -quit 2>/dev/null)" ]; then
    echo "Собираю production-версию (1-2 минуты, только после изменений кода)…"
    npm run build
  fi
  npm start
fi
