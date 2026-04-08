#!/usr/bin/env bash
set -euo pipefail

# Build the production Docker image and push to ECR.
#
# On Apple Silicon, --platform linux/amd64 uses QEMU and is SLOW (~many minutes).
# Faster options:
#   - ./scripts/deploy_ecr_push_on_ec2.sh — build natively on your x86_64 EC2, then push
#   - Keep using this script but set CATALOGIT_DOCKER_BUILD_CACHE to reuse layers (2nd+ builds faster)
#
# Then on EC2, run: ./scripts/deploy_ec2_backend.sh --pull
#
# Usage (from backend/):
#   export ECR_REPO=<account-id>.dkr.ecr.<region>.amazonaws.com/<repo>
#   ./scripts/deploy_ecr_push.sh

ECR_REPO="${ECR_REPO:?Set ECR_REPO to your full ECR URI, e.g. 123456789.dkr.ecr.us-east-1.amazonaws.com/catalogit-backend}"
TAG="${ECR_TAG:-latest}"
REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID="${ECR_REPO%%.*}"

echo "Logging into ECR (${REGION})..."
aws ecr get-login-password --region "${REGION}" | \
  docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

BUILDX_ARGS=(--platform linux/amd64 -t "${ECR_REPO}:${TAG}" --push .)
if [[ -n "${CATALOGIT_DOCKER_BUILD_CACHE:-}" ]]; then
  mkdir -p "${CATALOGIT_DOCKER_BUILD_CACHE}"
  BUILDX_ARGS=(--platform linux/amd64
    --cache-to "type=local,dest=${CATALOGIT_DOCKER_BUILD_CACHE},mode=max"
    --cache-from "type=local,src=${CATALOGIT_DOCKER_BUILD_CACHE}"
    -t "${ECR_REPO}:${TAG}" --push .)
  echo "Using Buildx local cache: ${CATALOGIT_DOCKER_BUILD_CACHE}"
fi

echo "Building linux/amd64 image and pushing to ${ECR_REPO}:${TAG} ..."
docker buildx create --use --name catalogit_builder 2>/dev/null || true
docker buildx build "${BUILDX_ARGS[@]}"

echo "Done. On EC2 run:"
echo "  export ECR_REPO=${ECR_REPO}"
echo "  ./scripts/deploy_ec2_backend.sh --pull"
