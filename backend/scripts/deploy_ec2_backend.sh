#!/usr/bin/env bash
set -euo pipefail

# Deploy or refresh the Rails backend container on EC2.
# Run this script from the backend directory:
#   cd /path/to/catalog-it/backend
#   chmod +x scripts/deploy_ec2_backend.sh
#   ./scripts/deploy_ec2_backend.sh
#   ./scripts/deploy_ec2_backend.sh --skip-s3-check

APP_NAME="${APP_NAME:-catalogit_backend}"
IMAGE_NAME="${IMAGE_NAME:-catalogit/backend:ec2}"
HOST_PORT="${HOST_PORT:-80}"

check_env_args=()
if [[ "${1:-}" == "--skip-s3-check" ]]; then
  check_env_args+=("--skip-s3-check")
elif [[ "${1:-}" != "" ]]; then
  echo "Unknown option: ${1}" >&2
  echo "Usage: ./scripts/deploy_ec2_backend.sh [--skip-s3-check]" >&2
  exit 1
fi

echo "Validating production env vars..."
./scripts/check_prod_env.sh "${check_env_args[@]}"

export RAILS_ENV="${RAILS_ENV:-production}"
export DATABASE_NAME="${DATABASE_NAME:-catalogit_production}"
export DATABASE_PORT="${DATABASE_PORT:-5432}"
export RAILS_MAX_THREADS="${RAILS_MAX_THREADS:-5}"
export WEB_CONCURRENCY="${WEB_CONCURRENCY:-1}"
export RAILS_LOG_LEVEL="${RAILS_LOG_LEVEL:-info}"

echo "Building backend Docker image: ${IMAGE_NAME}"
docker build -t "${IMAGE_NAME}" .

echo "Stopping existing container (if present): ${APP_NAME}"
docker rm -f "${APP_NAME}" >/dev/null 2>&1 || true

echo "Starting container: ${APP_NAME}"
docker run -d \
  --name "${APP_NAME}" \
  --restart unless-stopped \
  -p "${HOST_PORT}:80" \
  -e RAILS_ENV \
  -e SECRET_KEY_BASE \
  -e FRONTEND_URL \
  -e DATABASE_HOST \
  -e DATABASE_PORT \
  -e DATABASE_NAME \
  -e DATABASE_USERNAME \
  -e CATALOGIT_DATABASE_PASSWORD \
  -e RAILS_MAX_THREADS \
  -e WEB_CONCURRENCY \
  -e RAILS_LOG_LEVEL \
  "${IMAGE_NAME}"

echo "Running database prepare inside container..."
docker exec "${APP_NAME}" ./bin/rails db:prepare

echo "Deployment finished."
echo "Container status:"
docker ps --filter "name=${APP_NAME}"
