#!/usr/bin/env bash
# Démarre le frontend Vite en tâche de fond. Logs : /tmp/ticketflow-frontend.log
set -u
RACINE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RACINE/frontend" || exit 1

# npm peut être lent à démarrer : on attend l'écoute du port jusqu'au délai donné.
DELAI="${1:-45}"
setsid nohup npm run dev > /tmp/ticketflow-frontend.log 2>&1 < /dev/null &

for _ in $(seq 1 "$DELAI"); do
  if ss -tln | grep -q ':5173 '; then
    echo "Frontend à l'écoute sur http://localhost:5173"
    exit 0
  fi
  sleep 1
done

echo "échec du démarrage — contenu de /tmp/ticketflow-frontend.log :"
cat /tmp/ticketflow-frontend.log
exit 1
