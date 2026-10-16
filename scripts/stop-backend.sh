#!/usr/bin/env bash
# Arrête le backend TicketFlow à partir du port écouté (8080 par défaut).
set -u
PORT="${1:-8080}"
PID=$(ss -tlnp 2>/dev/null | grep ":$PORT " | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2)
if [ -n "${PID:-}" ]; then
  kill "$PID" && echo "Processus $PID (port $PORT) arrêté"
else
  echo "Aucun processus à l'écoute sur le port $PORT"
fi
