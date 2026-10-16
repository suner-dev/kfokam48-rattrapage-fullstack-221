#!/usr/bin/env bash
# Arrête le serveur de développement Vite qui occupe le port 5173.
set -u
PORT="${1:-5173}"
if ss -tln | grep -q ":$PORT "; then
  for pid in $(ss -tlnp | grep ":$PORT " | grep -oE 'pid=[0-9]+' | sed 's/pid=//' | sort -u); do
    # Jamais le shell appelant ni son père.
    if [ "$pid" = "$$" ] || [ "$pid" = "$PPID" ]; then continue; fi
    kill "$pid" 2>/dev/null && echo "arrêt du processus $pid (port $PORT)"
  done
  sleep 1
fi
ss -tln | grep -q ":$PORT " && { echo "le port $PORT est encore occupé"; exit 1; } || echo "port $PORT libre"
exit 0
