# CatalogIt

> A web application for creating, rating, and sharing personal catalogs (movies, books, collectibles, and more).

**Course**: CS 701 — Special Projects in CS II  
**Status**: Backend complete | Frontend complete (comments, likes, attachments) | AWS deploy supported via Terraform + ECR/EC2 + S3/CloudFront  
**Tests**: Backend RSpec + frontend Vitest/Playwright — run locally before merge (see below).

**Repository note:** This GitHub project intentionally tracks **only this `README.md`** for prose documentation. A full local checkout may include a `docs/` folder and other `*.md` guides (deploy, demo, setup); those files are **gitignored** and do not appear on GitHub. Keep course work and design artifacts on your machine or submit them through channels your instructor specifies — not in this remote tree.

---

## CI

Pull requests that touch `frontend/**` run **`.github/workflows/frontend-tests.yml`**: `npm ci`, `npm run test`, Playwright `npm run test:e2e`.

There is **no** Rails workflow in Actions; run backend checks locally (below) before you merge or release.

---

## Local test & lint commands

From repo root (after `bundle install` in `backend/`, `npm ci` in `frontend/`, and a working test database):

```bash
chmod +x scripts/test-all.sh   # once
./scripts/test-all.sh
```

Or separately:

```bash
# Frontend
cd frontend && npm run test && npm run test:e2e

# Backend
cd backend
bundle exec rspec
bundle exec rubocop -f github
bin/brakeman --no-pager
bin/bundler-audit
```

`npm ci` requires `frontend/package-lock.json` in sync with `package.json`; refresh with `npm install` in `frontend/` when dependencies change.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite 4, Tailwind CSS 3, React Router 6, Axios |
| **Backend** | Ruby on Rails 8.1 (API mode), JWT, TOTP MFA, RSpec |
| **Database** | PostgreSQL 15+; use RDS/storage encryption in AWS when provisioning |
| **Deploy** | Terraform (`infra/`), EC2 + Docker, ECR, RDS, S3, CloudFront (dual origin: SPA + API) |

Ruby **4.0+** matches `backend/Dockerfile` (`RUBY_VERSION`). Node **18+** recommended for the frontend toolchain.

---

## Project structure

```
catalog-it/
├── backend/          # Rails API (Puma, Swagger at /api-docs)
├── frontend/         # Vite + React SPA
├── infra/            # Terraform (AWS)
├── scripts/          # e.g. test-all.sh
└── docs/             # Local-only if present (gitignored)
```

---

## Quick start (local)

### Backend

```bash
cd backend
cp config/database.yml.example config/database.yml   # if needed; edit credentials
bundle install
rails db:create db:migrate db:seed   # seed optional
bundle exec puma -p 3000
```

- API: `http://localhost:3000`  
- Health: `http://localhost:3000/up`  
- Swagger UI: `http://localhost:3000/api-docs`  
- OpenAPI YAML: `http://localhost:3000/api-docs/v1/swagger.yaml`  

When the API changes, regenerate the bundled OpenAPI file under `backend/swagger/` using **rswag** (the `rswag-specs` gem is in the development/test group — e.g. `bundle exec rake rswag:specs:swaggerize` if that task is enabled in your setup).

### Frontend

```bash
cd frontend
cp .env.example .env    # if present
npm install
npm run dev
```

App: `http://localhost:5173` — expects API on port **3000**. Set `VITE_API_URL` for production builds to your public API base (e.g. `https://<cloudfront-host>/api/v1`).

---

## AWS deployment (summary)

Infra lives under **`infra/`** (Terraform). Typical shape: **CloudFront** in front of **S3** (static SPA) and **EC2** (Rails in Docker); **RDS** for PostgreSQL.

**Full release** (keep API, migrations, Solid Queue, and SPA in sync):

1. **Preflight:** EC2 and RDS running; Docker on EC2; AWS CLI on your laptop for ECR/S3/CloudFront.
2. **Tests:** `./scripts/test-all.sh` (recommended).
3. **Backend image:** From `backend/`, build and push to ECR (see `scripts/deploy_ecr_push.sh` when configured). On EC2, from your clone’s `backend/`: `source .env.production` (never commit this file), then `./scripts/deploy_ec2_backend.sh --pull`. Deploy scripts run **`db:prepare`** and **`db:ensure_solid_queue`** so migrations and Solid Queue tables exist (needed for Active Storage jobs).
4. **Frontend:** `npm ci` and `npm run build` with the correct **`VITE_API_URL`**, then upload `dist/` to the frontend S3 bucket and invalidate the CloudFront distribution (use `terraform output` for bucket name, distribution ID, and domain).
5. **Smoke:** `https://<cloudfront-domain>/up`, public API routes, SPA in a private window.

Use placeholders in any notes you share (`<account-id>`, `<region>`, `<cloudfront-domain>`). **Do not commit** `backend/.env.production`, `backend/config/master.key`, `backend/config/database.yml`, `infra/terraform.tfvars`, or raw AWS keys.

**Git on EC2:** Track the same branch you deploy from (e.g. `main`): `git fetch origin && git checkout main && git pull origin main`.

**Seeds:** `db:seed` can wipe data — avoid on production unless intentional.

---

## API endpoints (overview)

| Area | Examples |
|------|----------|
| **Auth** | `POST /api/v1/auth/signup`, `login`, `forgot_password`, `reset_password`; `GET /api/v1/auth/me`; MFA: `setup`, `verify`, `DELETE` |
| **Lists** | CRUD, `analytics`, `share`, `shared/:code`, like/unlike |
| **Items** | CRUD under lists; like/unlike on items |
| **Comments** | List comments; delete by id |
| **Attachments** | List and item attachments; delete by id |

Swagger lists the canonical set. Rules include: private lists cannot be shared; attachment links must be `https://`; upload size/type limits apply.

---

## Security (high level)

TLS in production, ActiveRecord::Encryption for sensitive fields, TOTP MFA, JWT (short-lived), bcrypt passwords, password-reset tokens, XSS-oriented sanitization, content moderation hooks, Rack::Attack rate limiting, CORS, owner checks / IDOR prevention, React error boundary. Optional WAF at the CloudFront edge is an infrastructure choice, not defined in application code here.

---

## Git

**Default branch:** `main`.

**Never commit:** `.env` (except `*.example`), production env files, `database.yml`, `master.key`, terraform secrets/state, keys, or credentials inside markdown.

---

## License

MIT
