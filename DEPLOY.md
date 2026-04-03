# CatalogIt — AWS deployment & smoke tests

**Last updated:** April 3, 2026  
**Deploy branch:** `deployment`

Single reference for **what worked in production**: Terraform layout, **backend image (ECR + EC2)**, **frontend (S3 + CloudFront)**, and **smoke checks**. Do not commit real account IDs or secrets here; use placeholders.

**Related:** [DEMO.md](DEMO.md) (full demo + local dev), [OPERATIONS.md](OPERATIONS.md) (cost, handoff, deferred items), [infra/README.md](infra/README.md) (Terraform apply), [SECURITY_GIT.md](SECURITY_GIT.md).

---

## Architecture (short)

- **CloudFront** (HTTPS): default `/*` → **S3** (React `dist/`); `/api/*`, `/up`, `/api-docs*`, `/rails/*` → **EC2:80** (Rails over HTTP to origin).
- **`VITE_API_URL`** must be **`https://<cloudfront-domain>/api/v1`** (same browser hostname as the SPA → no mixed content / CORS surprises).

---

## Before anything

1. **EC2** and **RDS** are **running** (schedules often stop them → **504** until started).
2. On EC2, Docker: `sudo systemctl start docker` if needed.
3. **`backend/.env.production`** on the server (never committed) with DB, `SECRET_KEY_BASE`, `FRONTEND_URL`, S3 vars as used by `check_prod_env.sh`.

---

## 1) Update code on EC2

Typical clone: **`/opt/catalogit/catalog-it`**.

```bash
cd /opt/catalogit/catalog-it
git fetch origin
git checkout deployment
git pull origin deployment
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

The script: validates env, **`docker pull`**, recreates **`catalogit_backend`**, runs **`db:prepare`** in the container.

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
