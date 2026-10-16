#!/usr/bin/env bash
# Libère les ressources de vérification : profils Chrome jetables et processus
# orphelins laissés par un arrêt brutal du harness.
set -u
NOMBRE=$(pgrep -f 'chrome.*--user-data-dir=/tmp/chrome-' | wc -l)
for pid in $(pgrep -f 'chrome.*--user-data-dir=/tmp/chrome-'); do
  kill "$pid" 2>/dev/null
done
sleep 2
rm -rf /tmp/chrome-verif-* /tmp/chrome-diag-* /tmp/chrome-profile-* 2>/dev/null
echo "$NOMBRE processus Chrome de vérification libérés"
pgrep -c -f 'chrome.*--user-data-dir=/tmp/chrome-' 2>/dev/null || echo "0 restant"
