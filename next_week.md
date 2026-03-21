# Next Week Plan (Deferred work)

**Last updated:** March 20, 2026  

> **Start here after a break:** [`pickup.md`](pickup.md) — AWS session teardown, S3/attachment deploy checklist, URLs, smoke tests.

## Immediate carryover (from Mar 20)

- Deploy backend image with **`aws-sdk-s3`**; set **`ACTIVE_STORAGE_SERVICE=amazon`** on EC2; run **`rails db:migrate`** on RDS.
- Rebuild frontend with production `VITE_API_URL`, upload to S3, invalidate CloudFront.
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

### 5) Documentation

- Final deployment URLs and verification evidence after S3 cutover
- TLS termination notes if ALB/custom domain is added

---

*Supersedes ad-hoc “Mar 19” defer notes; use `pickup.md` for session handoff.*
