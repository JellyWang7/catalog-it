#!/usr/bin/env bash
set -euo pipefail

# Build the production Docker image on your laptop (fast) and push to ECR.
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

echo "Building linux/amd64 image and pushing to ${ECR_REPO}:${TAG} ..."
docker buildx create --use --name catalogit_builder 2>/dev/null || true
docker buildx build \
  --platform linux/amd64 \
  -t "${ECR_REPO}:${TAG}" \
  --push .

echo "Done. On EC2 run:"
echo "  export ECR_REPO=${ECR_REPO}"
echo "  ./scripts/deploy_ec2_backend.sh --pull"
