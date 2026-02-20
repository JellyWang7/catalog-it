# CatalogIt Frontend

React frontend for the CatalogIt cataloging platform.

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

Runs at **http://localhost:5173** -- requires Rails backend on `:3000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

## Stack

React 18, Vite 4, React Router 6, Axios, Tailwind CSS 3, Headless UI, Heroicons, react-hot-toast

## Architecture

```
src/
├── components/   Layout (mobile nav), ErrorBoundary, StarRating, Modals, Skeletons
├── context/      AuthContext (login/signup/logout/token/MFA)
├── pages/        Home, Login (MFA step), Signup, ForgotPassword, ResetPassword,
│                 Explore, Dashboard, ListDetail, SharedList, Profile (MFA), 404
├── services/     api.js, auth.js (MFA), lists.js, items.js
├── hooks/        Custom hooks
└── utils/        Helpers
```

## Routes (11)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing page |
| `/explore` | Explore | Public lists with search + sort |
| `/lists/:id` | ListDetail | List + items + ratings + share |
| `/s/:code` | SharedList | Resolve share code |
| `/login` | Login | Sign in (with MFA step if enabled) |
| `/signup` | Signup | Register |
| `/forgot-password` | ForgotPassword | Request password reset |
| `/reset-password` | ResetPassword | Set new password |
| `/dashboard` | Dashboard | Search, filter, list CRUD + stats |
| `/profile` | Profile | User info, stats, MFA setup |
| `*` | NotFound | 404 |

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api/v1` | Backend API (proxied via Vite) |

> See [../FRONTEND_SETUP.md](../FRONTEND_SETUP.md) for full documentation.
