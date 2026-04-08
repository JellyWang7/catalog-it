# CatalogIt — AWS deployment & smoke tests

**Last updated:** April 7, 2026  
**Default branch:** `main` — use `main` on laptops and EC2 unless your team pins another branch. Align EC2 `git` checkout with the branch you build and deploy from.

Single reference for **production**: Terraform, **backend (ECR + EC2 + DB)**, **frontend (S3 + CloudFront)**, and **verification**. Use placeholders only (`<account-id>`, `<region>`, `<cloudfront-domain>`); never paste secrets, tokens, or private keys into committed docs — see [SECURITY_GIT.md](SECURITY_GIT.md).

**Related:** [DEMO.md](DEMO.md) (local + AWS demo narrative), [OPERATIONS.md](OPERATIONS.md) (cost, handoff), [infra/README.md](infra/README.md) (Terraform), [README.md](README.md) (overview + tests).

---

## 0) Full production release (do all of this for a complete deploy)

For a **full** release, treat these as one flow so **API, database schema, Solid Queue, and SPA** stay in sync. Skip only the parts that truly did not change (see **Partial releases** below).

| Step | What | Why |
|------|------|-----|
| **A. Preflight** | EC2 + RDS **running**; Docker up on EC2; AWS CLI works on your laptop for ECR/S3/CloudFront | Stopped instances → **504**; missing CLI → push/sync fails |
| **B. Tests (recommended)** | From repo root: `./scripts/test-all.sh` (or run backend + frontend test commands in [README.md](README.md)) | Catches regressions before prod |
| **C. Infra (if needed)** | `terraform plan` / `apply` in `infra/` only when resources or outputs change | New buckets, CloudFront IDs, etc. |
| **D. Backend** | Build/push image → EC2 `deploy_ec2_backend.sh --pull` | New Rails code, gems, Dockerfile |
| **E. Database** | Handled automatically: container **entrypoint** and **`deploy_ec2_backend.sh`** run **`db:prepare`** (migrations on primary) + **`db:ensure_solid_queue`** (Solid Queue tables from `db/queue_schema.rb`) | Skipping this is how **`solid_queue_jobs` missing** broke attachments |
| **F. Frontend** | `npm ci` + `npm run build` with **`VITE_API_URL=https://<cloudfront-domain>/api/v1`** → `aws s3 sync` → CloudFront **`create-invalidation /*`** | UI and API base URL must match the live distribution |
| **G. Verify** | Smoke table in [§5](#5-smoke-tests-where-to-go); optional attachment upload/delete on a list | Confirms end-to-end |

**Partial releases**

- **Backend only:** D + E (frontend unchanged).  
- **Frontend only:** F + G (no new image).  
- **DB migration only:** Redeploy backend or run `docker exec catalogit_backend bin/rails db:prepare` and `db:ensure_solid_queue` if the image already includes new migrations.

---

### Copy-paste: full release commands (typical paths)

Replace placeholders. **Laptop** has Docker (for ECR push), Node, Terraform state in `infra/`, and AWS credentials.

**1 — Backend image → ECR**

```bash
cd /path/to/catalog-it/backend
export ECR_REPO=<account-id>.dkr.ecr.<region>.amazonaws.com/catalogit-backend
chmod +x scripts/deploy_ecr_push.sh
./scripts/deploy_ecr_push.sh
```

**2 — EC2: pull image, recreate container, run DB tasks**

```bash
cd /path/to/catalog-it-on-ec2/backend
set -a && source .env.production && set +a
export ECR_REPO=<account-id>.dkr.ecr.<region>.amazonaws.com/catalogit-backend
chmod +x scripts/check_prod_env.sh scripts/deploy_ec2_backend.sh
./scripts/deploy_ec2_backend.sh --pull
```

**3 — Frontend → S3 + CloudFront**

```bash
cd /path/to/catalog-it/infra
export CF_DOMAIN="$(terraform output -raw cloudfront_domain_name)"
export CF_ID="$(terraform output -raw cloudfront_distribution_id)"
export BUCKET="$(terraform output -raw frontend_bucket_name)"

cd ../frontend
npm ci
VITE_API_URL="https://${CF_DOMAIN}/api/v1" npm run build

cd ../infra
aws s3 sync ../frontend/dist "s3://${BUCKET}" --delete
aws cloudfront create-invalidation --distribution-id "${CF_ID}" --paths "/*"
```

**4 — Quick checks**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "https://${CF_DOMAIN}/up"
# On EC2:
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1/up
docker ps --filter name=catalogit_backend
```

---

## Architecture (short)

- **CloudFront** (HTTPS): default `/*` → **S3** (React `dist/`); `/api/*`, `/up`, `/api-docs*`, `/rails/*` → **EC2:80** (Rails over HTTP to origin).
- **`VITE_API_URL`** must be **`https://<cloudfront-domain>/api/v1`** (same browser hostname as the SPA → no mixed content / CORS surprises).

---

## Before anything

0. Prefer the ordered checklist in **[§0](#0-full-production-release-do-all-of-this-for-a-complete-deploy)** so nothing is skipped.
1. **EC2** and **RDS** are **running** (schedules often stop them → **504** until started).
2. On EC2, Docker: `sudo systemctl start docker` if needed.
3. **`backend/.env.production`** on the server (never committed): copy from **`.env.production.example`** and fill values; run **`check_prod_env.sh`** before deploy.

---

## 1) Update code on EC2

Typical clone: **`/opt/catalogit/catalog-it`**.

```bash
cd /opt/catalogit/catalog-it
git fetch origin
git checkout main
git pull origin main
```

You need this so **`scripts/deploy_ec2_backend.sh`** matches Git (e.g. **`docker run`** passes **`AWS_*`**, **`ACTIVE_STORAGE_SERVICE`**, etc., from your sourced env).

---

## 2) Backend: build on laptop → ECR → pull on EC2

**Laptop** (`backend/`):

```bash
cd /path/to/catalog-it/backend
export ECR_REPO=<account-id>.dkr.ecr.<region>.amazonaws.com/catalogit-backend
chmod +x scripts/deploy_ecr_push.sh
./scripts/deploy_ecr_push.sh
```

Build is **`linux/amd64`** — required for normal **x86_64** EC2.

**EC2** (`backend/`):

```bash
cd /opt/catalogit/catalog-it/backend
set -a && source .env.production && set +a
export ECR_REPO=<account-id>.dkr.ecr.<region>.amazonaws.com/catalogit-backend
chmod +x scripts/check_prod_env.sh scripts/deploy_ec2_backend.sh
./scripts/deploy_ec2_backend.sh --pull
```

The script: validates env, **`docker pull`**, recreates **`catalogit_backend`**, then runs **`db:prepare`** and **`db:ensure_solid_queue`** in the container (migrations + Solid Queue tables). The container **entrypoint** also runs these when the server starts, so a fresh boot stays consistent.

**Health on EC2** (must run **on the instance**, not your Mac — `127.0.0.1` is local to each machine):

```bash
docker ps --filter name=catalogit_backend
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1/up
```

Expect **Up** and **200**.

---

## 3) Production image: Puma (not Thruster)

The **Dockerfile** starts **`./bin/rails server -b 0.0.0.0`** with **`PORT=80`**. An older **`./bin/thrust`** path could fail with **`Gem::GemNotFoundException`** for **thruster** in some images; Puma is the supported server in container.

---

## 4) Frontend: build → S3 → invalidate CloudFront

From **`catalog-it/infra`** get outputs; then build with the **CloudFront** host:

```bash
cd /path/to/catalog-it/infra
export CF_DOMAIN="$(terraform output -raw cloudfront_domain_name)"
export CF_ID="$(terraform output -raw cloudfront_distribution_id)"
export BUCKET="$(terraform output -raw frontend_bucket_name)"

cd ../frontend
npm ci
VITE_API_URL="https://${CF_DOMAIN}/api/v1" npm run build

cd ../infra
aws s3 sync ../frontend/dist "s3://${BUCKET}" --delete
aws cloudfront create-invalidation --distribution-id "${CF_ID}" --paths "/*"
```

Wait a few minutes for invalidation, then hard-refresh or use a private window.

Redeploy the frontend when UI or **`VITE_API_URL`** changes — not required for every backend-only deploy.

---

## 5) Smoke tests (where to go)

| Check | Where | Expect |
|--------|--------|--------|
| Rails health | **`https://<cloudfront-domain>/up`** | **200**, body OK |
| API (unauth lists) | **`https://<cloudfront-domain>/api/v1/lists`** | JSON (may be `[]`) |
| App | **`https://<cloudfront-domain>`** | SPA loads; sign up / log in in **incognito** |

**Laptop quick curls** (replace domain):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "https://<cloudfront-domain>/up"
curl -sS "https://<cloudfront-domain>/api/v1/lists" | head -c 200
```

---

## 6) Troubleshooting (April 2026)

| Symptom | Likely cause |
|---------|----------------|
| **`curl` 000** to `127.0.0.1/up` on **Mac** | Normal — API runs on **EC2**, not your laptop. SSH to EC2 and curl there, or use CloudFront URL. |
| **`Restarting (1)`** / nothing on port 80 | **`docker logs --tail=100 catalogit_backend`**. Fixed historically: missing **`thruster`** gem → use current **Dockerfile** (Puma); missing **AWS env in container** → latest **`deploy_ec2_backend.sh`** + **`git pull`** on EC2. |
| **504** on `/api/*`, `/up` | EC2 stopped, container down, or **RDS stopped**. |
| SPA OK, API fails | Wrong **`VITE_API_URL`** — rebuild frontend with **`https://<same-cloudfront-host>/api/v1`**. |
| Old UI after deploy | CloudFront cache — **`create-invalidation --paths "/*"`**, wait, hard refresh. |
| **`docker pull` only** | Not enough — recreate container; **`deploy_ec2_backend.sh --pull`** does that. |
| **Attachment upload → 500** | Often the SPA sent **`FormData`** while Axios default **`Content-Type: application/json`** caused the body to be JSON-mangled. Fixed in **`postFormData`** (`frontend/src/services/api.js`); **rebuild + S3 sync** the frontend. |
| **Attachment upload/delete → 500**, logs show **`solid_queue_jobs` does not exist** | **Solid Queue** tables were never loaded: **`db:prepare`** only runs **`db/migrate`**, while queue tables live in **`db/queue_schema.rb`**. **Fix now:** `docker exec catalogit_backend bin/rails db:ensure_solid_queue` (or redeploy backend so **`docker-entrypoint`** runs that task after **`db:prepare`**). Ensure **`SOLID_QUEUE_IN_PUMA`** is set so Puma runs the queue worker. |

**Do not run** `db:seed` on production unless you accept **data wipe** (seeds use **`destroy_all`**).

---

## 7) Optional: prod-like Docker on Mac

Same **`backend/Dockerfile`**, local Postgres via compose (does not use RDS). From repo root:

```bash
./scripts/smoke_prod_local.sh
```

See **`docker-compose.prod-local.yml`**. Do not set **`FORCE_SSL=false`** on real EC2.

---

## 8) Terraform

Provision / outputs: **[infra/README.md](infra/README.md)** (`terraform init`, `apply`, outputs for bucket, CloudFront ID, domain).
