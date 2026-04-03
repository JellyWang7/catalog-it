# CatalogIt

> A web application for creating, rating, and sharing personal catalogs (movies, books, collectibles, and more).

**Course**: CS 701 -- Special Projects in CS II  
**Status**: Backend Complete | Frontend Complete (Comments + Likes + Attachments v1.1) | AWS deploy documented ([DEPLOY.md](DEPLOY.md))  
**Tests**: Full backend RSpec + Frontend UI/E2E tests passing  

---

## Quick links

| Document | Purpose |
|----------|---------|
| **[DEMO.md](DEMO.md)** | **Start app (local + AWS), demo walkthrough** |
| **[DEPLOY.md](DEPLOY.md)** | **AWS deploy (ECR/EC2), frontend S3/CloudFront, smoke tests** |
| [STATUS.md](STATUS.md) | **Project status, milestones summary, charter snapshot** |
| [FRONTEND_SETUP.md](FRONTEND_SETUP.md) | Frontend architecture & component guide |
| [OPERATIONS.md](OPERATIONS.md) | Cost, session handoff, deferred work |
| [SECURITY_GIT.md](SECURITY_GIT.md) | What must never be committed; public-repo doc hygiene |

**Public repository:** Do not commit real AWS account IDs, ECR URIs, or secrets in markdown. Use placeholders (`<account-id>`, `<region>`). Operator-specific one-liners can live in **`continue.md`** or **`p.md`** locally — both are **gitignored** (see [.gitignore](.gitignore)).
| [backend/AUTHENTICATION.md](backend/AUTHENTICATION.md) | JWT auth + password reset guide |
| [backend/SWAGGER_SETUP.md](backend/SWAGGER_SETUP.md) | Swagger/OpenAPI setup and generation |
| [backend/TESTING.md](backend/TESTING.md) | Testing guide (current backend suite details) |

---

## CI & Test Gates

> PRs are expected to pass all automated checks before merge.

### Enforced Checks on Pull Requests

| Workflow | Scope | Required Gates |
|----------|-------|----------------|
| `backend/.github/workflows/ci.yml` | Rails backend | Brakeman scan, bundler-audit, RuboCop |
| `.github/workflows/frontend-tests.yml` | React frontend | `npm run test` (Vitest UI), `npm run test:e2e` (Playwright E2E) |

### Local Commands (match CI)

**Full suite (one command)** — from this repo root, after `npm install` in `frontend/`, `bundle install` in `backend/`, and a working test database (see [backend/TESTING.md](backend/TESTING.md)):

```bash
chmod +x scripts/test-all.sh   # first time only
./scripts/test-all.sh
```

This runs Vitest, installs Playwright Chromium if needed, runs Playwright E2E, then `RAILS_ENV=test bundle exec rspec`.

```bash
# Frontend
cd frontend
npm run test
npm run test:e2e

# Backend
cd backend
bundle exec rspec
bundle exec rubocop -f github
bin/brakeman --no-pager
bin/bundler-audit
```

### npm ci lockfile rule

`npm ci` requires `frontend/package.json` and `frontend/package-lock.json` to be fully in sync.

- If dependencies change, run `npm install` in `frontend/` to refresh `package-lock.json`.
- Commit both `package.json` and `package-lock.json` together in the same PR.
- Verify locally with `npm ci` before pushing to avoid CI install failures.

---

## Tech Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| **Frontend** | React 18, Vite 4, Tailwind CSS 3, React Router 6, Axios | 100% |
| **Backend** | Ruby on Rails 8 (API mode), JWT, TOTP MFA, RSpec | Complete |
| **Database** | PostgreSQL 15+ (3NF), AES-256 encryption at rest | Complete |
| **Security** | TLS, MFA, XSS, rate limiting, CORS, IDOR prevention | Complete |
| **Deployment** | AWS (Terraform + EC2 + RDS + S3 + CloudFront) | See [DEPLOY.md](DEPLOY.md) |

---

## Project Structure

```
catalog-it/
├── backend/              # Rails 8 API
│   ├── app/
│   │   ├── controllers/  # Auth, Lists, Items controllers
│   │   ├── models/       # User, List, Item
│   │   └── services/     # JWT encoder/decoder
│   ├── spec/             # RSpec tests (full suite passing)
│   └── swagger/          # OpenAPI spec
├── frontend/             # React + Vite app
│   ├── src/
│   │   ├── components/   # Layout, ErrorBoundary, StarRating, Modals, Skeletons
│   │   ├── context/      # AuthContext
│   │   ├── pages/        # 11 pages (Home, Auth, Explore, Dashboard, etc.)
│   │   ├── services/     # Axios API client (auth, lists, items)
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Helpers
│   └── vite.config.js
├── docs/                 # Design documents (from CS 700)
└── *.md                  # Project documentation
```

---

## Quick Start

### Prerequisites

- Ruby 3.x+ / Rails 8+
- Node.js 18+ recommended (Node 16 works with current pinned test tooling)
- PostgreSQL 15+

### Backend

```bash
cd backend
bundle install
rails db:create db:migrate db:seed
bundle exec puma -p 3000
```

API: **http://localhost:3000** | Swagger: **http://localhost:3000/api-docs**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: **http://localhost:5173**

---

## Current Deployment Track (AWS)

CatalogIt uses **Terraform** (`infra/`) with **CloudFront dual origin** (S3 SPA + EC2 API). **Deploy, frontend sync, smoke URLs:** **[DEPLOY.md](DEPLOY.md)**. **Longer demo script:** [DEMO.md §2](DEMO.md#2-aws-production-start-backend-and-frontend).

### Production deploy summary

1. **Backend:** ECR push from laptop → **`deploy_ec2_backend.sh --pull`** on EC2 — see **[DEPLOY.md](DEPLOY.md)**.
2. **Frontend:** `VITE_API_URL` + `npm run build` → `s3 sync` → invalidation — **[DEPLOY.md](DEPLOY.md)** §4.
3. **Smoke:** CloudFront **`/up`**, **`/api/v1/lists`**, SPA in incognito — **[DEPLOY.md](DEPLOY.md)** §5.
4. **Seeds:** `db:seed` **wipes** data — production only if intentional.

**Handoff / cost:** [OPERATIONS.md](OPERATIONS.md).

---

## API Documentation (Swagger)

- Swagger UI (local): `http://localhost:3000/api-docs`
- OpenAPI spec (local): `http://localhost:3000/api-docs/v1/swagger.yaml`
- Setup and regeneration guide: `backend/SWAGGER_SETUP.md`

For production, expose `/api-docs` on your API host:
- Example: `https://<your-api-domain>/api-docs`

---

## API Endpoints (33)

### Authentication (8)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/signup` | No | Create account |
| POST | `/api/v1/auth/login` | No | Sign in, get JWT |
| GET | `/api/v1/auth/me` | Yes | Current user info |
| POST | `/api/v1/auth/forgot_password` | No | Request reset token |
| POST | `/api/v1/auth/reset_password` | No | Reset password |
| POST | `/api/v1/auth/mfa/setup` | Yes | Generate MFA secret |
| POST | `/api/v1/auth/mfa/verify` | Yes | Verify code, enable MFA |
| DELETE | `/api/v1/auth/mfa` | Yes | Disable MFA |

### Lists (10)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/lists` | Optional | Public lists (+ own) |
| GET | `/api/v1/lists/analytics` | Yes | Owner engagement analytics |
| GET | `/api/v1/lists/:id` | Optional | List with items |
| POST | `/api/v1/lists` | Yes | Create list |
| PATCH | `/api/v1/lists/:id` | Owner | Update list |
| DELETE | `/api/v1/lists/:id` | Owner | Delete list |
| POST | `/api/v1/lists/:id/share` | Owner | Generate share code |
| GET | `/api/v1/lists/shared/:code` | No | Lookup by share code |
| POST | `/api/v1/lists/:id/like` | Yes | Like list |
| DELETE | `/api/v1/lists/:id/like` | Yes | Unlike list |

### Items (5)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/lists/:list_id/items` | Optional | Items in list |
| GET | `/api/v1/items/:id` | Optional | Single item |
| POST | `/api/v1/lists/:list_id/items` | Owner | Add item |
| PATCH | `/api/v1/items/:id` | Owner | Update item |
| DELETE | `/api/v1/items/:id` | Owner | Delete item |

### Comments (3)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/lists/:list_id/comments` | Optional | List comments for public/shared list |
| POST | `/api/v1/lists/:list_id/comments` | Yes | Add comment |
| DELETE | `/api/v1/comments/:id` | Owner/List Owner | Delete comment |

> Note: list owners cannot like or comment on their own lists.

### Item Reactions (2)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/items/:id/like` | Yes | Like item |
| DELETE | `/api/v1/items/:id/like` | Yes | Unlike item |

### Attachments (5)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/lists/:list_id/attachments` | Optional | List attachments for a list |
| POST | `/api/v1/lists/:list_id/attachments` | Owner | Add list attachment |
| GET | `/api/v1/items/:item_id/attachments` | Optional | List attachments for an item |
| POST | `/api/v1/items/:item_id/attachments` | Owner | Add item attachment |
| DELETE | `/api/v1/attachments/:id` | Owner | Delete attachment |

> Additional rules:
> - private lists cannot be shared
> - attachment links must use `https://`
> - **note** attachments store sanitized text in `body`; **link** / **file** / **image** as before
> - attachment uploads support JPG/PNG/WEBP/PDF/TXT/ZIP up to 5MB
> - list/item UI: optional note **or** link **or** file (single form per list/item)

---

## Security

- **TLS/SSL** enforced in production (HSTS)
- **At-rest encryption** (AES-256-GCM via Rails ActiveRecord::Encryption)
- **Admin MFA** (TOTP-based two-factor authentication)
- **JWT authentication** (24h expiry, bcrypt password hashing)
- **Password reset** with secure tokens (1h expiry)
- **XSS prevention** (HTML sanitization)
- **Content moderation** (dictionary + slur-aware filtering for comments and item notes)
- **Rate limiting** (Rack::Attack)
- **User status management** (active/suspended/deleted)
- **Owner-based authorization** (IDOR prevention)
- **CORS** (environment-based origins)
- **Error boundary** (React crash recovery)
- **Network defense** (AWS WAF + CloudFront planned for production)

---

## Git Workflow

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases |
| `feature/frontend-init` | Frontend development |
| `deployment` | AWS deployment hardening and execution |

Never commit `docs/`, `.env`, or credentials.

---

## License

MIT
