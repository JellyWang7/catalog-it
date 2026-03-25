# CatalogIt Terraform Infrastructure

**Last updated:** March 21, 2026  

This folder provisions a low-cost AWS stack for CatalogIt:

- S3 bucket for frontend static files
- CloudFront: **S3 (default) + EC2 custom origin** for `/api/*`, `/up`, `/api-docs*`, `/rails/*` (see `main.tf`; lessons in `../root_cause_deployment_lessons.md`)
- EC2 instance for Rails backend
- RDS PostgreSQL database
- EventBridge Scheduler jobs to start/stop EC2 + RDS daily
- AWS Budget (monthly cost alarm)

## 1) Prerequisites

- Terraform >= 1.6
- AWS CLI configured (`aws configure`); when pausing work, see **[OPERATIONS.md](../OPERATIONS.md)** in repo root for logout/cache cleanup
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

Build frontend with the **CloudFront** API base (recommended):

```bash
cd ../frontend
VITE_API_URL="https://$(terraform output -raw cloudfront_domain_name)/api/v1" npm run build
```

(Legacy direct-to-EC2: `VITE_API_URL="http://<ec2-public-ip>/api/v1"` — often blocked as mixed content when the site is served over HTTPS.)

Upload:

```bash
cd ../infra
aws s3 sync ../frontend/dist "s3://$(terraform output -raw frontend_bucket_name)" --delete
```

Invalidate CloudFront:

```bash
aws cloudfront create-invalidation \
  --distribution-id "$(terraform output -raw cloudfront_distribution_id)" \
  --paths "/*"
```

## 5) Deploy Backend on EC2

1. SSH into EC2.
2. Install/start Docker (already done in user data on first boot).
3. Copy project backend code to EC2.
4. Create env file from:
   - `backend/.env.production.example`
5. Export env vars and run:

```bash
cd backend
set -a
source .env.production
set +a
chmod +x scripts/check_prod_env.sh
./scripts/check_prod_env.sh
# optional when not using S3 uploads:
# ./scripts/check_prod_env.sh --skip-s3-check
chmod +x scripts/deploy_ec2_backend.sh
./scripts/deploy_ec2_backend.sh
# optional one-command deploy when not using S3 uploads:
# ./scripts/deploy_ec2_backend.sh --skip-s3-check
```

For auto-start on EC2 boot:

```bash
cd backend
chmod +x scripts/install_systemd_service.sh
sudo APP_DIR=/opt/catalogit/backend ./scripts/install_systemd_service.sh
```

If you use file uploads in production, also set S3 vars in `.env.production`:
- `ACTIVE_STORAGE_SERVICE=amazon`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`

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
