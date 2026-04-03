# Root Cause Deployment Lessons (AWS)

Date: 2026-03-20 (lessons updated 2026-03-24)  
Scope: CatalogIt AWS deployment — debugging, CloudFront/API routing, Docker, attachments, prod smoke tests

## 1) End-to-end summary of what we did

1. Ran full local test gates and verified backend/frontend test health.
2. Standardized docs to commit to AWS path (`DEPLOY_PLAN.md`); ongoing handoff/defer lists live in [OPERATIONS.md](OPERATIONS.md).
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
  - [DEMO.md](DEMO.md) (deploy commands)
  - [OPERATIONS.md](OPERATIONS.md)

## 3) Helpful commands that worked

Only commands that helped or unblocked deployment are listed below.

### AWS CLI / Terraform

```bash
aws configure set region <your-region>
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
# Replace <account-id>, <region>, <repo> with values from your AWS account / `terraform output` / ECR console.
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker buildx create --use --name catalogitbuilder 2>/dev/null || true
docker buildx build --platform linux/amd64 -t <account-id>.dkr.ecr.<region>.amazonaws.com/<repo>:latest --push .
aws ecr list-images --region <region> --repository-name <repo> --output json
```

### EC2 runtime (after role/policy fixes)

```bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker pull <account-id>.dkr.ecr.<region>.amazonaws.com/<repo>:latest

cd /opt/catalogit/catalog-it/backend
set -a
source .env.production
set +a
unset RAILS_MASTER_KEY

docker rm -f catalogit_backend 2>/dev/null || true
docker run -d --name catalogit_backend --restart unless-stopped -p 80:80 \
  --entrypoint /bin/sh \
  -e RAILS_ENV=production -e SECRET_KEY_BASE -e FRONTEND_URL \
  -e DATABASE_HOST -e DATABASE_PORT -e DATABASE_NAME -e DATABASE_USERNAME \
  -e CATALOGIT_DATABASE_PASSWORD -e RAILS_MAX_THREADS -e WEB_CONCURRENCY \
  -e RAILS_LOG_LEVEL -e ACTIVE_STORAGE_SERVICE -e AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY -e AWS_REGION -e AWS_S3_BUCKET \
  <account-id>.dkr.ecr.<region>.amazonaws.com/<repo>:latest \
  -c "rm -f /rails/config/credentials.yml.enc && exec /rails/bin/docker-entrypoint ./bin/thrust ./bin/rails server"

sleep 5
docker ps --filter "name=catalogit_backend"
docker logs --tail=120 catalogit_backend
```

### Connectivity diagnostics that gave clear signal

```bash
ssh -vvv -o ConnectTimeout=10 -o ConnectionAttempts=1 ec2-user@<public-ip>
aws ec2 describe-instance-status --region <your-region> --instance-ids <your-instance-id> --include-all-instances
aws ec2 get-console-output --region <your-region> --instance-id <your-instance-id> --latest --output text | tail -n 200
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

### Root cause E: Container restart loop (REAL root cause)
- Symptom: `catalogit_backend` constantly restarting; `/up` unreachable.
- Runtime error:
  - first: `ArgumentError: key must be 16 bytes`
  - then: `ActiveSupport::MessageEncryptor::InvalidMessage`
- **Actual cause**: `config/credentials.yml.enc` is baked into the Docker image (not in `.dockerignore`). When `RAILS_MASTER_KEY` is passed to the container, Rails tries to decrypt this file at boot — but the key doesn't match because the original `config/master.key` was gitignored and never committed. **No generated key can work** — it must be the exact key that originally encrypted the file.
- Why the `json_web_token.rb` fix was insufficient: that fix only changed one application-level fallback. The crash happens at the **Rails framework level** during `db:load_config` → `Rails.application.initialize!`, before any app code runs.
- **Correct fix**:
  1. Remove `RAILS_MASTER_KEY` from `.env.production` (nothing in this app uses encrypted credentials — all config is ENV-based).
  2. Remove `-e RAILS_MASTER_KEY` from the `docker run` command.
  3. Delete the orphaned `credentials.yml.enc` inside the running container (avoids any accidental credential decryption attempt).
  4. Long-term: add `config/credentials.yml.enc` to `.dockerignore` and delete it from the repo.
- Outcome: Rails boots without attempting credential decryption; all secrets flow through explicit ENV vars.

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

### Root cause F: Missing S3 adapter for Active Storage
- Symptom: container crash with `Missing service adapter for "S3" (RuntimeError)` during eager loading — or uploads fail if storage is local disk in Docker.
- Cause: `ACTIVE_STORAGE_SERVICE=amazon` requires the **`aws-sdk-s3`** gem (and valid S3 env vars).
- **Short-term workaround used:** `ACTIVE_STORAGE_SERVICE=local` so the API boots without the gem.
- **Codebase fix:** `gem "aws-sdk-s3"` added to `Gemfile`; rebuild image and set **`ACTIVE_STORAGE_SERVICE=amazon`** for durable production uploads.
- Outcome after switch: file/image attachments persist in S3; see [DEPLOY_PLAN.md](DEPLOY_PLAN.md) and [OPERATIONS.md](OPERATIONS.md) for deploy checklist.

### Root cause G: CloudFront 504 + “Signup failed” when EC2 is stopped
- Symptom: `504 Gateway Timeout` from CloudFront (often HTTP/3); signup shows generic “Signup failed. Please try again.”
- Cause: **EventBridge schedules stop the EC2 instance** (cost-saving). CloudFront `/api/*` origin is the EC2 Elastic IP — when the instance is **stopped**, the origin is unreachable → **504**. The browser gets no JSON body → axios surfaces a generic error.
- Fix: **Start EC2** (`aws ec2 start-instances --region <your-region> --instance-ids <your-instance-id>`) and wait ~1–2 minutes for Docker. Optional: `terraform apply -var="enable_schedules=false"` to disable stop/start schedules while testing (no new resources; may reduce savings).
- Verify: with **dual-origin CloudFront** (below): `curl -I https://<your-cloudfront-domain>/up` → **200** when EC2 is up; when EC2 is **stopped**, **504** on `/api/*` and `/up`. `POST https://<your-cloudfront-domain>/api/v1/auth/signup` → 201 when origin healthy.

### Root cause H: CloudFront had only S3 origin — `/api/*` and `/up` never reached Rails
- Symptom: **“Failed to load list”** on Explore; **`https://…cloudfront.net/up`** showed the **React “Oops”** 404 page, not Rails health.
- Cause: Default behavior sent **all** paths to **S3**. Requests to `/api/v1/...` returned HTML (SPA / error page); Axios expected JSON. `/up` had no S3 object → 403/404 handling → **index.html** → React Router 404.
- Fix (Terraform in `infra/main.tf`): second **custom origin** (EC2 HTTP `:80`), **ordered cache behaviors** for `/api/*`, `/up`, `/api-docs*`, `/rails/*` → EC2; default behavior stays **S3**. Removed **global** `404 → index.html` custom error so API can return real **404 JSON** (kept **403 → index.html** for SPA + OAC).
- Frontend: **`VITE_API_URL=https://<cloudfront-domain>/api/v1`** (same host, HTTPS, no mixed content).
- After `terraform apply`: wait for distribution **Deployed**, then **`aws cloudfront create-invalidation --paths "/*"`**, rebuild frontend, **`aws s3 sync dist`**, invalidate again.

### Root cause I: `docker pull` without recreating the container
- Symptom: Pulled new `:latest` from ECR but logs still showed **old** errors (e.g. `SyntaxError` in `attachment.rb`).
- Cause: **`docker pull` updates the local image tag; the running container still uses the old image ID** until removed and recreated.
- Fix: `docker rm -f catalogit_backend` then full **`docker run ...`** (after `source .env.production`, `unset RAILS_MASTER_KEY`).

### Root cause J: Ruby syntax — `rescue` after `if` without `begin`/`end`
- Symptom: Rails boot **SyntaxError** in `app/models/attachment.rb` (`unexpected 'rescue'`).
- Cause: In Ruby you cannot write `if cond … rescue E … end`; **`rescue` must be inside `begin`/`end`** (or on the method).
- Fix: wrap `URI.parse` / title assignment in **`begin … rescue URI::InvalidURIError … end`** inside the `if`.

### Root cause K: Health check from the wrong machine / wrong expectation
- Symptom: `curl http://127.0.0.1/up` → **connection refused** on port 80.
- Cause: Command run on **Mac** (`127.0.0.1` = laptop). The container runs on **EC2**; host port **80** maps to Thruster in the container, not to the dev machine.
- Fix: On **EC2**: `curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1/up`. From laptop: **`https://<cloudfront>/up`** (with dual origin) or **`http://<EC2-public-ip>/up`** if SG allows.

### Root cause L: Production `db:seed` wipes the database
- Symptom: N/A until run — **destructive**.
- Cause: `db/seeds.rb` starts with **`User.destroy_all` / `List.destroy_all` / `Item.destroy_all`** then recreates demo data.
- Fix: **Do not** run `rails db:seed` on production if you need existing data. Safe only for **empty demo** RDS. Prefer creating public lists via UI or a **non-destructive** seed script.

### Root cause M: Signup (or API writes) return **500** — missing **`solid_cache_entries`**
- Symptom: **`Internal Server Error`** on **`POST /api/v1/auth/signup`** (e.g. incognito); other throttled API traffic can fail similarly.
- Cause: Production uses **`config.cache_store = :solid_cache_store`** and **Rack::Attack** uses **`Rails.cache`** for throttles. The Solid Cache table lives in **`db/cache_schema.rb`**, which is **not** applied by a normal **`db:migrate`** on the primary DB only — so **`solid_cache_entries`** never exists → **`PG::UndefinedTable`** during throttle/cache writes.
- Fix: Run migrations after deploying **`20260322120000_create_solid_cache_entries`** (adds the table to the primary DB, same RDS as `cache:` in `database.yml`). On EC2: **`docker exec catalogit_backend ./bin/rails db:migrate RAILS_ENV=production`**. If you use **`SOLID_QUEUE_IN_PUMA`** or **Solid Cable** in production, ensure **`queue_schema.rb` / `cable_schema.rb`** tables exist too (separate load or install tasks), or jobs/WebSockets can fail later.

## Current state (snapshot — use your own infra values)

- **Elastic IP / EC2 DNS**: from `terraform output` or EC2 console (CloudFront custom origin should point at your stable API endpoint).
- **HTTPS API (same domain as frontend)**: `https://<your-cloudfront-domain>/api/v1/...`
- **Frontend**: same CloudFront URL; build with `VITE_API_URL=https://<your-cloudfront-domain>/api/v1`
- **Remember**: If EC2 is **stopped**, expect **504** on API routes until you start it again.
- **Attachments UX/API**: List and item attachments support optional **text note**, **https link**, or **file** (single form; not two parallel required flows). Kinds include `note` | `link` | `image` | `file`.
- **Production uploads**: Prefer **`ACTIVE_STORAGE_SERVICE=amazon`** + **`aws-sdk-s3`** in the image; run **`rails db:migrate`** for attachment schema updates.

## Long-term cleanup

- Delete `config/credentials.yml.enc` from the repo (it's encrypted with a lost key).
- Add `config/credentials.yml.enc` to `.dockerignore` (done locally).
- Keep **`aws-sdk-s3`** in the Gemfile and use **`ACTIVE_STORAGE_SERVICE=amazon`** in production for real file hosting.
- Rebuild and push a clean image that doesn't contain the orphaned credentials file.

## Next session

- **Commands:** [DEMO.md §2](DEMO.md#2-aws-production-start-backend-and-frontend) (backend + frontend deploy). **Handoff / cost:** [OPERATIONS.md](OPERATIONS.md).
- **Terraform output** (example): `cloudfront_distribution_id`, `cloudfront_api_origin_domain`, `frontend_bucket_name` — use in invalidation + `s3 sync` commands ([infra/README.md](infra/README.md)).
