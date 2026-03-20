# Root Cause Deployment Lessons (AWS)

Date: 2026-03-20  
Scope: CatalogIt AWS deployment debugging and recovery

## 1) End-to-end summary of what we did

1. Ran full local test gates and verified backend/frontend test health.
2. Standardized docs to commit to AWS path (`DEPLOY_PLAN.md`) and moved deferred tasks to `next_week.md`.
3. Provisioned AWS infrastructure with Terraform (EC2, RDS, S3, CloudFront, scheduler/budget resources).
4. Prepared production environment variables in `backend/.env.production`.
5. Attempted direct EC2 build/deploy; observed repeated startup and connectivity failures.
6. Switched to a more stable flow:
   - build image locally on Mac
   - push to ECR
   - pull/run on EC2
7. Diagnosed container restart loop from runtime logs and fixed backend JWT secret lookup order to avoid forcing credentials decryption first.

## 2) Local file updates made

- `backend/app/services/json_web_token.rb`
  - Changed secret key resolution order:
    - from: `Rails.application.credentials.secret_key_base || Rails.application.secret_key_base`
    - to: `Rails.application.secret_key_base || Rails.application.credentials.secret_key_base`
  - Why: prevent boot-time crash when encrypted credentials cannot be decrypted in EC2 runtime.

- Deployment/doc alignment updates were already made earlier:
  - `README.md`
  - `PROJECT_STATUS.md`
  - `WEEKLY_PLAN.md`
  - `deploy_todo.md`
  - `next_week.md`

## 3) Helpful commands that worked

Only commands that helped or unblocked deployment are listed below.

### AWS CLI / Terraform

```bash
aws configure set region us-east-1
aws sts get-caller-identity

cd infra
terraform init
terraform plan
terraform apply
terraform output
```

### Backend env validation

```bash
cd backend
chmod +x scripts/check_prod_env.sh scripts/deploy_ec2_backend.sh
set -a
source .env.production
set +a
./scripts/check_prod_env.sh
```

### Local Docker + ECR (stable path)

```bash
cd backend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 106641707917.dkr.ecr.us-east-1.amazonaws.com
docker buildx create --use --name catalogitbuilder 2>/dev/null || true
docker buildx build --platform linux/amd64 -t 106641707917.dkr.ecr.us-east-1.amazonaws.com/catalogit-backend:latest --push .
aws ecr list-images --region us-east-1 --repository-name catalogit-backend --output json
```

### EC2 runtime (after role/policy fixes)

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 106641707917.dkr.ecr.us-east-1.amazonaws.com
docker pull 106641707917.dkr.ecr.us-east-1.amazonaws.com/catalogit-backend:latest

cd /opt/catalogit/catalog-it/backend
set -a
source .env.production
set +a

docker rm -f catalogit_backend 2>/dev/null || true
docker run -d --name catalogit_backend --restart unless-stopped -p 80:80 \
  -e RAILS_ENV -e RAILS_MASTER_KEY -e SECRET_KEY_BASE -e FRONTEND_URL \
  -e DATABASE_HOST -e DATABASE_PORT -e DATABASE_NAME -e DATABASE_USERNAME \
  -e CATALOGIT_DATABASE_PASSWORD -e RAILS_MAX_THREADS -e WEB_CONCURRENCY \
  -e RAILS_LOG_LEVEL \
  106641707917.dkr.ecr.us-east-1.amazonaws.com/catalogit-backend:latest

docker ps --filter "name=catalogit_backend"
docker logs --tail=120 catalogit_backend
```

### Connectivity diagnostics that gave clear signal

```bash
ssh -vvv -o ConnectTimeout=10 -o ConnectionAttempts=1 ec2-user@<public-ip>
aws ec2 describe-instance-status --region us-east-1 --instance-ids i-0b2c25f255d32b9a1 --include-all-instances
aws ec2 get-console-output --region us-east-1 --instance-id i-0b2c25f255d32b9a1 --latest --output text | tail -n 200
```

## 4) Debug session layout: root causes and actions

### Root cause A: Branch protection / push workflow conflicts
- Symptom: direct push rejected, branch creation blocked, non-fast-forward and merge policy conflicts.
- Action taken: pushed via allowed PR branch when rules were adjusted; used protected branch compliant workflow.
- Outcome: resolved for PR path.

### Root cause B: Terraform SG duplicate ingress rule
- Symptom: `The same permission must not appear multiple times` on `aws_security_group.ec2_api`.
- Cause: explicit HTTP 80 ingress plus custom API port also set to 80.
- Action taken: made custom ingress conditional when `api_port` is not 80/443.
- Outcome: Terraform apply succeeded.

### Root cause C: EC2 access instability (IP and auth assumptions)
- Symptom: SSH hangs/timeouts, banner exchange timeout, then connect timeout after stop/start.
- Cause: public IP changed after stop/start; local SSH had no matching private key.
- Action taken: switched to EC2 Instance Connect/SSM path; diagnosed with `ssh -vvv` and instance status APIs.
- Outcome: access path clarified and restored.

### Root cause D: Missing IAM permissions on EC2 role
- Symptom: `AccessDeniedException` for `ecr:GetAuthorizationToken`.
- Cause: `EC2SSMRole` lacked ECR read/login permissions.
- Action taken: attached `AmazonEC2ContainerRegistryReadOnly` (and S3 runtime permissions as needed).
- Outcome: ECR login/pull succeeded on EC2.

### Root cause E: Container restart loop
- Symptom: `catalogit_backend` constantly restarting; `/up` unreachable.
- Runtime error:
  - first: `ArgumentError: key must be 16 bytes`
  - then: `ActiveSupport::MessageEncryptor::InvalidMessage`
- Causes:
  1. invalid `RAILS_MASTER_KEY` length/format (64 hex chars instead of expected 32 hex chars for credentials key),
  2. boot path tried decrypting credentials first.
- Action taken: updated JWT secret resolution order to prefer `Rails.application.secret_key_base` first, then rebuild/push/pull image.
- Outcome: boot path no longer hard-fails on credentials-first access.

## 5) Lessons learned

1. **Do not stop/start EC2 without Elastic IP** if scripts depend on a fixed public IP.
2. **Treat IAM role permissions as first-class deployment dependencies** (ECR + S3 + SSM).
3. **On small instances, avoid heavy local build-on-host flows**; build locally and push to ECR.
4. **Always validate env values semantically, not just presence**:
   - `RAILS_MASTER_KEY` must be correct key material, not just non-empty.
5. **Use runtime logs first, assumptions later**:
   - SSH debug output and container logs were decisive and prevented blind changes.
6. **Keep deployment runbook command-driven and minimal**:
   - reduce context switching and repeated partial retries.

## Current state and next actions

- Infra exists and outputs are available.
- ECR image push/pull flow works.
- EC2 can run container from ECR.
- Remaining:
  1. verify container stays healthy (`docker ps`, `curl /up`),
  2. run `docker exec catalogit_backend ./bin/rails db:prepare`,
  3. deploy frontend build to S3,
  4. invalidate CloudFront,
  5. run end-to-end validation checklist from `deploy_todo.md`.
