#!/usr/bin/env bash
# Build and run the production Dockerfile against a local Postgres — before pushing to EC2.
# Requires backend/.env.production (gitignored) with at least RAILS_MASTER_KEY, SECRET_KEY_BASE,
# and any other vars your app needs at boot (see backend/scripts/check_prod_env.sh --skip-s3-check).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${SMOKE_ENV_FILE:-$ROOT/backend/.env.production}"
COMPOSE=(docker compose -f "$ROOT/docker-compose.prod-local.yml")

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  echo "Create it from your secrets (RAILS_MASTER_KEY, SECRET_KEY_BASE, …). DB/AWS in that file are ignored for smoke — compose pins local Postgres."
  exit 1
fi

echo "==> Building and starting prod-like stack (API on http://127.0.0.1:8088) ..."
"${COMPOSE[@]}" up -d --build

echo "==> Waiting for Rails to finish db:prepare (entrypoint) and /up ..."
for i in {1..40}; do
  if curl -sf "http://127.0.0.1:8088/up" >/dev/null 2>&1; then
    break
  fi
  sleep 2
  if [[ "$i" -eq 40 ]]; then
    echo "Timed out waiting for /up. Logs:"
    "${COMPOSE[@]}" logs --tail=80 backend_prod_smoke
    exit 1
  fi
done

echo "==> GET /up"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "http://127.0.0.1:8088/up"

echo "==> GET /api/v1/lists (public)"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "http://127.0.0.1:8088/api/v1/lists"

echo ""
echo "OK — prod-like smoke passed. Stop with:"
echo "  cd $ROOT && docker compose -f docker-compose.prod-local.yml down"
