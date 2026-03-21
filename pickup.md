# Pickup — Next session (week of Mar 24, 2026)

Handoff after doc sync + repo push. Use this file first when you return.

## 1) End AWS CLI sessions locally (do this when pausing AWS work)

Run what applies to your setup:

```bash
# AWS SSO (if you use `aws sso login`)
aws sso logout --profile <your-profile> 2>/dev/null || aws sso logout

# Clear short-lived env vars in the current shell
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_SECURITY_TOKEN AWS_CREDENTIAL_EXPIRATION

# Remove cached SSO/CLI login tokens (forces fresh login next time)
rm -rf ~/.aws/cli/cache/* 2>/dev/null

# Optional: see what the CLI will use next time
aws configure list
aws sts get-caller-identity  # should fail or prompt until you log in again
```

**Note:** Do not delete `~/.aws/credentials` unless you intend to remove static keys entirely.

---

## 2) Production: file uploads + attachments (highest priority)

**Problem solved in code:** unified list/item attachment UI (optional **note**, **https link**, or **file** — not two parallel required forms). Backend supports **`note`** kind + nullable title; **`aws-sdk-s3`** added for S3.

**Still required on AWS:**

1. Deploy a **new backend image** that includes `aws-sdk-s3` and run **`rails db:migrate`** on RDS (attachment `body` / nullable `title` migration).
2. On EC2 `.env.production` (and `docker run -e`):
   - Set **`ACTIVE_STORAGE_SERVICE=amazon`** (not `local` long-term).
   - Ensure **S3** env vars match your bucket/region/credentials (same as preflight script expects).
3. Rebuild frontend with:
   ```bash
   VITE_API_URL=https://d2cvnbu2jarn1q.cloudfront.net/api/v1 npm run build
   ```
4. Upload `dist/` to S3, **invalidate CloudFront**.

**Smoke test:** add attachment as **text only**, **link only**, **file only**; confirm no “Failed to upload item file” when S3 is active.

---

## 3) URLs / infra reminders (from `root_cause_deplpyment_lessons.md`)

- **CloudFront (frontend + API path):** `https://d2cvnbu2jarn1q.cloudfront.net`
- **API base:** `https://d2cvnbu2jarn1q.cloudfront.net/api/v1`
- **EC2 Elastic IP:** `52.22.20.36` (if schedules **stop** the instance, expect **504** on `/api/*` until it’s started again).
- **Infra:** `infra/main.tf` routes `/api/*`, `/up`, `/api-docs*`, `/rails/*` to EC2. Run **`terraform apply`** in `infra/` after pulling latest, wait for deploy, then **`aws cloudfront create-invalidation … --paths "/*"`**. Rebuild frontend with `VITE_API_URL=https://<cloudfront-domain>/api/v1`.

---

## 4) Deferred / nice-to-have (see also `next_week.md`)

- Terraform budgets, cost anomaly, schedule tuning
- TLS/termination doc if you add ALB/custom domain
- Full `bundle exec rspec` in Docker `linux/amd64` if local `bundle` is flaky

---

## 5) Doc index (updated Mar 20, 2026)

| File | Purpose |
|------|---------|
| [root_cause_deplpyment_lessons.md](root_cause_deplpyment_lessons.md) | AWS debugging timeline, JWT/credentials/S3/504 lessons |
| [deploy_todo.md](deploy_todo.md) | Command-level deploy checklist |
| [DEPLOY_PLAN.md](DEPLOY_PLAN.md) | Architecture + runbook |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Status snapshot |
| [next_week.md](next_week.md) | Longer defer list |

---

*Created: March 20, 2026*
