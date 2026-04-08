# CatalogIt Terraform Infrastructure

**Last updated:** April 7, 2026  

This folder provisions a low-cost AWS stack for CatalogIt:

- S3 bucket for frontend static files
- CloudFront: **S3 (default) + EC2 custom origin** for `/api/*`, `/up`, `/api-docs*`, `/rails/*` (see `main.tf`; deploy/smoke: **[DEPLOY.md](../DEPLOY.md)**)
- EC2 instance for Rails backend
- RDS PostgreSQL database
- EventBridge Scheduler jobs to start/stop EC2 + RDS daily
- AWS Budget (monthly cost alarm)

## 1) Prerequisites

- Terraform >= 1.6
- AWS CLI configured (`aws configure`); when pausing work, see **[OPERATIONS.md](../OPERATIONS.md)**; **deploy + smoke:** **[DEPLOY.md](../DEPLOY.md)** (full demo narrative: [DEMO.md](../DEMO.md#2-aws-production-start-backend-and-frontend))
- IAM permissions for EC2, RDS, S3, CloudFront, IAM, Scheduler, Budgets

## 2) Configure Variables

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
- `db_password` (required)
- `budget_alert_email` (recommended)
- `ssh_allowed_cidr` (set to your IP/CIDR)
- schedule vars (if you want different daily window)

## 3) Provision Infrastructure

```bash
terraform init
terraform plan
terraform apply
```

Collect outputs:

```bash
terraform output
```

### CloudFront → EC2 API (same domain)

The distribution has **two origins**:

- **S3** — default behavior: static React app (`/*` except below).
- **EC2** — path patterns: `/api/*`, `/up`, `/api-docs*`, `/rails/*` (HTTP to instance port `api_port`, viewer uses HTTPS).

Build the frontend with the **CloudFront** URL so the browser calls the API on the same host (no mixed content):

```bash
# After terraform output cloudfront_domain_name is available:
VITE_API_URL="https://$(terraform output -raw cloudfront_domain_name)/api/v1"
```

If `terraform apply` fails because EC2 has no `public_dns` (instance stopped), set in `terraform.tfvars`:

```hcl
cloudfront_api_origin_domain = "ec2-1-2-3-4.compute-1.amazonaws.com"
```

(use your instance’s public DNS from the EC2 console)

**Deploy note:** CloudFront updates can take **10–20 minutes**. After `apply`, invalidate `/*` once before testing.

**SPA errors:** Only **403** from S3 is mapped to `index.html` (OAC missing object). **404** is not rewritten globally so Rails can return real **404 JSON** for `/api/*`.

## 4) Deploy Frontend to S3

**Frontend build + S3 + invalidation:** **[DEPLOY.md](../DEPLOY.md)** (section 4 — Frontend; same flow in [DEMO.md §2.5](../DEMO.md#25-frontend-from-laptop-build-s3-sync-cloudfront-invalidation)).

Minimal one-liners from **`infra/`** (after `terraform output` works):

```bash
cd ../frontend
VITE_API_URL="https://$(terraform output -raw cloudfront_domain_name)/api/v1" npm run build
cd ../infra
aws s3 sync ../frontend/dist "s3://$(terraform output -raw frontend_bucket_name)" --delete
aws cloudfront create-invalidation --distribution-id "$(terraform output -raw cloudfront_distribution_id)" --paths "/*"
```

(Legacy direct-to-EC2 API URL over HTTP breaks **HTTPS** SPAs — use CloudFront same-origin API.)

## 5) Deploy Backend on EC2

**Backend ECR + EC2:** **[DEPLOY.md](../DEPLOY.md)** (section 2 — Backend; also [DEMO.md §2.3–2.4](../DEMO.md#23-backend-on-ec2-full-deploy)).

Summary: SSH → `cd` repo → `git checkout main` → `cd backend` → `source .env.production` → `./scripts/deploy_ec2_backend.sh --pull`. The script runs **`db:prepare`** and **`db:ensure_solid_queue`** in the container (migrations + Solid Queue schema). Details: **[DEPLOY.md](../DEPLOY.md)** (§0 full release, §2 backend).

Optional **systemd** auto-start (adjust `APP_DIR` to your clone):

```bash
cd /opt/catalogit/catalog-it/backend
chmod +x scripts/install_systemd_service.sh
sudo APP_DIR=/opt/catalogit/catalog-it/backend ./scripts/install_systemd_service.sh
```

If you use file uploads in production, configure Active Storage against S3 using the variables listed in **`backend/.env.production.example`** (set values only in **`backend/.env.production`** on the server — never commit that file).

## 6) Schedule Behavior

Default schedule window:
- Start: 18:00 local timezone
- Stop: 20:00 local timezone

Configured via:
- `schedule_timezone`
- `daily_start_cron`
- `daily_stop_cron`

Disable schedules anytime:

```bash
terraform apply -var="enable_schedules=false"
```

## 7) Destroy

```bash
terraform destroy
```

## Notes

- RDS can be stopped for up to 7 days. Daily stop/start is supported.
- If EC2/RDS are stopped, frontend still loads from CloudFront but API features will be unavailable.
- Free tier is not guaranteed forever and depends on account age/region/usage.
