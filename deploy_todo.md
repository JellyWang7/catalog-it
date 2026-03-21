# Deploy TODO (AWS Path)

**Last updated:** March 20, 2026  

This checklist follows `DEPLOY_PLAN.md` and covers execution scope. **Next-session handoff:** [`pickup.md`](pickup.md).

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

After container is up, run:

```bash
rails db:prepare
rails db:migrate
# optional
# rails db:seed
```

## D) Build/upload frontend to S3 + CloudFront

```bash
cd frontend
VITE_API_URL="https://<api-domain-or-ec2-endpoint>/api/v1" npm run build
```

Then:
- upload `frontend/dist/` to S3 bucket
- invalidate CloudFront cache

## E) Run validation checklist

- Frontend URL responds over HTTPS
- API `/up` is reachable during active window
- `/api/v1/lists` responds correctly
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
