# CatalogIt

> A web application for creating, rating, and sharing personal catalogs (movies, books, collectibles, and more).

**Course**: CS701  
**Status**: Backend Complete | Frontend Core Complete  
**Tests**: 175/175 passing  

---

## Quick Links

| Document | Purpose |
|----------|---------|
| [FRONTEND_SETUP.md](FRONTEND_SETUP.md) | Frontend setup & component guide |
| [WEEKLY_PLAN.md](WEEKLY_PLAN.md) | Week-by-week roadmap |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Detailed status & compliance |
| [DEPLOY_PLAN.md](DEPLOY_PLAN.md) | Deployment guide (Render + Netlify) |
| [backend/AUTHENTICATION.md](backend/AUTHENTICATION.md) | JWT auth + password reset guide |
| [backend/TESTING.md](backend/TESTING.md) | Testing guide (175 tests) |

---

## Tech Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| **Frontend** | React 18, Vite 4, Tailwind CSS 3, React Router 6, Axios | Core Complete |
| **Backend** | Ruby on Rails 8 (API mode), JWT, RSpec | Complete |
| **Database** | PostgreSQL 15+ (3NF) | Complete |
| **Security** | XSS prevention, rate limiting, CORS, user status | Complete |
| **Deployment** | Render + Netlify (free tier) | Planned |

---

## Project Structure

```
catalog-it/
├── backend/              # Rails 8 API
│   ├── app/
│   │   ├── controllers/  # Auth, Lists, Items controllers
│   │   ├── models/       # User, List, Item
│   │   └── services/     # JWT encoder/decoder
│   ├── spec/             # RSpec tests (175 passing)
│   ├── config/           # CORS, rate limiting, routes
│   └── swagger/          # OpenAPI spec
├── frontend/             # React + Vite app
│   ├── src/
│   │   ├── components/   # Layout, StarRating, Modals, Skeletons
│   │   ├── context/      # AuthContext
│   │   ├── pages/        # Home, Login, Signup, ForgotPassword, ResetPassword,
│   │   │                 # Explore, Dashboard, ListDetail, SharedList, 404
│   │   ├── services/     # Axios API client (auth, lists, items)
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Helpers
│   └── vite.config.js
├── docs/                 # Design documents (NOT in git)
├── FRONTEND_SETUP.md
├── WEEKLY_PLAN.md
├── PROJECT_STATUS.md
├── DEPLOY_PLAN.md
└── README.md             # This file
```

---

## Quick Start

### Prerequisites

- Ruby 3.x+ / Rails 8+
- Node.js 16+ / npm 8+
- PostgreSQL 15+

### Backend

```bash
cd backend
bundle install
cp config/database.yml.example config/database.yml
# Edit database.yml with your PostgreSQL credentials
rails db:create db:migrate db:seed
bundle exec puma -p 3000
```

API: **http://localhost:3000** | Swagger: **http://localhost:3000/api-docs**

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: **http://localhost:5173**

### Run Tests

```bash
cd backend && RAILS_ENV=test bundle exec rspec
```

### Demo Accounts (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@catalogit.com | password123 | admin |
| movies@example.com | password123 | user |
| books@example.com | password123 | user |
| collector@example.com | password123 | user |

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/signup` | Create account | No |
| POST | `/api/v1/auth/login` | Sign in, get JWT | No |
| GET | `/api/v1/auth/me` | Current user info | Yes |
| POST | `/api/v1/auth/forgot_password` | Request password reset | No |
| POST | `/api/v1/auth/reset_password` | Reset password with token | No |

### Lists

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/lists` | Public lists (+ own if auth'd) | Optional |
| GET | `/api/v1/lists/:id` | List with items | Optional |
| POST | `/api/v1/lists` | Create list | Yes |
| PATCH | `/api/v1/lists/:id` | Update list (owner) | Yes |
| DELETE | `/api/v1/lists/:id` | Delete list (owner) | Yes |
| POST | `/api/v1/lists/:id/share` | Generate share link | Yes |
| GET | `/api/v1/lists/shared/:code` | Look up by share code | No |

### Items

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/lists/:list_id/items` | Items in list | Optional |
| GET | `/api/v1/items/:id` | Single item | Optional |
| POST | `/api/v1/lists/:list_id/items` | Add item (owner) | Yes |
| PATCH | `/api/v1/items/:id` | Update item (owner) | Yes |
| DELETE | `/api/v1/items/:id` | Delete item (owner) | Yes |

---

## Current Status

| Feature | Status |
|---------|--------|
| Database schema (3NF) | Complete |
| JWT authentication + password reset | Complete |
| Authorization (owner-based CRUD) | Complete |
| Security (XSS, rate limiting, CORS) | Complete |
| Backend tests (175 passing) | Complete |
| API docs (Swagger) | Complete |
| Frontend setup + routing | Complete |
| Auth UI (login, signup, forgot/reset password) | Complete |
| Public list browsing (Explore + search) | Complete |
| List detail + star ratings | Complete |
| User dashboard + list CRUD | Complete |
| Item management (add/edit/delete) | Complete |
| Share list (short URL) | Complete |
| Seed data (5 users, 10 lists, 50+ items) | Complete |
| Deployment | Planned |

---

## Security

- JWT authentication (24h expiry, bcrypt)
- Password reset with secure tokens (1h expiry)
- XSS prevention (HTML sanitization)
- Rate limiting (Rack::Attack)
- User status management (active/suspended/deleted)
- Owner-based authorization (IDOR prevention)
- CORS (environment-based origins)

---

## Git Workflow

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases |
| `added-auth` | Backend + authentication |
| `security-compliance-fixes` | Security hardening |
| `feature/frontend-init` | Frontend development (current) |

Never commit `docs/`, `.env`, or credentials.

---

## License

MIT
