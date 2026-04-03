# Operations & handoff

**Last updated:** April 3, 2026  

**Full production release** (recommended whenever you ship a version users should run): backend image + **`db:prepare`** + **`db:ensure_solid_queue`**, frontend build/sync + CloudFront invalidation, then smoke tests — **[DEPLOY.md §0](DEPLOY.md#0-full-production-release-do-all-of-this-for-a-complete-deploy)**.

**Deploy commands, EC2/ECR flow, frontend sync, smoke URLs:** **[DEPLOY.md](DEPLOY.md)**  
**Local + class demo walkthrough:** **[DEMO.md](DEMO.md)**  
**Terraform:** **[infra/README.md](infra/README.md)**  
**Secrets / git hygiene:** **[SECURITY_GIT.md](SECURITY_GIT.md)**

Infra URLs and IDs: use **`terraform output`** and the AWS console — do not rely on old hostnames in notes or paste live resource IDs into committed markdown.

---

## AWS session hygiene (when pausing work)

```bash
aws sso logout --profile <your-profile> 2>/dev/null || aws sso logout
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_SECURITY_TOKEN AWS_CREDENTIAL_EXPIRATION
rm -rf ~/.aws/cli/cache/* 2>/dev/null
aws configure list
```

---

## Cost & idle reminders

- Small instance classes and single-AZ keep cost down; billing can be non-zero while EBS/RDS/ECR/S3 exist.
- **EventBridge** schedules may **stop EC2/RDS** — expect **504** until you start them again.
- **End of session:** consider stopping EC2/RDS if your budget requires it; S3 + CloudFront stay cheap.

---

## Deferred / nice-to-have

- AWS Budgets ($1 / $5 / $10), Cost Anomaly Detection, tags (`Project=CatalogIt`, etc.).
- CI: full **`scripts/test-all.sh`** before releases.
- ALB + custom domain + ACM (optional).

When you say **“pickup”**, start with **[DEPLOY.md](DEPLOY.md)**.
