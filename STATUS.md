# CatalogIt — project status & history

**Last updated:** April 3, 2026  
**Deploy branch:** `deployment`

Single consolidated status doc (replaces former `PROJECT_STATUS.md` and `WEEKLY_PLAN.md`).

| Need | Document |
|------|----------|
| Run locally or on AWS (commands) | **[DEMO.md](DEMO.md)** |
| **AWS deploy, frontend sync, smoke tests** | **[DEPLOY.md](DEPLOY.md)** |
| Session handoff, cost, deferred work | **[OPERATIONS.md](OPERATIONS.md)** |
| Terraform (provision, outputs) | **[infra/README.md](infra/README.md)** |
| Git & secrets hygiene (public repo) | **[SECURITY_GIT.md](SECURITY_GIT.md)** |

---

## Progress snapshot

```
Backend:     ████████████ 100%  (Rails API, tests, Swagger)
Frontend:    ████████████ 100%  (React, Vitest, Playwright)
Security:    ████████████ 100%  (TLS, MFA, JWT, rate limits, etc.)
Deployment:  documented       Terraform + EC2 + RDS + S3 + CloudFront + ECR — see DEPLOY.md
```

---

## Highlights

- **Backend:** Rails 8 API, JWT, MFA, lists/items, comments, reactions, attachments (Active Storage), analytics, RSpec.
- **Frontend:** Vite + React, auth, explore/dashboard/list detail, share links, profile, tests.
- **AWS:** Infra as code under `infra/`; **deploy & smoke:** **[DEPLOY.md](DEPLOY.md)** (ECR/EC2, S3/CloudFront).
- **Remaining / verify:** budgets/tags, optional ALB/domain — see **OPERATIONS.md**.

---

## Charter phases (summary)

| Phase | Period | Status |
|-------|--------|--------|
| 1–3 Planning & setup | Jan | Complete |
| 4 Backend | Feb | Complete |
| 5 Frontend | Feb | Complete |
| 6 Core functionality | Feb | Complete |
| 7 Midterm | Feb | Complete |
| 8–10 Integration & closing | Mar–Apr | See OPERATIONS / DEMO |

## ERD rules (summary)

| Area | Status |
|------|--------|
| Users, lists, items, visibility, ratings, share codes | Done |
| Comments & reactions | Done |
| Attachments (list/item) | Done |
| ActivityLog / admin KB (charter extras) | Future |

## Security controls (summary)

TLS, at-rest encryption, MFA, JWT, password reset/hashing, XSS, rate limiting, CORS, validation, owner checks, React error boundary — see **backend/SECURITY_IMPLEMENTATION.md** for detail.

---

## Demo seed accounts (development only)

> **Warning:** These match **`db/seeds.rb`** for **local/demo** databases only. **Do not reuse these passwords in production.** If you deploy seeds to any shared environment, rotate credentials immediately.

| Role | Email (example) | Password (dev seed) |
|------|-------------------|---------------------|
| admin | `admin@catalogit.com` | `password123` |
| user | `movies@example.com` | `password123` |
| user | `books@example.com` | `password123` |
| user | `collector@example.com` | `password123` |
| suspended | `banned@example.com` | `password123` |

---

## Quick commands

```bash
# Backend dev
cd backend && bundle exec puma -p 3000

# Frontend dev
cd frontend && npm run dev

# Tests (see backend/TESTING.md, frontend package.json)
cd backend && RAILS_ENV=test bundle exec rspec
cd frontend && npm run test && npm run test:e2e
```
