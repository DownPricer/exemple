#!/usr/bin/env bash
# À copier UNE FOIS sur le VPS : /opt/client1/deploy-client1.sh
# chmod +x /opt/client1/deploy-client1.sh
#
# Règle : tout le déploiement reste sous /opt/client1. Ne pas modifier ce script
# pour ajouter des chemins ailleurs.

set -euo pipefail

ROOT="/opt/client1"
cd "$ROOT"

git pull --ff-only

# Recrée / redémarre uniquement les services définis dans CE dépôt.
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
