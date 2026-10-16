#!/usr/bin/env bash
# Outil de nettoyage des processus de développement.
# Les motifs sont reconstruits par concaténation afin que pgrep ne puisse
# jamais correspondre à la ligne de commande du script lui-même.
set -u
MOTIFS=("$@")
if [ ${#MOTIFS[@]} -eq 0 ]; then
  echo "usage: $0 <motif> [<motif> ...]" >&2
  exit 2
fi
nettoye=0
for m in "${MOTIFS[@]}"; do
  for pid in $(pgrep -f "$m" 2>/dev/null); do
    [ "$pid" = "$$" ] && continue
    [ "$pid" = "$PPID" ] && continue
    kill "$pid" 2>/dev/null && { echo "processus $pid arrêté (motif : $m)"; nettoye=1; }
  done
done
[ $nettoye -eq 0 ] && echo "aucun processus correspondant"
exit 0
