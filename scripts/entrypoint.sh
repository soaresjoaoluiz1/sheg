#!/bin/sh
set -e

echo "[entrypoint] Sincronizando schema com Postgres..."
node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

echo "[entrypoint] Rodando seed (idempotente, ignora erros)..."
node --experimental-strip-types prisma/seed.ts || echo "[entrypoint] Seed pulado (provavelmente ja populado)"

echo "[entrypoint] Iniciando Next.js..."
exec "$@"
