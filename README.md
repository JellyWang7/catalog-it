# CatalogIt

A production-ready web application for creating, rating, and sharing personal catalogs (movies, books, collectibles, and more).

**Course: CS701**

## Tech Stack

- **Frontend:** React 18 (Vite 4) + Tailwind CSS 3 + React Router 6
- **Backend:** Ruby on Rails 8 (API Mode)
- **Database:** PostgreSQL
- **Auth:** JWT (bcrypt + 24h token expiry)
- **Deployment:** AWS Free Tier (Dockerized)

## Project Structure

```
catalog-it/
├── backend/              # Rails 8 API (PostgreSQL, JWT auth)
│   ├── app/
│   │   ├── controllers/  # API v1 controllers
│   │   ├── models/       # User, List, Item
│   │   └── services/     # JWT encoder/decoder
│   ├── spec/             # RSpec tests (175 passing)
│   └── swagger/          # OpenAPI spec
├── frontend/             # React + Vite app
│   ├── src/
│   │   ├── components/   # Layout, ProtectedRoute
│   │   ├── context/      # AuthContext
│   │   ├── pages/        # Home, Login, Signup, Explore, Dashboard, 404
│   │   ├── services/     # Axios API client (auth, lists, items)
│   │   ├── hooks/        # Custom hooks (planned)
│   │   └── utils/        # Utilities (planned)
│   └── vite.config.js
├── docs/                 # Design documents & UI mockups (NOT in git)
├── docker-compose.yml    # Docker orchestration
├── FRONTEND_SETUP.md     # Frontend setup guide
└── README.md             # This file
```

## Setup Instructions

### Prerequisites

- Ruby 3.x+ and Rails 8+
- Node.js 16+ and npm 8+
- PostgreSQL 15+

### Backend Setup

```bash
cd backend
bundle install

# Configure database
cp config/database.yml.example config/database.yml
# Edit config/database.yml with your PostgreSQL credentials

# Create and seed database
rails db:create db:migrate db:seed

# Start the API server
bundle exec puma
```

The API will be available at **http://localhost:3000**

API docs (Swagger): **http://localhost:3000/api-docs**

### Frontend Setup

```bash
cd frontend
cp .env.example .env    # Configure API URL
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

> See [FRONTEND_SETUP.md](FRONTEND_SETUP.md) for detailed frontend documentation.

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/signup` | Create account | No |
| POST | `/api/v1/auth/login` | Sign in, get JWT | No |
| GET | `/api/v1/auth/me` | Current user info | Yes |

### Lists

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/lists` | All public lists (+ own if authenticated) | Optional |
| GET | `/api/v1/lists/:id` | Get list with items | Optional |
| POST | `/api/v1/lists` | Create a new list | Yes |
| PATCH | `/api/v1/lists/:id` | Update a list (owner only) | Yes |
| DELETE | `/api/v1/lists/:id` | Delete a list (owner only) | Yes |

### Items

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/lists/:list_id/items` | Items in a list | Optional |
| GET | `/api/v1/items/:id` | Single item | Optional |
| POST | `/api/v1/lists/:list_id/items` | Add item to list (owner only) | Yes |
| PATCH | `/api/v1/items/:id` | Update item (owner only) | Yes |
| DELETE | `/api/v1/items/:id` | Delete item (owner only) | Yes |

> Full OpenAPI spec: `backend/swagger/v1/swagger.yaml`
> See also: [backend/AUTHENTICATION.md](backend/AUTHENTICATION.md)

---

## Environment Variables

### Backend

| Variable | Description |
|----------|-------------|
| `DATABASE_USERNAME` | PostgreSQL username |
| `RAILS_MASTER_KEY` | Rails credentials key |
| `CORS_ORIGINS` | Allowed frontend origins |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000/api/v1` | Backend API base URL |

> **NEVER** commit `.env`, `database.yml`, or `master.key` to version control.

---

## Testing

### Backend (RSpec)

```bash
cd backend
bundle exec rspec
# 175 tests, 100% passing
```

### Frontend

```bash
cd frontend
npm run dev   # Dev server with HMR
npm run build # Production build
```

---

## Current Status

| Component | Status | Details |
|-----------|--------|---------|
| Database schema | Complete | Users, Lists, Items (3NF) |
| JWT authentication | Complete | Signup, login, token expiry |
| Authorization | Complete | Owner-based CRUD, public/private |
| Security hardening | Complete | XSS prevention, rate limiting, CORS |
| Backend tests | Complete | 175 tests passing |
| API docs (Swagger) | Complete | Interactive at `/api-docs` |
| Frontend setup | Complete | Vite + React + Tailwind + routing |
| Auth UI | Complete | Login, Signup pages + AuthContext |
| Public list browsing | In Progress | Explore page connected to API |
| User dashboard | In Progress | Protected route, placeholder UI |
| List/Item CRUD UI | Planned | Week 3-4 |
| Deployment | Planned | Week 5 |

---

## Git Workflow

- **`main`** — stable releases
- **`added-auth`** — backend + authentication
- **`feature/frontend-init`** — frontend setup (current)
- Never commit `docs/`, `.env`, or credentials

## License

MIT
