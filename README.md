# CatalogIt

> A web application for creating, rating, and sharing personal catalogs (movies, books, collectibles, and more).

**Course**: CS 701 -- Special Projects in CS II  
**Status**: Backend Complete | Frontend 90% | Midterm Ready  
**Tests**: 175/175 passing  

---

## Quick Links

| Document | Purpose |
|----------|---------|
| [FRONTEND_SETUP.md](FRONTEND_SETUP.md) | Frontend architecture & component guide |
| [WEEKLY_PLAN.md](WEEKLY_PLAN.md) | Week-by-week roadmap & progress |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Detailed status & compliance |
| [DEPLOY_PLAN.md](DEPLOY_PLAN.md) | Deployment guide (Render + Netlify) |
| [backend/AUTHENTICATION.md](backend/AUTHENTICATION.md) | JWT auth + password reset guide |
| [backend/TESTING.md](backend/TESTING.md) | Testing guide (175 tests) |

---

## Tech Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| **Frontend** | React 18, Vite 4, Tailwind CSS 3, React Router 6, Axios | 90% |
| **Backend** | Ruby on Rails 8 (API mode), JWT, RSpec | Complete |
| **Database** | PostgreSQL 15+ (3NF) | Complete |
| **Security** | XSS prevention, rate limiting, CORS, user status | Complete |
| **Deployment** | Render + Netlify (planned) | 0% |

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

### Authentication (5)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/signup` | No | Create account |
| POST | `/api/v1/auth/login` | No | Sign in, get JWT |
| GET | `/api/v1/auth/me` | Yes | Current user info |
| POST | `/api/v1/auth/forgot_password` | No | Request reset token |
| POST | `/api/v1/auth/reset_password` | No | Reset password |

### Lists (7)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/lists` | Optional | Public lists (+ own) |
| GET | `/api/v1/lists/:id` | Optional | List with items |
| POST | `/api/v1/lists` | Yes | Create list |
| PATCH | `/api/v1/lists/:id` | Owner | Update list |
| DELETE | `/api/v1/lists/:id` | Owner | Delete list |
| POST | `/api/v1/lists/:id/share` | Owner | Generate share code |
| GET | `/api/v1/lists/shared/:code` | No | Lookup by share code |

### Items (5)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/lists/:list_id/items` | Optional | Items in list |
| GET | `/api/v1/items/:id` | Optional | Single item |
| POST | `/api/v1/lists/:list_id/items` | Owner | Add item |
| PATCH | `/api/v1/items/:id` | Owner | Update item |
| DELETE | `/api/v1/items/:id` | Owner | Delete item |

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

## Demo Walkthrough

1. **Home page** -- Hero section with feature cards
2. **Sign Up** -- Create a new account
3. **Login** -- Sign in with credentials
4. **Dashboard** -- View stats, search/filter lists, CRUD operations
5. **Create List** -- Modal form with title, description, visibility
6. **List Detail** -- Add/edit/delete items with ratings (1-5 stars)
7. **Share List** -- Generate short URL, copy to clipboard
8. **Explore** -- Browse public lists with search + sort
9. **Profile** -- View user info, role, status, stats
10. **Forgot Password** -- Request reset, receive token
11. **Mobile** -- Responsive hamburger menu

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
