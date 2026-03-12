# CatalogIt Terraform Infrastructure

This folder provisions a low-cost AWS stack for CatalogIt:

- S3 bucket for frontend static files
- CloudFront distribution for CDN + HTTPS
- EC2 instance for Rails backend
- RDS PostgreSQL database
- EventBridge Scheduler jobs to start/stop EC2 + RDS daily
- AWS Budget (monthly cost alarm)

## 1) Prerequisites

- Terraform >= 1.6
- AWS CLI configured (`aws configure`)
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

## 4) Deploy Frontend to S3

Build frontend with the backend API URL:

```bash
cd ../frontend
VITE_API_URL="http://<ec2-public-ip>/api/v1" npm run build
```

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
