# Deploy TODO

## Backend deploy commands (EC2)

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
chmod +x scripts/deploy_ec2_backend.sh
./scripts/deploy_ec2_backend.sh
# optional one-command deploy when not using S3 uploads:
# ./scripts/deploy_ec2_backend.sh --skip-s3-check
```

## Optional: auto-start backend on instance boot

```bash
cd backend
chmod +x scripts/install_systemd_service.sh
sudo APP_DIR=/opt/catalogit/backend ./scripts/install_systemd_service.sh
```
