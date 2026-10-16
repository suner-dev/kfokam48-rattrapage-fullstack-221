#!/usr/bin/env bash
# Arrête tout processus lié au backend TicketFlow (wrapper Maven + JVM applicative),
# en s'appuyant sur des motifs stockés dans des variables pour ne jamais
# correspondre à la ligne de commande de l'appelant.
set -u
MOTIFS=("spring""-boot:run" "Ticket""FlowApiApplication" "ticket""flow-api")
for m in "${MOTIFS[@]}"; do
  for pid in $(pgrep -f "$m" 2>/dev/null); do
    if [ "$pid" != "$$" ] && [ "$pid" != "$PPID" ]; then
      kill "$pid" 2>/dev/null && echo "arrêt du processus $pid (motif : $m)"
    fi
  done
done
sleep 2
ss -tln | grep -q ':8080 ' && echo "avertissement : 8080 toujours occupé" || echo "port 8080 libre"
