#!/bin/bash
# Screenshot Studio launcher.
# Double-click this file in Finder to start the editor, or run it from a terminal.
# It installs dependencies on first run, starts the dev server, and opens the browser.

set -e

# Always work from the folder this script lives in, regardless of where it's launched from.
cd "$(dirname "$0")"

PORT=3000
URL="http://localhost:$PORT"

echo "Screenshot Studio"
echo "-----------------"

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

# 5. Start the dev server (stays running in the foreground).
npm run dev
