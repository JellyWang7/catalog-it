# CatalogIt Frontend Setup Guide

**Last Updated**: February 9, 2026  
**Branch**: `feature/frontend-init`  
**Status**: Core frontend complete — Auth, CRUD, list details, item management

---

## Prerequisites

- Node.js 16+ (tested on v16.14.0; 18+ recommended)
- npm 8+
- Backend Rails API running on `http://localhost:3000`

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**.

> Make sure the Rails backend is running first: `cd backend && bundle exec puma`

---

## Project Structure

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Layout.jsx           # Shared navbar + footer (Outlet)
│   │   ├── ProtectedRoute.jsx   # Auth guard for protected pages
│   │   ├── StarRating.jsx       # 1-5 star display with color coding
│   │   ├── ListFormModal.jsx    # Create/edit list modal form
│   │   ├── ItemFormModal.jsx    # Create/edit item modal form
│   │   ├── ConfirmModal.jsx     # Generic confirmation dialog
│   │   └── ListCardSkeleton.jsx # Loading skeleton for list grids
│   ├── context/                 # React Context providers
│   │   └── AuthContext.jsx      # Auth state (login/signup/logout/me)
│   ├── hooks/                   # Custom React hooks
│   ├── pages/                   # Route-level page components
│   │   ├── Home.jsx             # Landing page (hero + features)
│   │   ├── Login.jsx            # Login form
│   │   ├── Signup.jsx           # Registration form
│   │   ├── Explore.jsx          # Browse public lists (search, skeletons)
│   │   ├── Dashboard.jsx        # User dashboard (CRUD, stats)
│   │   ├── ListDetail.jsx       # List view + item management
│   │   └── NotFound.jsx         # 404 page
│   ├── services/                # API service modules
│   │   ├── api.js               # Axios instance + interceptors
│   │   ├── auth.js              # Auth endpoints (signup/login/me)
│   │   ├── lists.js             # Lists CRUD
│   │   └── items.js             # Items CRUD
│   ├── utils/                   # Utility functions
│   ├── App.jsx                  # Router + route definitions
│   ├── main.jsx                 # React entry point
│   └── index.css                # Tailwind directives + Inter font
├── .env                         # Local env vars (NOT committed)
├── .env.example                 # Template for .env
├── tailwind.config.js           # Tailwind theme (deep-blue, teal)
├── postcss.config.js            # PostCSS + Autoprefixer
├── vite.config.js               # Vite config + API proxy
└── package.json
```

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | ^4.5.5 | Build tool / dev server |
| React | ^18.3.1 | UI library |
| React Router DOM | ^6.28.0 | Client-side routing |
| Axios | ^1.7.0 | HTTP client |
| Tailwind CSS | ^3.4.0 | Utility-first CSS |
| Headless UI | ^1.7.19 | Accessible UI components |
| Heroicons | ^2.1.5 | SVG icons |
| react-hot-toast | ^2.4.1 | Toast notifications |

---

## Environment Variables

Copy the example file and customize:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000/api/v1` | Backend API base URL |

> **IMPORTANT**: `.env` is in `.gitignore` and must NEVER be committed.

---

## Routes

| Path | Component | Auth Required | Description |
|------|-----------|---------------|-------------|
| `/` | Home | No | Landing page with hero + features |
| `/explore` | Explore | No | Browse public lists with search |
| `/lists/:id` | ListDetail | No | List details + item management (owner) |
| `/login` | Login | No | Sign in form |
| `/signup` | Signup | No | Registration form |
| `/dashboard` | Dashboard | Yes | User's lists with full CRUD |
| `*` | NotFound | No | 404 page |

---

## Components

### Pages

| Component | Features |
|-----------|----------|
| **Home** | Hero section, feature cards, CTA |
| **Login** | Email/password form, error toasts, redirect to dashboard |
| **Signup** | Username/email/password form with confirmation |
| **Explore** | Public list grid, search filter, skeleton loading, empty states |
| **Dashboard** | User's lists, stats cards, create/edit/delete list modals |
| **ListDetail** | List header, item catalog with ratings, add/edit/delete items |
| **NotFound** | 404 with home link |

### Shared Components

| Component | Purpose |
|-----------|---------|
| **Layout** | Top navbar with auth state, footer, `<Outlet>` |
| **ProtectedRoute** | Redirects to `/login` if not authenticated |
| **StarRating** | Renders 1-5 stars with color coding (green/yellow/red) |
| **ListFormModal** | Create or edit a list (title, description, visibility) |
| **ItemFormModal** | Create or edit an item (name, category, rating, notes) |
| **ConfirmModal** | Generic yes/no confirmation with danger variant |
| **ListCardSkeleton** | Animated loading placeholder for list grids |

---

## API Service Layer

### Axios Instance (`services/api.js`)

- **Base URL**: Read from `VITE_API_URL` environment variable
- **Request interceptor**: Attaches `Authorization: Bearer <token>` from `localStorage`
- **Response interceptor**: On `401`, clears stored auth and redirects to `/login`

### Auth Service (`services/auth.js`)

```javascript
authService.signup({ username, email, password, password_confirmation })
authService.login({ email, password })
authService.me()  // requires valid token
```

### Lists Service (`services/lists.js`)

```javascript
listsService.getAll()              // GET /lists
listsService.getById(id)           // GET /lists/:id
listsService.create(data)          // POST /lists
listsService.update(id, data)      // PATCH /lists/:id
listsService.delete(id)            // DELETE /lists/:id
```

### Items Service (`services/items.js`)

```javascript
itemsService.getByListId(listId)       // GET /lists/:listId/items
itemsService.getById(id)               // GET /items/:id
itemsService.create(listId, data)      // POST /lists/:listId/items
itemsService.update(id, data)          // PATCH /items/:id
itemsService.delete(id)                // DELETE /items/:id
```

---

## Auth Context

The `AuthContext` provides authentication state to the entire app:

- **`user`** — current user object (`{ id, username, email, role, status }`)
- **`token`** — JWT string
- **`isAuthenticated`** — boolean
- **`loading`** — true while verifying stored token on mount
- **`login(credentials)`** — authenticate and store token
- **`signup(data)`** — register and store token
- **`logout()`** — clear token and user

Usage in any component:

```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  // ...
}
```

---

## Tailwind Theme

Custom colors matching the UI mockups:

| Token | Hex | Usage |
|-------|-----|-------|
| `deep-blue` | `#0d47a1` | Primary brand color, nav, buttons |
| `teal` | `#00897b` | Accent color, highlights |

Both include a full shade scale (50-900) in `tailwind.config.js`.

---

## Vite Dev Proxy

The Vite config proxies `/api` requests to the Rails backend during development:

```javascript
// vite.config.js
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
},
```

---

## Seed Data (for demo)

After running `rails db:seed`, the following test accounts are available:

| User | Email | Password | Role |
|------|-------|----------|------|
| admin | admin@catalogit.com | password123 | admin |
| movie_buff | movies@example.com | password123 | user |
| bookworm | books@example.com | password123 | user |
| collector | collector@example.com | password123 | user |
| banned_user | banned@example.com | password123 | suspended |

---

## What's Next

- [ ] End-to-end testing with backend
- [ ] Search and filter across lists
- [ ] Responsive design refinements
- [ ] Component tests (Vitest)
- [ ] Deployment (Netlify for frontend)
