#!/usr/bin/env bash
set -euo pipefail

# Deploy or refresh the Rails backend container on EC2.
#
# Usage (from backend/):
#   ./scripts/deploy_ec2_backend.sh                  # build image locally on EC2 (slow on micro)
#   ./scripts/deploy_ec2_backend.sh --pull            # pull pre-built image from ECR (fast)
#   ./scripts/deploy_ec2_backend.sh --skip-s3-check   # build locally, skip S3 env check
#   ./scripts/deploy_ec2_backend.sh --pull --skip-s3-check

APP_NAME="${APP_NAME:-catalogit_backend}"
IMAGE_NAME="${IMAGE_NAME:-catalogit/backend:ec2}"
HOST_PORT="${HOST_PORT:-80}"

use_pull=false
check_env_args=()

for arg in "$@"; do
  case "${arg}" in
    --pull)        use_pull=true ;;
    --skip-s3-check) check_env_args+=("--skip-s3-check") ;;
    *)
      echo "Unknown option: ${arg}" >&2
      echo "Usage: ./scripts/deploy_ec2_backend.sh [--pull] [--skip-s3-check]" >&2
      exit 1
      ;;
  esac
done

echo "Validating production env vars..."
./scripts/check_prod_env.sh "${check_env_args[@]}"

export RAILS_ENV="${RAILS_ENV:-production}"
export DATABASE_NAME="${DATABASE_NAME:-catalogit_production}"
export DATABASE_PORT="${DATABASE_PORT:-5432}"
export RAILS_MAX_THREADS="${RAILS_MAX_THREADS:-5}"
export WEB_CONCURRENCY="${WEB_CONCURRENCY:-1}"
export RAILS_LOG_LEVEL="${RAILS_LOG_LEVEL:-info}"

if [[ "${use_pull}" == "true" ]]; then
  ECR_REPO="${ECR_REPO:?Set ECR_REPO to your full ECR URI when using --pull}"
  ECR_TAG="${ECR_TAG:-latest}"
  REGION="${AWS_REGION:-us-east-1}"
  ACCOUNT_ID="${ECR_REPO%%.*}"

  echo "Logging into ECR (${REGION})..."
  aws ecr get-login-password --region "${REGION}" | \
    docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

  echo "Pulling image ${ECR_REPO}:${ECR_TAG} ..."
  docker pull "${ECR_REPO}:${ECR_TAG}"

  IMAGE_NAME="${ECR_REPO}:${ECR_TAG}"
else
  echo "Building backend Docker image: ${IMAGE_NAME}"
  docker build -t "${IMAGE_NAME}" .
fi

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
