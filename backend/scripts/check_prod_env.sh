#!/usr/bin/env bash
set -euo pipefail

# Validate required production env vars before deploy.
# Usage:
#   set -a && source .env.production && set +a
#   ./scripts/check_prod_env.sh
#   ./scripts/check_prod_env.sh --skip-s3-check

required_vars=(
  RAILS_MASTER_KEY
  SECRET_KEY_BASE
  FRONTEND_URL
  DATABASE_HOST
  DATABASE_USERNAME
  CATALOGIT_DATABASE_PASSWORD
)

optional_vars=(
  DATABASE_PORT
  DATABASE_NAME
  RAILS_ENV
  ACTIVE_STORAGE_SERVICE
  AWS_REGION
  RAILS_MAX_THREADS
  WEB_CONCURRENCY
  RAILS_LOG_LEVEL
)

skip_s3_check=false
if [[ "${1:-}" == "--skip-s3-check" ]]; then
  skip_s3_check=true
fi

if [[ "${1:-}" != "" && "${1:-}" != "--skip-s3-check" ]]; then
  echo "Unknown option: ${1}" >&2
  echo "Usage: ./scripts/check_prod_env.sh [--skip-s3-check]" >&2
  exit 1
fi

if [[ "${skip_s3_check}" == "false" ]]; then
  required_vars+=(
    AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY
    AWS_S3_BUCKET
  )
fi

missing=()

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    missing+=("${var_name}")
  fi
done

if [[ "${#missing[@]}" -gt 0 ]]; then
  echo "ERROR: missing required production env vars:" >&2
  for var_name in "${missing[@]}"; do
    echo "  - ${var_name}" >&2
  done
  exit 1
fi

echo "Production env validation passed."
echo "Required vars are present."
if [[ "${skip_s3_check}" == "true" ]]; then
  echo "S3 checks were skipped (--skip-s3-check)."
fi
echo "Optional vars currently set:"
for var_name in "${optional_vars[@]}"; do
  if [[ -n "${!var_name:-}" ]]; then
    echo "  - ${var_name}=<set>"
  else
    echo "  - ${var_name}=<not set>"
  fi
done
