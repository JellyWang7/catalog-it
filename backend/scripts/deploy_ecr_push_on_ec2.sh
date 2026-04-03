#!/usr/bin/env bash
set -euo pipefail

# Build the image ON EC2 (native linux/amd64) and push to ECR — much faster than
# docker buildx --platform linux/amd64 on Apple Silicon (QEMU emulation).
#
# Prereqs on EC2: Docker, AWS CLI or instance IAM role with ECR push, repo cloned
# with your latest code (git pull after you push from your laptop).
#
# Usage (from your Mac, in backend/):
#   export ECR_REPO=<account>.dkr.ecr.<region>.amazonaws.com/catalogit-backend
#   export EC2_SSH=ec2-user@ec2-...amazonaws.com
#   export EC2_BACKEND_DIR=/home/ec2-user/catalog-it/backend
#   chmod +x scripts/deploy_ecr_push_on_ec2.sh
#   ./scripts/deploy_ecr_push_on_ec2.sh
#
# Optional:
#   GIT_PULL_ON_EC2=1   — run git pull in the repo root (parent of backend/) first

ECR_REPO="${ECR_REPO:?Set ECR_REPO to your full ECR URI}"
EC2_SSH="${EC2_SSH:?Set EC2_SSH to ec2-user@host}"
EC2_BACKEND_DIR="${EC2_BACKEND_DIR:?Set EC2_BACKEND_DIR to absolute path to backend/ on EC2}"
TAG="${ECR_TAG:-latest}"
REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID="${ECR_REPO%%.*}"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
GIT_PULL_ON_EC2="${GIT_PULL_ON_EC2:-0}"

ssh -o StrictHostKeyChecking=accept-new "${EC2_SSH}" bash -s <<EOF
set -euo pipefail
ECR_REPO='${ECR_REPO}'
TAG='${TAG}'
REGION='${REGION}'
REGISTRY='${REGISTRY}'
BACKEND_DIR='${EC2_BACKEND_DIR}'
GIT_PULL_ON_EC2='${GIT_PULL_ON_EC2}'

if [[ "\${GIT_PULL_ON_EC2}" == "1" ]]; then
  repo_root="\$(cd "\${BACKEND_DIR}/.." && pwd)"
  echo "git pull in \${repo_root} ..."
  (cd "\${repo_root}" && git pull)
fi

cd "\${BACKEND_DIR}"

echo "Logging into ECR (\${REGION})..."
aws ecr get-login-password --region "\${REGION}" | docker login --username AWS --password-stdin "\${REGISTRY}"

echo "docker build (native \$(uname -m)) + push \${ECR_REPO}:\${TAG} ..."
docker build -t "\${ECR_REPO}:\${TAG}" .
docker push "\${ECR_REPO}:\${TAG}"

echo "Done."
EOF

echo "On EC2 refresh the container:"
echo "  cd ${EC2_BACKEND_DIR}"
echo "  set -a && source .env.production && set +a"
echo "  export ECR_REPO=${ECR_REPO}"
echo "  ./scripts/deploy_ec2_backend.sh --pull"
