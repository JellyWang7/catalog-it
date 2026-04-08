# Completed Code (Backend) — explanation + evidence

## Overview

CatalogIt is a web application with:

- **Frontend**: Single-page app (served from S3 through CloudFront).
- **Backend**: Ruby on Rails API running in a Docker container on **EC2**.
- **Database**: PostgreSQL on **RDS**.
- **File uploads**: Rails Active Storage using **S3**.
- **Background jobs**: Solid Queue (schema loaded via `db:ensure_solid_queue`).

This section explains how the backend is deployed and run in production and includes script/code excerpts.

## Production deployment flow (what happens)

1. A production Docker image for the Rails backend is built and pushed to **ECR**.
2. On **EC2**, the deployment script:
   - validates required env vars,
   - logs into ECR,
   - pulls the image,
   - recreates the backend container,
   - runs `db:prepare` and `db:ensure_solid_queue`,
   - exposes the service on port 80.
3. **CloudFront** routes `/api/*`, `/up`, `/rails/*`, and `/api-docs*` requests to the EC2 origin (HTTP).

## Evidence: key scripts used

### Backend deployment on EC2

File: `backend/scripts/deploy_ec2_backend.sh`

Key behavior (excerpt):

```33:98:/Users/Jelly1/Documents/my-app/catalogIt/catalog-it/backend/scripts/deploy_ec2_backend.sh
echo "Validating production env vars..."
./scripts/check_prod_env.sh "${check_env_args[@]}"

if [[ "${use_pull}" == "true" ]]; then
  ECR_REPO="${ECR_REPO:?Set ECR_REPO to your full ECR URI when using --pull}"
  # ... ECR login ...
  docker pull "${ECR_REPO}:${ECR_TAG}"
  IMAGE_NAME="${ECR_REPO}:${ECR_TAG}"
else
  docker build -t "${IMAGE_NAME}" .
fi

docker run -d \
  --name "${APP_NAME}" \
  --restart unless-stopped \
  -p "${HOST_PORT}:80" \
  # ... env passthrough ...
  "${IMAGE_NAME}"

docker exec "${APP_NAME}" ./bin/rails db:prepare
docker exec "${APP_NAME}" ./bin/rails db:ensure_solid_queue
```

### Backend image push to ECR (from laptop)

File: `backend/scripts/deploy_ecr_push.sh`

- Builds an **amd64** image and pushes to ECR.
- On Apple Silicon, this is slower due to emulation; a local build cache can help.

### Backend image push to ECR (from EC2, optional optimization)

File: `backend/scripts/deploy_ecr_push_on_ec2.sh`

- Builds **natively** on the EC2 host (linux/amd64) and pushes to ECR; significantly faster than cross-building on Apple Silicon.

## Evidence: environment configuration (high-level)

Production runtime behavior is controlled by environment variables loaded from `.env.production` on EC2 (not committed). Examples:

- Rails: `RAILS_ENV`, `SECRET_KEY_BASE`, thread/concurrency
- DB: `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_USERNAME`, `CATALOGIT_DATABASE_PASSWORD`
- Uploads: `ACTIVE_STORAGE_SERVICE=amazon`, `AWS_REGION`, `AWS_S3_BUCKET`
- Public URL: `FRONTEND_URL`, `PUBLIC_APP_URL`

## Screenshots to include (recommended)

Add these screenshots to `docs/final-submission/assets/` and link them here:

- **(A)** Terminal output showing successful EC2 deploy:
  - `./scripts/deploy_ec2_backend.sh --pull`
  - `docker ps` showing container **Up**
  - `curl http://127.0.0.1/up` returning **200**
- **(B)** Terminal output showing successful CloudFront health:
  - `curl https://<cloudfront-domain>/up` returning **200**
- **(C)** ECR repository page showing image tags/digests (AWS Console screenshot).

## Notes

- Keep secrets out of screenshots. If a command prints secrets, blur or crop.
- If the backend uses background jobs (Solid Queue), include that in the narrative because it impacts file uploads (purge/analyze).

