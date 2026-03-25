# Next Week Plan (Deferred work)

**Last updated:** March 21, 2026  

> **Start here after a break:** [`pickup.md`](pickup.md) — AWS session teardown, CloudFront + Docker notes, URLs, smoke tests. **Deep dive:** [`root_cause_deplpyment_lessons.md`](root_cause_deplpyment_lessons.md). **Pre-EC2 prod image smoke:** [`PROD_LOCAL_SMOKE.md`](PROD_LOCAL_SMOKE.md).

## Immediate carryover (Mar 21 → next session)

**Backend (in progress):** Local **`docker build`** → **`catalogit-backend:latest`** is good. **Next:** ECR push, EC2 recreate container, then **`db:migrate`** on RDS (Solid Cache migration — signup/throttle fix). Details: [`pickup.md`](pickup.md) §0.

**Still open:**

- Set **`ACTIVE_STORAGE_SERVICE=amazon`** on EC2 when you want real S3 uploads (image already has **`aws-sdk-s3`**).
- Rebuild frontend with production **`VITE_API_URL`**, upload to S3, invalidate CloudFront.
- Validate attachments end-to-end (note / link / file) on list and item rows.

## Longer defer list

### 1) Runtime scheduling automation

- EventBridge schedules for EC2/RDS start/stop (if not already satisfied)
- Validate across at least two daily cycles

### 2) Cost guardrails

- AWS Budgets alerts (`$1`, `$5`, `$10`)
- Cost Anomaly Detection
- Resource tags: `Project=CatalogIt`, `Environment=prod`, `Owner=<name>`

### 3) Terraform hardening

- Default instance classes to micro sizes
- Guardrails against accidental multi-AZ in free-first mode
- Review backup/snapshot retention

### 4) Deployment quality follow-up

- Cold-start timing after scheduled startup
- Operational runbook for start-window troubleshooting
- Rollback steps documented

### 4b) Reduce “rebuild → smoke → new bug” loops (deferred hardening)

**Done now (Step 1):** prod-like local Docker smoke — [`PROD_LOCAL_SMOKE.md`](PROD_LOCAL_SMOKE.md) + [`docker-compose.prod-local.yml`](docker-compose.prod-local.yml) + [`scripts/smoke_prod_local.sh`](scripts/smoke_prod_local.sh) (same image as EC2, local Postgres only).

**Schedule for later:**

1. **Frozen deploy checklist** — Short ordered list (pull → `rm` container → `run` → `db:migrate` → `curl /up` → signup/login smoke); paste every deploy so steps aren’t skipped under stress.
2. **`scripts/smoke_prod.sh` (EC2 or CloudFront URL)** — Automate post-deploy: health + one API that hits DB/cache (e.g. `GET /api/v1/lists` + optional signup dry run).
3. **CI on every PR** — At minimum: `bundle exec rspec` (or test suite) + `docker build` for backend so “won’t boot” fails before EC2.
4. **Cheap staging** — Same stack as prod (second EC2 or small RDS) so production only promotes what already passed.
5. **Expect a one-time prod tail** — Cache, jobs, mail, CORS, cookies often surface once; after that, churn drops if prod-like + CI gates stay in place.

### 5) Documentation

- Final deployment URLs and verification evidence after S3 cutover
- TLS termination notes if ALB/custom domain is added

---

*Supersedes ad-hoc “Mar 19” defer notes; use `pickup.md` for session handoff.*
