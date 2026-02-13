# CatalogIt Frontend

React frontend for the CatalogIt cataloging platform.

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

Runs at **http://localhost:5173** -- requires the Rails backend on `:3000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

## Stack

- **React 18** + **Vite 4** -- fast dev/build
- **React Router 6** -- client-side routing
- **Axios** -- API client with JWT interceptors
- **Tailwind CSS 3** -- utility-first styling
- **Headless UI** -- accessible dropdowns, modals
- **Heroicons** -- SVG icon set
- **react-hot-toast** -- toast notifications

## Architecture

```
src/
├── components/      Layout, ProtectedRoute, StarRating, Modals, Skeletons
├── context/         AuthContext (login/signup/logout/token verification)
├── pages/           Home, Login, Signup, ForgotPassword, ResetPassword,
│                    Explore, Dashboard, ListDetail, SharedList, 404
├── services/        api.js, auth.js, lists.js, items.js
├── hooks/           Custom hooks
└── utils/           Helpers
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing hero + feature cards |
| `/explore` | Explore | Public list grid with search + loading skeletons |
| `/lists/:id` | ListDetail | List view + star ratings + item CRUD + share |
| `/s/:code` | SharedList | Resolves share code, redirects to list |
| `/login` | Login | Email/password auth form |
| `/signup` | Signup | Registration form |
| `/forgot-password` | ForgotPassword | Request password reset |
| `/reset-password` | ResetPassword | Set new password with token |
| `/dashboard` | Dashboard | User's lists, stats cards, create/edit/delete |
| `*` | NotFound | 404 page |

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api/v1` | Backend API base URL (proxied via Vite) |

> See [../FRONTEND_SETUP.md](../FRONTEND_SETUP.md) for full documentation.
