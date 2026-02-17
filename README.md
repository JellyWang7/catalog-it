# CatalogIt

> A web application for creating, rating, and sharing personal catalogs (movies, books, collectibles, and more).

**Course**: CS701  
**Status**: Backend Complete | Frontend 85%  
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
| **Frontend** | React 18, Vite 4, Tailwind CSS 3, React Router 6, Axios | 85% |
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
│   └── swagger/          # OpenAPI spec
├── frontend/             # React + Vite app
│   ├── src/
│   │   ├── components/   # Layout, ErrorBoundary, StarRating, Modals, Skeletons
│   │   ├── context/      # AuthContext
│   │   ├── pages/        # Home, Login, Signup, ForgotPassword, ResetPassword,
│   │   │                 # Explore, Dashboard, ListDetail, SharedList, Profile, 404
│   │   ├── services/     # Axios API client (auth, lists, items)
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Helpers
│   └── vite.config.js
├── docs/                 # Design documents (NOT in git)
└── *.md                  # Project documentation
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

### Demo Accounts (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@catalogit.com | password123 | admin |
| movies@example.com | password123 | user |
| books@example.com | password123 | user |
| collector@example.com | password123 | user |

---

## API Endpoints (17)

### Authentication

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/v1/auth/signup` | No |
| POST | `/api/v1/auth/login` | No |
| GET | `/api/v1/auth/me` | Yes |
| POST | `/api/v1/auth/forgot_password` | No |
| POST | `/api/v1/auth/reset_password` | No |

### Lists

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/v1/lists` | Optional |
| GET | `/api/v1/lists/:id` | Optional |
| POST | `/api/v1/lists` | Yes |
| PATCH | `/api/v1/lists/:id` | Owner |
| DELETE | `/api/v1/lists/:id` | Owner |
| POST | `/api/v1/lists/:id/share` | Owner |
| GET | `/api/v1/lists/shared/:code` | No |

### Items

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/v1/lists/:list_id/items` | Optional |
| GET | `/api/v1/items/:id` | Optional |
| POST | `/api/v1/lists/:list_id/items` | Owner |
| PATCH | `/api/v1/items/:id` | Owner |
| DELETE | `/api/v1/items/:id` | Owner |

---

## Security

- JWT authentication (24h expiry, bcrypt)
- Password reset with secure tokens (1h expiry)
- XSS prevention (HTML sanitization)
- Rate limiting (Rack::Attack)
- User status management (active/suspended/deleted)
- Owner-based authorization (IDOR prevention)
- CORS (environment-based origins)
- Error boundary (React crash recovery)

---

## Git Workflow

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases |
| `feature/frontend-init` | Frontend development (current) |

Never commit `docs/`, `.env`, or credentials.

---

## License

MIT
