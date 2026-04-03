# CatalogIt - AWS Deployment Plan (Free-First, Scale-Ready)

**Last Updated**: April 2026  
**Target**: Lowest-cost AWS deployment now, with smooth upgrade path later  
**Strategy**: S3 + CloudFront (frontend), EC2 (Rails), RDS PostgreSQL (database), EventBridge schedules

---

## Decision: Should You Use Terraform?

Yes. Use Terraform for this project.

Why:
- Reproducible environment (you can tear down and recreate safely).
- Easy upgrade path from free-tier to paid/high-availability later.
- Cost controls and schedules can be versioned in code.
- Better for class/demo handoff and future portfolio proof.

When to skip Terraform:
- One-time demo only and you need to deploy in under 30 minutes.

Recommended:
- Use Terraform for AWS infrastructure.
- Keep app deploy commands simple (Docker image on EC2 + `docker run`).

---

## Architecture Overview (Current Goal)

**Implemented:** one **CloudFront** distribution, **two origins**:

```
Browser (HTTPS)
  -> CloudFront
       ├─ path /api/*, /up, /api-docs*, /rails/*  ->  EC2:80 (Rails / Thruster, HTTP to origin)
       └─ default /*                               ->  S3 (React static build; OAC)
  -> EC2 talks to RDS PostgreSQL (private SG)
```

- Viewer always uses **HTTPS** to CloudFront; **EC2 origin is HTTP** (port from `api_port`, default 80) — no mixed-content issues if **`VITE_API_URL=https://<cloudfront-domain>/api/v1`**.
- Do **not** use S3-only CloudFront for a single-domain app: API routes would return HTML and break the SPA ([root_cause_deployment_lessons.md](root_cause_deployment_lessons.md) **Root cause H**).

Free-first profile:
- Frontend: S3 + CloudFront (very low cost, often near $0 for low traffic).
- Backend: EC2 t2.micro/t3.micro.
- Database: RDS db.t3.micro.
- Daily schedule: start stack for 1-2 hours, then auto-stop.

Scale path later:
- Move EC2 -> ECS/Fargate or ASG.
- Move RDS -> Multi-AZ + larger class.
- Add ALB + Route53 custom domain + ACM cert.

---

## Important Project Readiness Items

Current state:
- Done: frontend deployment env uses `VITE_API_URL`.
- Done: production `database.yml` includes `primary`, `cache`, `queue`, and `cable`.
- Done: **`aws-sdk-s3`** in Gemfile so `ACTIVE_STORAGE_SERVICE=amazon` can load the S3 adapter.
- Done: backend deploy scripts include preflight env validation (`check_prod_env.sh`).
- Done: optional local fallback path exists via `--skip-s3-check`.
- Pending: validate Ruby image/version compatibility in your target EC2 build environment.
- Pending: finalize TLS termination setup for your chosen endpoint (CloudFront/ALB/reverse proxy).
- Pending: production **must** run migrations after pulling latest code; see **[DEMO.md §2](DEMO.md#2-aws-production-start-backend-and-frontend)** and [OPERATIONS.md](OPERATIONS.md).

TLS/SSL requirement:
   - `config.force_ssl = true` is enabled.
   - Ensure HTTPS termination is correctly configured (CloudFront + HTTPS origin strategy, or ALB with ACM).

---

## Phase 1 - AWS Foundation (Terraform)

Create Terraform stack with:
- VPC (or default VPC for faster start)
- Security groups:
  - EC2: inbound 22 (restricted to your IP), 80/443 as needed
  - RDS: inbound 5432 from EC2 SG only
- EC2 instance (t2.micro or t3.micro)
- RDS PostgreSQL (db.t3.micro, single-AZ, minimal storage)
- S3 bucket for frontend
- CloudFront distribution: **S3 default origin + EC2 custom origin** with path-based cache behaviors (`infra/main.tf`)
- IAM roles/policies for:
  - EC2 SSM access (optional but recommended)
  - Scheduler/Lambda start-stop automation
- AWS Budgets + alerts

Suggested Terraform structure:

```
infra/
  main.tf
  variables.tf
  outputs.tf
  modules/
    network/
    ec2/
    rds/
    s3_frontend/
    cloudfront/
    schedule/
```

---

## Phase 2 - Backend Deploy (EC2 + Docker)

On EC2:
1. Install Docker.
2. Pull/build backend image.
3. Set environment variables (systemd env file or `.env`).
4. Run container with restart policy.

Required backend env vars:
- `RAILS_ENV=production`
- `SECRET_KEY_BASE=<generated>`
- `DATABASE_HOST=<rds-endpoint>`
- `DATABASE_USERNAME=<db_user>`
- `CATALOGIT_DATABASE_PASSWORD=<db_pass>`
- `FRONTEND_URL=https://<cloudfront-domain>`
- `RAILS_LOG_LEVEL=info`
- `ACTIVE_STORAGE_SERVICE=amazon` (production uploads) + **`AWS_REGION`**, **`AWS_S3_BUCKET`**, and credentials (or instance role) — see `check_prod_env.sh`
- **`RAILS_MASTER_KEY`**: only if you use encrypted `credentials.yml.enc` with a matching key; this project’s production path is **ENV-only** (do not pass a bogus `RAILS_MASTER_KEY`).

Recommended:
- Add reverse proxy (Nginx or Caddy) on EC2 for stable SSL/origin behavior.

---

## Phase 3 - Frontend Deploy (S3 + CloudFront)

Build frontend:

```bash
cd frontend
VITE_API_URL="https://<api-domain-or-ec2-endpoint>/api/v1" npm run build
```

Upload `dist/` to S3 bucket.

CloudFront:
- Origin: S3 bucket
- Default root object: `index.html`
- SPA fallback: map 403/404 to `/index.html` (HTTP 200)
- Enable compression

If using private S3 bucket:
- Use Origin Access Control (OAC) and bucket policy for CloudFront only.

---

## Phase 4 - Strict Daily Runtime Schedule (1-2 Hours)

Goal: backend/database only available during a fixed daily window.

### Recommended schedule model
- Start daily at `18:00` local time
- Stop daily at `20:00` local time

Use EventBridge Scheduler (or EventBridge Rules) to automate:
- EC2 start: `aws ec2 start-instances --instance-ids <id>`
- EC2 stop: `aws ec2 stop-instances --instance-ids <id>`
- RDS start: `aws rds start-db-instance --db-instance-identifier <id>`
- RDS stop: `aws rds stop-db-instance --db-instance-identifier <id>`

Implementation options:
- Terraform-managed `aws_scheduler_schedule` + IAM target role.
- Or Lambda functions invoked by schedule.

Important notes:
- RDS can remain stopped for up to 7 days; daily start/stop is valid.
- S3/CloudFront remain always on (very low idle cost).
- If backend is stopped, frontend loads but API features will be unavailable.

---

## Cost Strategy

### Free-first mode (first 12 months free tier, low traffic)
- EC2 micro + RDS micro + small storage + S3/CloudFront small usage.
- Keep everything in one region.
- Use daily start/stop window.

### Near-zero beyond free tier
- Keep S3 + CloudFront only.
- Stop EC2/RDS except during demos/use windows.

### Paid upgrade path (later)
- Longer schedule or always-on runtime.
- Larger EC2/RDS classes.
- Add ALB + Route53 + ACM + WAF.

---

## Hard Cost Guardrails (Must Do)

1. Create AWS Budget alarms:
   - `$1`, `$5`, `$10` monthly thresholds.
2. Enable Cost Anomaly Detection.
3. Tag every resource with:
   - `Project=CatalogIt`
   - `Environment=prod`
   - `Owner=<your-name>`
4. Add Terraform variable guardrails:
   - instance classes restricted to micro by default.
   - prevent accidental multi-AZ RDS in free mode.
5. Keep snapshots/backup retention minimal for free mode.

---

## Deployment Runbook (Ordered)

1. Fix app readiness items listed above.
2. Provision AWS infra with Terraform.
3. Build and deploy Rails backend to EC2.
4. Run:
   - `rails db:prepare`
   - `rails db:migrate`
   - `rails db:seed` (optional)
5. Build frontend with production `VITE_API_URL`.
6. Upload frontend `dist/` to S3.
7. Invalidate CloudFront cache.
8. Verify:
   - Frontend loads
   - `/api/v1/lists` reachable
   - Auth flow works
9. Enable daily start/stop schedules.
10. Confirm budget alerts by setting very low thresholds.

---

## Validation Checklist

- Frontend URL responds over HTTPS.
- API health endpoint `/up` responds when schedule window is active.
- CORS allows only CloudFront domain.
- Login/signup/list CRUD work during active window.
- After stop schedule, API is unreachable (expected).
- Next day start schedule restores service automatically.

---

## Known Tradeoffs in Free-First Mode

- App is unavailable outside scheduled runtime.
- Cold-start delays after start event.
- Local Active Storage in Docker is not durable; use **S3** (`ACTIVE_STORAGE_SERVICE=amazon`) for production file attachments.
- Free tier is limited and can change; always watch billing.

---

## Next Step (Immediate)

1. Provision infrastructure with Terraform (`infra/`).
2. Fill `backend/.env.production` on the server (never commit — [SECURITY_GIT.md](SECURITY_GIT.md)).
3. Run backend + frontend deploy commands: **[DEMO.md §2](DEMO.md#2-aws-production-start-backend-and-frontend)**.
4. Enable and verify daily start/stop schedules (or disable while testing).

---

## Appendix: execution commands

**Copy-paste checklist** (EC2 paths, laptop `cd`, migrations, S3, invalidation, troubleshooting) lives in **[DEMO.md](DEMO.md)** (§**2** deploy, §**7–9** presenter walkthrough). This plan stays focused on **architecture, phases, and tradeoffs**.

**Handoff / cost / defer lists:** [OPERATIONS.md](OPERATIONS.md). **Lessons (504, Docker, CloudFront, Solid Cache):** [root_cause_deployment_lessons.md](root_cause_deployment_lessons.md).

---

*Last updated: April 2026*
