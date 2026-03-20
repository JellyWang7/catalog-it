# Next Week Plan (Deferred from Mar 19 AWS Execution Week)

This file tracks work intentionally deferred after completing this week's deployment execution scope.

## Carryover from Mar 20 (if not finished tonight)

- Stabilize backend container startup on EC2 and confirm `GET /up` returns 200.
- Complete database bootstrap inside running container:
  - `rails db:prepare`
  - `rails db:migrate`
- Build frontend with production `VITE_API_URL`, upload to S3, invalidate CloudFront.
- Complete validation checklist:
  - `/up` and `/api/v1/lists`
  - auth + list CRUD
  - CORS restrictions
  - HTTPS behavior and no redirect loops

## 1) Runtime scheduling automation

- Implement EventBridge schedules for:
  - EC2 start
  - EC2 stop
  - RDS start
  - RDS stop
- Validate start/stop behavior across at least two daily cycles

## 2) Cost guardrails

- Create AWS Budgets alerts at:
  - `$1`
  - `$5`
  - `$10`
- Enable Cost Anomaly Detection
- Confirm all resources are tagged:
  - `Project=CatalogIt`
  - `Environment=prod`
  - `Owner=<your-name>`

## 3) Terraform hardening

- Restrict default instance classes to micro sizes
- Add guardrails to prevent accidental multi-AZ in free-first mode
- Review backup/snapshot retention for minimal-cost profile

## 4) Deployment quality follow-up

- Measure cold-start timing after scheduled startup
- Add a short operational runbook for start-window troubleshooting
- Capture and document rollback steps

## 5) Documentation alignment

- Update status percentages after AWS deploy validation is complete
- Ensure all docs consistently reference AWS path (remove stale Render/Netlify mentions)
- Add final deployment URLs and verification evidence
