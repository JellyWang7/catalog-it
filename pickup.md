# Pickup — Next session (week of Mar 24, 2026)

Handoff for CatalogIt AWS. **Lessons log:** [`root_cause_deplpyment_lessons.md`](root_cause_deplpyment_lessons.md) (Mar 21: CloudFront dual origin, Docker recreate, `curl` host, prod seed, Attachment syntax, **Root cause M — Solid Cache / signup 500**).

## 0) Where we left off (Mar 21, 2026) — clean pickup

**Local backend image:** `docker build` in `backend/` completed successfully → image tagged **`catalogit-backend:latest`** on your machine.

**Not done yet (do these first next session):**

1. **Tag + push** to your ECR repo (use your account ID + repo name from prior deploys).
2. On **EC2:** `docker pull` → **`docker rm -f catalogit_backend`** → **`docker run …`** (same env as before — pull alone is not enough).
3. **Migrate RDS** (required for this image):  
   `docker exec catalogit_backend ./bin/rails db:migrate RAILS_ENV=production`  
   This applies **`20260322120000_create_solid_cache_entries`** — fixes **signup / Rack::Attack** **`Internal Server Error`** when `solid_cache_entries` was missing (**[Root cause M](root_cause_deplpyment_lessons.md)**).
4. **Smoke:** `curl` CloudFront **`/up`** and **`/api/v1/lists`**; **signup in incognito** once.

**Optional before EC2 (same Dockerfile, local Postgres only):** [`PROD_LOCAL_SMOKE.md`](PROD_LOCAL_SMOKE.md) → `./scripts/smoke_prod_local.sh` from repo root.

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

## 2) Production checklist (current architecture)

**Done in baseline deploy (verify if you changed infra):**

- Terraform **dual-origin CloudFront**: `/api/*`, `/up`, `/api-docs*`, `/rails/*` → **EC2**; default → **S3** (`infra/main.tf`).
- Frontend build: **`VITE_API_URL=https://d2cvnbu2jarn1q.cloudfront.net/api/v1`** (same as your CloudFront domain).
- After Terraform or frontend changes: distribution **Deployed** → **`aws cloudfront create-invalidation --paths "/*"`** → rebuild/sync if needed.

**Ongoing:**

- **EC2 + Docker:** new ECR image → **`docker pull`** then **`docker rm -f catalogit_backend`** + **`docker run …`** (pull alone does not update the running container).
- **DB:** `docker exec catalogit_backend ./bin/rails db:migrate RAILS_ENV=production`
- **S3 uploads:** `ACTIVE_STORAGE_SERVICE=amazon` + `aws-sdk-s3` in image + S3 env vars; recreate container after `.env` change.
- **`db:seed` on prod:** **destructive** (`destroy_all` at top of `seeds.rb`) — demo DB only.

---

## 3) URLs / outputs (example)

- **CloudFront:** `https://d2cvnbu2jarn1q.cloudfront.net`
- **API base:** `https://d2cvnbu2jarn1q.cloudfront.net/api/v1`
- **Health:** `https://d2cvnbu2jarn1q.cloudfront.net/up` (Rails, not React — requires dual-origin CF)
- **EC2:** Elastic IP `52.22.20.36` — if instance **stopped**, **504** on API/`/up` until started again.
- Use **`terraform output`** in `infra/` for `cloudfront_distribution_id`, `frontend_bucket_name`, `cloudfront_api_origin_domain`.

---

## 4) Deferred / nice-to-have

- Budgets, cost anomaly, schedule tuning
- ALB + custom domain + ACM (optional)
- Docker `linux/amd64` RSpec if local `bundle` is flaky

---

## 5) Doc index (updated Mar 21, 2026)

| File | Purpose |
|------|---------|
| [root_cause_deplpyment_lessons.md](root_cause_deplpyment_lessons.md) | Full lesson list (H–L: CF, Docker, Ruby, curl, seed) |
| [deploy_todo.md](deploy_todo.md) | Command-level checklist |
| [infra/README.md](infra/README.md) | Terraform + `s3 sync` + invalidation |
| [DEPLOY_PLAN.md](DEPLOY_PLAN.md) | Architecture |
| [memory.md](memory.md) | Cost + idle reminders |
| [next_week.md](next_week.md) | Longer defer list |
| [PROD_LOCAL_SMOKE.md](PROD_LOCAL_SMOKE.md) | Prod-like Docker smoke on Mac before EC2 |

---

*Updated: March 21, 2026*
