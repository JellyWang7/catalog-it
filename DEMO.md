# CatalogIt — Demo guide

**Last updated:** April 2026  
**Deploy branch:** `deployment`

This file is the **single place** for **how to run** the app for a demo: **local** (two terminals) and **AWS** (EC2 backend + S3/CloudFront frontend). For architecture and Terraform theory, see [DEPLOY_PLAN.md](DEPLOY_PLAN.md). For secrets and what not to commit, see [SECURITY_GIT.md](SECURITY_GIT.md).

---

## Contents

1. [Local development — start backend & frontend](#1-local-development--start-backend--frontend)  
2. [AWS production (start backend and frontend)](#2-aws-production-start-backend-and-frontend)  
3. [DBeaver (database)](#3-dbeaver-database)  
4. [Swagger (API)](#4-swagger-api)  
5. [Tests](#5-tests)  
6. [Frontend production build (local only)](#6-frontend-production-build-local-only)  
7. [UI walkthrough](#7-ui-walkthrough)  
8. [Demo accounts](#8-demo-accounts)  
9. [Features to highlight](#9-features-to-highlight)

---

## 1. Local development — start backend & frontend

Open **two terminals** from the **repository root** (`catalog-it/`, where `backend/` and `frontend/` live).

### Terminal 1 — Backend API

```bash
cd backend
bundle install
rails db:migrate
rails db:seed    # only if DB is empty or you want seed data
bundle exec puma -p 3000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

### Local URLs

| What | URL |
|------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Swagger | http://localhost:3000/api-docs |

---

## 2. AWS production (start backend and frontend)

**Architecture (short):** React **static files** → **S3** + **CloudFront**. Rails **Docker** on **EC2**; CloudFront sends `/api/*`, `/up`, `/api-docs*`, `/rails/*` to EC2. Browser uses **one HTTPS hostname**; set `VITE_API_URL=https://<cloudfront-domain>/api/v1` when building the frontend.

### 2.1 Before you run commands

- Terraform stack applied (`infra/`); EC2, RDS, S3 bucket, CloudFront distribution exist.
- **EC2 and RDS must be running** (schedules may stop them → **504** on API until started).
- **`backend/.env.production`** on the server: real values, **never committed** (see [SECURITY_GIT.md](SECURITY_GIT.md)). Do **not** rely on `RAILS_MASTER_KEY` for this Docker path unless you fully control `credentials.yml.enc`.
- **Repository path on EC2** (typical): `/opt/catalogit/catalog-it`. Your home directory may be empty; use `sudo find / -name "deploy_ec2_backend.sh" 2>/dev/null` if unsure — use the path under **`/opt/.../backend`**, not `/var/lib/docker/overlay2/...`.

### 2.2 CloudFront URL and bucket (your laptop)

Run from **`catalog-it/infra`** (not `~` — `cd` into the cloned repo first):

```bash
cd /path/to/catalog-it/infra
terraform init    # once per machine
terraform output -raw cloudfront_domain_name
terraform output -raw cloudfront_distribution_id
terraform output -raw frontend_bucket_name
```

**App URL:** `https://<cloudfront_domain_name>`  
**Health check:** `https://<cloudfront_domain_name>/up` (Rails, not React — needs dual-origin CloudFront).

### 2.3 Backend on EC2 (full deploy)

There are **two paths**. The **fast path** (recommended) builds on your **laptop** and pulls the image on EC2. The **local build** path compiles everything on EC2 (slow on t3.micro).

#### Fast path: build on laptop, pull on EC2

**Step A — On your laptop** (from `backend/`):

```bash
cd /path/to/catalog-it/backend
export ECR_REPO=<account-id>.dkr.ecr.<region>.amazonaws.com/catalogit-backend
chmod +x scripts/deploy_ecr_push.sh
./scripts/deploy_ecr_push.sh
```

This builds a `linux/amd64` image and pushes it to ECR. Takes ~2 minutes on a modern laptop.

**Step B — SSH into EC2:**

```bash
cd /opt/catalogit/catalog-it
git fetch origin
git checkout deployment
git reset --hard origin/deployment

cd backend
set -a && source .env.production && set +a

export ECR_REPO=<account-id>.dkr.ecr.<region>.amazonaws.com/catalogit-backend
chmod +x scripts/check_prod_env.sh scripts/deploy_ec2_backend.sh
./scripts/deploy_ec2_backend.sh --pull
```

This pulls the pre-built image from ECR (seconds) and starts the container — **no `docker build` on EC2**.

#### Local build path (slower, no ECR needed)

SSH into EC2, then:

```bash
cd /opt/catalogit/catalog-it
git fetch origin
git checkout deployment
git reset --hard origin/deployment

cd backend
set -a && source .env.production && set +a

chmod +x scripts/check_prod_env.sh scripts/deploy_ec2_backend.sh
./scripts/check_prod_env.sh
./scripts/deploy_ec2_backend.sh
```

**Local build on t3.micro can take 10–30 minutes** (native gem compilation). Later builds use Docker cache and are faster when `Gemfile.lock` is unchanged.

#### After the container is up

**Migrations:**

```bash
docker exec catalogit_backend ./bin/rails db:migrate RAILS_ENV=production
```

**Do not run** `db:seed` on production unless you accept **wiping** existing users/lists (seeds start with `destroy_all`).

**Check on EC2:**

```bash
docker ps --filter name=catalogit_backend
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1/up
```

Expect **200** and container status **Up**.

**Git on EC2:** If `git pull` complains about divergent branches, from repo root:

```bash
cd /opt/catalogit/catalog-it
git fetch origin && git checkout deployment && git reset --hard origin/deployment
```

### 2.4 Backend only after EC2 restart (no code change)

```bash
sudo systemctl start docker    # if Docker is not running
docker ps -a --filter name=catalogit_backend
```

- If **Up**: wait ~1–2 minutes, then `curl http://127.0.0.1/up`.
- If **Exited** / missing: run **§2.3** again, or `docker start catalogit_backend` if the image still exists.

### 2.5 Frontend from laptop (build, S3 sync, CloudFront invalidation)

From your **repo root** (`catalog-it/`), adjust the first `cd` to your real path:

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

Wait **2–10 minutes** for invalidation (**InProgress** → **Completed** in the AWS console). Then hard-refresh or use a private window.

You **do not** need the EC2 backend finished before running **`npm run build`**; you **do** need the backend up before the **browser** can log in and load lists.

### 2.6 Verify production

**Laptop:**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "https://<your-cloudfront-domain>/up"
curl -sS "https://<your-cloudfront-domain>/api/v1/lists" | head -c 200
```

Then open **`https://<your-cloudfront-domain>`** in a browser (incognito recommended).

### 2.7 Troubleshooting for AWS

| Symptom | Likely cause |
|---------|----------------|
| **504** on `/api/*` or `/up` | EC2 stopped, container down, or RDS stopped — start instance/DB, check `docker ps` |
| SPA loads, API fails / CORS | Wrong `VITE_API_URL` — rebuild frontend with `https://<same-cloudfront-host>/api/v1` |
| Old UI after deploy | CloudFront cache — run invalidation `/*`, wait, hard refresh |
| New image, old behavior | On EC2: **`docker pull` alone is not enough** — recreate container (deploy script does this) |

More detail: [root_cause_deployment_lessons.md](root_cause_deployment_lessons.md), [OPERATIONS.md](OPERATIONS.md).

### 2.8 Optional systemd auto-start on EC2 boot

```bash
cd /opt/catalogit/catalog-it/backend
chmod +x scripts/install_systemd_service.sh
sudo APP_DIR=/opt/catalogit/catalog-it/backend ./scripts/install_systemd_service.sh
```

---

## 3. DBeaver (database)

Use **local** DB `catalogit_development` (or your RDS endpoint for production — keep credentials private).

### All tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Columns (users, lists, items)

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'lists' ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'items' ORDER BY ordinal_position;
```

### Sample data

```sql
SELECT id, username, email, role, status FROM users ORDER BY id;

SELECT l.id, l.title, l.visibility, u.username AS owner,
       COUNT(i.id) AS items
FROM lists l
JOIN users u ON l.user_id = u.id
LEFT JOIN items i ON i.list_id = l.id
GROUP BY l.id, l.title, l.visibility, u.username
ORDER BY l.id;

SELECT i.name, i.category, i.rating, l.title AS list
FROM items i
JOIN lists l ON i.list_id = l.id
ORDER BY l.id, i.id
LIMIT 15;
```

### 3NF / FK sanity

```sql
SELECT COUNT(*) AS total, COUNT(DISTINCT email) AS unique_emails,
       COUNT(DISTINCT username) AS unique_names FROM users;

SELECT tc.constraint_name, tc.table_name, kcu.column_name,
       ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

## 4. Swagger (API)

**Local:** http://localhost:3000/api-docs  

### Login and authorize

1. **POST /api/v1/auth/login** → Try it out → body:
   ```json
   { "user": { "email": "movies@example.com", "password": "password123" } }
   ```
2. Copy `token` → **Authorize** → `Bearer <token>`.

### Try endpoints

- **GET /api/v1/lists** — public lists JSON.
- **POST /api/v1/lists** — create a list (authenticated).

**Groups to mention:** Auth (8), Lists (10), Items (7), Comments (3), Attachments (5) — **33 endpoints** total.

**Production:** same paths under your CloudFront host if `/api-docs` is routed to EC2 (see Terraform behaviors).

---

## 5. Tests

```bash
cd backend
RAILS_ENV=test bundle exec rspec spec/models spec/requests spec/services
```

```bash
cd frontend
npm run test
npm run test:e2e
```

**Full suite from repo root:** [README.md](README.md) → `./scripts/test-all.sh`.

---

## 6. Frontend production build (local only)

For **local** artifact check (API URL not set for AWS):

```bash
cd frontend
npm run build
```

For **AWS**, use **§2.5** (`VITE_API_URL` required).

---

## 7. UI walkthrough

**Local:** http://localhost:5173 — **AWS:** your CloudFront HTTPS URL.

| Step | Page | What to show |
|------|------|----------------|
| 1 | **Home** `/` | Hero, features, CTA |
| 2 | **Sign up** `/signup` | Validation |
| 3 | **Login** `/login` | `movies@example.com` / `password123` |
| 4 | **Dashboard** `/dashboard` | Stats, search, visibility filter, lists |
| 5 | **New list** | Modal: title, description, public |
| 6 | **List detail** `/lists/:id` | Items, star ratings |
| 7 | **Add item** | Name, category, rating, notes |
| 8 | **Share** | Short URL, clipboard |
| 9 | **Interactions** | List/item likes, comments |
| 9a | **Moderation** | Profanity/slur in comment or item note → 422 |
| 10 | **Attachments** | Note, `https` link, or file (list + item) |
| 11 | **Explore** `/explore` | Grid, search, sort |
| 12 | **Profile** `/profile` | Role, stats, MFA |
| 13 | **MFA** | Enable, TOTP verify |
| 14 | **Forgot password** | Dev: token surfaced in logs/UI as configured |
| 15 | **Mobile** | Narrow width → hamburger |

---

## 8. Demo accounts

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| admin@catalogit.com | password123 | admin | |
| movies@example.com | password123 | user | Movie lists |
| books@example.com | password123 | user | Book lists |
| collector@example.com | password123 | user | Mixed lists |
| banned@example.com | password123 | user | Suspended — login blocked |

*(Seeds required — **local** only unless you intentionally seed prod.)*

---

## 9. Features to highlight

- **JWT** — 24h expiry, bcrypt  
- **Password reset** — token, 1h expiry  
- **Owner authorization** — IDOR prevention  
- **3NF** — Users → Lists → Items, FK constraints  
- **TLS / HSTS** — production  
- **Encryption at rest** — ActiveRecord encryption  
- **MFA** — TOTP  
- **Security** — XSS, rate limits, CORS, error boundary  
- **Share lists** — `/s/:code`  
- **Comments + likes**  
- **Attachments** — note / link / file; **S3** in production with `ACTIVE_STORAGE_SERVICE=amazon`  
- **Content moderation** — strict filtering, 422 responses  
- **Responsive** — mobile nav  
- **Tests** — RSpec + Vitest + Playwright  

---

*For session handoff, cost reminders, and deferred work after a deploy: [OPERATIONS.md](OPERATIONS.md).*
