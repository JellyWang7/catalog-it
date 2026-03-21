# Deploy TODO (AWS Path)

**Last updated:** March 21, 2026  

This checklist follows `DEPLOY_PLAN.md` and covers execution scope. **Next-session handoff:** [`pickup.md`](pickup.md). **Lessons:** [`root_cause_deplpyment_lessons.md`](root_cause_deplpyment_lessons.md) (CloudFront dual origin, `docker pull` vs recreate, prod seed warning).

## A) Readiness blockers

### 1) Validate Ruby image/version compatibility on EC2

Goal: confirm EC2 runtime matches app requirements before full deploy.

```bash
# On EC2 host
ruby -v
bundle -v
docker --version

# In backend repo (local)
cd backend
cat .ruby-version
bundle platform
```

Pass criteria:
- Ruby version and platform satisfy `Gemfile`/lockfile expectations
- `bundle install` succeeds in target environment

### 2) Finalize TLS termination strategy (`force_ssl` is enabled)

Pick one and document it:
- CloudFront HTTPS in front of API origin (EC2 reverse proxy)
- ALB + ACM in front of EC2
- EC2 reverse proxy (Nginx/Caddy) handling TLS directly

Must confirm:
- API responds via HTTPS
- no redirect loop
- forwarded proto headers are respected by Rails

## B) Prepare deployment env

```bash
cd backend
cp .env.production.example .env.production
# edit .env.production with real values
set -a
source .env.production
set +a
chmod +x scripts/check_prod_env.sh
./scripts/check_prod_env.sh
# optional when not using S3 uploads:
# ./scripts/check_prod_env.sh --skip-s3-check
```

Required vars to verify:
- `RAILS_ENV=production`
- `SECRET_KEY_BASE`
- `DATABASE_HOST`
- `DATABASE_USERNAME`
- `CATALOGIT_DATABASE_PASSWORD`
- `FRONTEND_URL`
- `RAILS_LOG_LEVEL`
- **`ACTIVE_STORAGE_SERVICE`** — use **`amazon`** in production for real uploads (requires **`aws-sdk-s3`** in image + S3 env vars). Do **not** set `RAILS_MASTER_KEY` unless it matches the key that encrypted `credentials.yml.enc` (this project prefers ENV-only secrets; see `root_cause_deplpyment_lessons.md`).

## C) Deploy backend once to EC2 + DB commands

```bash
cd backend
chmod +x scripts/deploy_ec2_backend.sh
./scripts/deploy_ec2_backend.sh
# optional one-command deploy when not using S3 uploads:
# ./scripts/deploy_ec2_backend.sh --skip-s3-check
```

After container is up, run (on EC2 via Docker):

```bash
docker exec catalogit_backend ./bin/rails db:migrate RAILS_ENV=production
# optional — WARNING: seeds.rb DESTROYS all users/lists/items first; demo DB only
# docker exec catalogit_backend ./bin/rails db:seed RAILS_ENV=production
```

**New image on EC2:** `docker pull` alone is not enough — **`docker rm -f catalogit_backend`** then **`docker run ...`** again so the container uses the new image (see `root_cause_deplpyment_lessons.md`).

## D) Build/upload frontend to S3 + CloudFront

**Requires Terraform dual-origin CloudFront** (see `infra/main.tf`): same hostname for SPA + API.

```bash
cd infra
# use your distribution + bucket from `terraform output`
export CF_DOMAIN="$(terraform output -raw cloudfront_domain_name)"
export CF_ID="$(terraform output -raw cloudfront_distribution_id)"
export BUCKET="$(terraform output -raw frontend_bucket_name)"

cd ../frontend
VITE_API_URL="https://${CF_DOMAIN}/api/v1" npm run build

cd ../infra
aws s3 sync ../frontend/dist "s3://${BUCKET}" --delete
aws cloudfront create-invalidation --distribution-id "${CF_ID}" --paths "/*"
```

**After `terraform apply`** changes to CloudFront: wait until distribution status is **Deployed**, then invalidate `/*`. Rebuild + sync + invalidate again whenever you change `VITE_API_URL` or app code.

**Smoke:** `https://<cloudfront-domain>/up` → Rails health (not React 404). Explore empty → **“No public lists found”** means API works; create a **public** list to populate.

## E) Run validation checklist

- Frontend URL responds over HTTPS
- **`https://<cloudfront-domain>/up`** returns Rails health (not SPA) — requires dual-origin CloudFront
- **`curl` to `http://127.0.0.1/up` only on EC2** (not your Mac) unless testing EC2 public IP from a machine that can reach port 80
- `/api/v1/lists` returns JSON (Explore loads; empty catalog is OK)
- Login/signup/list CRUD flows work
- CORS allows only CloudFront domain
- App behavior after stop window is expected (frontend up, API down)
- **Attachments:** add a **note-only**, **link-only**, and **file** attachment (list + item); file upload should succeed when S3 + `ACTIVE_STORAGE_SERVICE=amazon` are configured

### Troubleshooting: CloudFront 504 on `/api/*` or signup/login failures

If you see **504 Gateway Timeout** or a generic **“Signup failed”** with no server message:

1. **Check EC2 is running** (EventBridge may have stopped it overnight):
   ```bash
   aws ec2 describe-instance-status --region us-east-1 --instance-ids i-0b2c25f255d32b9a1 --include-all-instances
   ```
2. If `stopped`, start it and wait ~1–2 minutes for Docker:
   ```bash
   aws ec2 start-instances --region us-east-1 --instance-ids i-0b2c25f255d32b9a1
   ```
3. Optional: disable stop/start schedules while testing: `terraform apply -var="enable_schedules=false"` in `infra/` (no new AWS services).

## Optional: auto-start backend on instance boot

```bash
cd backend
chmod +x scripts/install_systemd_service.sh
sudo APP_DIR=/opt/catalogit/backend ./scripts/install_systemd_service.sh
```

Deferred work is tracked in `next_week.md` and **`pickup.md`**.
