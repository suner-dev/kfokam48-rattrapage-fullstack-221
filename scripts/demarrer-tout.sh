#!/usr/bin/env bash
# Démarre toute la stack TicketFlow : base PostgreSQL (Docker), backend, frontend.
set -u
RACINE="$(cd "$(dirname "$0")/.." && pwd)"

echo "1/3 Base PostgreSQL (Docker)…"
docker compose -f "$RACINE/docker-compose.yml" up -d >/dev/null 2>&1 || {
  echo "  docker compose a échoué — vérifier que Docker tourne"; exit 1;
}
for i in $(seq 1 30); do
  etat=$(docker inspect -f '{{.State.Health.Status}}' ticketflow-db 2>/dev/null || echo starting)
  [ "$etat" = "healthy" ] && break
  sleep 1
done
echo "  container ticketflow-db : ${etat:-starting}"

echo "2/3 Backend Spring Boot…"
"$RACINE/scripts/start-backend.sh"

echo "3/3 Frontend React (Vite)…"
"$RACINE/scripts/start-frontend.sh"

echo
echo "Contrôles :"
curl -s -o /dev/null -w "  API       GET /api/tickets → %{http_code}\n" http://localhost:8080/api/tickets
curl -s -o /dev/null -w "  Swagger   /swagger-ui.html → %{http_code}\n" http://localhost:8080/swagger-ui.html
curl -s -o /dev/null -w "  Écran     /            → %{http_code}\n" http://localhost:5173/
