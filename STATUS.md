# CatalogIt — project status & history

**Last updated:** April 7, 2026  
**Default branch:** `main`

Single consolidated status doc (replaces former `PROJECT_STATUS.md` and `WEEKLY_PLAN.md`).

| Need | Document |
|------|----------|
| Run locally or on AWS (commands) | **[DEMO.md](DEMO.md)** |
| **AWS deploy, frontend sync, smoke tests** | **[DEPLOY.md](DEPLOY.md)** |
| Session handoff, cost, deferred work | **[OPERATIONS.md](OPERATIONS.md)** |
| Terraform (provision, outputs) | **[infra/README.md](infra/README.md)** |
| Design & submission artifacts (`docs/`) | **[docs/README.md](docs/README.md)** |
| Git & secrets hygiene (public repo) | **[SECURITY_GIT.md](SECURITY_GIT.md)** |

---

## Progress snapshot

```
Backend:     ████████████ 100%  (Rails API, tests, Swagger)
Frontend:    ████████████ 100%  (React, Vitest, Playwright)
Security:    ████████████ 100%  (TLS, MFA, JWT, rate limits, etc.)
Deployment:  documented       Terraform + EC2 + RDS + S3 + CloudFront + ECR; migrations + Solid Queue on deploy — see DEPLOY.md §0
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

## Local demo accounts (development only)

> Seeded users and credentials are defined only in **`backend/db/seeds.rb`** for local or disposable databases. **Do not** document real passwords in this repository; **do not** run **`db:seed`** on production unless you fully understand data loss and credential risk.

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
