#!/usr/bin/env bash
# Démarre le backend Spring Boot en tâche de fond. Logs : /tmp/ticketflow-backend.log
set -u
RACINE="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${SERVER_PORT:-8080}"
cd "$RACINE/backend" || exit 1
export JAVA_HOME="${JAVA_HOME:-/home/arise/.jdks/ms-21.0.12}"

setsid nohup ./mvnw -B spring-boot:run > /tmp/ticketflow-backend.log 2>&1 < /dev/null &

# Le temps de compiler et démarrer peut être long au premier lancement.
for _ in $(seq 1 "${1:-120}"); do
  if ss -tln | grep -q ":$PORT "; then
    echo "Backend à l'écoute sur http://localhost:$PORT (Swagger : /swagger-ui.html)"
    exit 0
  fi
  sleep 1
done

echo "échec du démarrage — fin du journal :"
tail -20 /tmp/ticketflow-backend.log
exit 1
