# Operations & deploy handoff

**Last updated:** April 2026  

Single entry point for **AWS session handoff**, **cost/reminders**, and **deferred work**. Replaces former `pickup.md`, `memory.md`, and `next_week.md`.

| Topic | Where |
|--------|--------|
| Architecture & phases | [DEPLOY_PLAN.md](DEPLOY_PLAN.md) |
| **Demo: local + AWS commands (BE + FE)** | [DEMO.md](DEMO.md) |
| Debugging timeline (root causes H–M) | [root_cause_deployment_lessons.md](root_cause_deployment_lessons.md) |
| Terraform outputs & sync | [infra/README.md](infra/README.md) |
| Prod-like Docker smoke (Mac, before EC2) | [PROD_LOCAL_SMOKE.md](PROD_LOCAL_SMOKE.md) |
| Never commit secrets | [SECURITY_GIT.md](SECURITY_GIT.md) |

**Infra URLs and IDs:** Use values from your AWS console and `terraform output` in `infra/` — do not rely on hostnames or IPs embedded in old notes.

---

## 0) Where we left off (carryover)

**Local backend image:** `docker build` in `backend/` → image **`catalogit-backend:latest`** (when last built).

**Typical next steps when continuing deploy:**

1. Tag + push to **ECR** (your account + repo).
2. On **EC2:** `docker pull` → **`docker rm -f catalogit_backend`** → **`docker run …`** (pull alone is not enough).
3. **Migrate RDS:**  
   `docker exec catalogit_backend ./bin/rails db:migrate RAILS_ENV=production`  
   Ensures Solid Cache / schema (see **Root cause M** in [root_cause_deployment_lessons.md](root_cause_deployment_lessons.md)).
4. **Smoke:** CloudFront **`/up`** and **`/api/v1/lists`**; signup in incognito once.

**Optional before EC2** (same Dockerfile, local Postgres only): [PROD_LOCAL_SMOKE.md](PROD_LOCAL_SMOKE.md) → `./scripts/smoke_prod_local.sh` from repo root.

**Do not set on EC2:** `FORCE_SSL=false` / `ASSUME_SSL=false` — those are only for local prod-smoke compose.

---

## 1) End AWS CLI sessions locally (when pausing AWS work)

```bash
aws sso logout --profile <your-profile> 2>/dev/null || aws sso logout
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_SECURITY_TOKEN AWS_CREDENTIAL_EXPIRATION
rm -rf ~/.aws/cli/cache/* 2>/dev/null
aws configure list
```

Do not delete `~/.aws/credentials` unless you intend to remove static keys.

---

## 2) Production checklist (dual-origin CloudFront)

**Baseline (re-verify after infra changes):**

- Terraform **dual-origin CloudFront**: `/api/*`, `/up`, `/api-docs*`, `/rails/*` → **EC2**; default → **S3** (`infra/main.tf`).
- Frontend build: **`VITE_API_URL=https://<your-cloudfront-domain>/api/v1`** (same hostname as the SPA).
- After Terraform or frontend changes: distribution **Deployed** → **`aws cloudfront create-invalidation --paths "/*"`** → rebuild/sync if needed.

**Ongoing:**

- **EC2 + Docker:** new ECR image → **`docker pull`** then **`docker rm -f catalogit_backend`** + **`docker run …`**.
- **DB:** `docker exec catalogit_backend ./bin/rails db:migrate RAILS_ENV=production`
- **S3 uploads:** `ACTIVE_STORAGE_SERVICE=amazon` + `aws-sdk-s3` in image + S3 env vars; recreate container after `.env` change.
- **`db:seed` on prod:** **destructive** (`destroy_all` at top of `seeds.rb`) — demo DB only.

---

## 3) Cost & idle reminders

- Prefer **minimal-cost** shapes for class/portfolio: small instance classes, single-AZ, minimal storage.
- **Non-zero baseline** is normal while resources exist (EBS, RDS storage, ECR, S3, possible Elastic IP when EC2 is stopped — check Billing).
- **Auto idle shutdown** is not one AWS toggle — use EventBridge/Lambda, schedules, or **calendar reminders** (“stop EC2 + RDS after demo”).
- **End of session:** stop EC2 (if allowed), consider RDS stop, confirm Elastic IP / billing; S3 + CloudFront usually stay up (low cost).

---

## 4) Deferred / nice-to-have

- `ACTIVE_STORAGE_SERVICE=amazon` on EC2 when you want real S3 uploads (image already has `aws-sdk-s3`).
- Rebuild frontend with production **`VITE_API_URL`**, S3 sync, CloudFront invalidation.
- End-to-end attachment validation (note / link / file) on list and item rows.
- AWS Budgets ($1 / $5 / $10), Cost Anomaly Detection, resource tags (`Project=CatalogIt`, etc.).
- Terraform guardrails (micro defaults, avoid accidental multi-AZ in free-first mode).
- CI: `bundle exec rspec` + `docker build` on PRs ([scripts/test-all.sh](scripts/test-all.sh) locally).
- ALB + custom domain + ACM (optional).

---

## 5) Doc index (trimmed)

| File | Purpose |
|------|---------|
| [root_cause_deployment_lessons.md](root_cause_deployment_lessons.md) | Lessons H–M (CloudFront, Docker, curl, seed, Solid Cache) |
| [DEPLOY_PLAN.md](DEPLOY_PLAN.md) | Architecture + phases (commands → DEMO) |
| [DEMO.md](DEMO.md) | Local & AWS start commands, UI/Swagger walkthrough |
| [infra/README.md](infra/README.md) | Terraform + `s3 sync` + invalidation |
| [PROD_LOCAL_SMOKE.md](PROD_LOCAL_SMOKE.md) | Prod-like Docker smoke on Mac |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Feature/status snapshot |
| [WEEKLY_PLAN.md](WEEKLY_PLAN.md) | Short pointer + historical milestones |

When you say **“pickup”**, resume from **§0** above, then **[DEMO.md §2](DEMO.md#2-aws-production-start-backend-and-frontend)** for deploy commands.
