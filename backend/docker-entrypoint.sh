#!/bin/sh
set -e

echo "[entrypoint] Aplicando migraciones..."
node /app/database/migrate.js

if [ "$RUN_SEED" = "true" ]; then
  echo "[entrypoint] RUN_SEED=true -> sembrando datos de desarrollo..."
  node /app/database/seeds/seed.js
fi

echo "[entrypoint] Iniciando backend..."
exec "$@"
