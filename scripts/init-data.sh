#!/bin/bash
# Run once on the server before first docker compose up
# Creates the persistent data files that are volume-mounted into the container

DEPLOY_DIR="${1:-/opt/stacks/msp-benefits-26}"

mkdir -p "$DEPLOY_DIR/api/snapshots"

if [ ! -f "$DEPLOY_DIR/api/data.json" ]; then
  echo '{}' > "$DEPLOY_DIR/api/data.json"
  echo "Created $DEPLOY_DIR/api/data.json"
else
  echo "Skipped — $DEPLOY_DIR/api/data.json already exists"
fi

chown -R 101:101 "$DEPLOY_DIR/api"
echo "Done. Ownership set to nginx (uid 101)."
