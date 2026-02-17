# CatalogIt Frontend Setup Guide

**Last Updated**: February 10, 2026  
**Branch**: `feature/frontend-init`  
**Status**: 85% -- auth, CRUD, sharing, password reset, profile, mobile nav, sorting

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

App: **http://localhost:5173** (backend must be running on `:3000`)

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx           # Navbar (mobile hamburger) + footer
│   │   ├── ProtectedRoute.jsx   # Auth guard
│   │   ├── ErrorBoundary.jsx    # React crash recovery
│   │   ├── StarRating.jsx       # 1-5 star display
│   │   ├── ListFormModal.jsx    # Create/edit list modal
│   │   ├── ItemFormModal.jsx    # Create/edit item modal
│   │   ├── ConfirmModal.jsx     # Confirmation dialog
│   │   └── ListCardSkeleton.jsx # Loading skeleton
│   ├── context/
│   │   └── AuthContext.jsx      # Auth state management
│   ├── pages/
│   │   ├── Home.jsx             # Landing page
│   │   ├── Login.jsx            # Login + forgot password link
│   │   ├── Signup.jsx           # Registration
│   │   ├── ForgotPassword.jsx   # Request reset token
│   │   ├── ResetPassword.jsx    # Set new password
│   │   ├── Explore.jsx          # Public lists (search + sort)
│   │   ├── Dashboard.jsx        # User dashboard (CRUD, stats)
│   │   ├── ListDetail.jsx       # List + items + share
│   │   ├── SharedList.jsx       # /s/:code redirect
│   │   ├── Profile.jsx          # User profile + stats
│   │   └── NotFound.jsx         # 404
│   ├── services/
│   │   ├── api.js               # Axios + interceptors
│   │   ├── auth.js              # Auth API (signup/login/reset)
│   │   ├── lists.js             # Lists CRUD + share
│   │   └── items.js             # Items CRUD
│   ├── hooks/                   # Custom hooks
│   ├── utils/                   # Helpers
│   ├── App.jsx                  # Router + ErrorBoundary
│   ├── main.jsx                 # Entry point
│   └── index.css                # Tailwind + Inter font
├── .env                         # NOT committed
├── .env.example
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
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
| Headless UI | ^1.7.19 | Accessible components |
| Heroicons | ^2.1.5 | SVG icons |
| react-hot-toast | ^2.4.1 | Toast notifications |

---

## Routes (11)

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/` | Home | No | Landing page |
| `/explore` | Explore | No | Public lists with search + sort |
| `/lists/:id` | ListDetail | No | List + items + share button |
| `/s/:code` | SharedList | No | Resolve share code |
| `/login` | Login | No | Sign in |
| `/signup` | Signup | No | Register |
| `/forgot-password` | ForgotPassword | No | Request reset |
| `/reset-password` | ResetPassword | No | New password |
| `/dashboard` | Dashboard | Yes | List CRUD + stats |
| `/profile` | Profile | Yes | User info + stats |
| `*` | NotFound | No | 404 |

---

## Components (8)

| Component | Purpose |
|-----------|---------|
| **Layout** | Responsive navbar with hamburger menu, footer |
| **ProtectedRoute** | Redirects to `/login` if not authenticated |
| **ErrorBoundary** | Catches React errors, shows recovery UI |
| **StarRating** | Renders 1-5 color-coded stars |
| **ListFormModal** | Create/edit list modal |
| **ItemFormModal** | Create/edit item modal |
| **ConfirmModal** | Confirmation dialog (danger variant) |
| **ListCardSkeleton** | Animated loading placeholder |

---

## API Service Layer

### Base Config (`services/api.js`)
- Base URL: `/api/v1` (proxied via Vite to Rails)
- Request interceptor: JWT token from localStorage
- Response interceptor: 401 -> clear auth, redirect to login

### Auth (`services/auth.js`)
`signup`, `login`, `me`, `forgotPassword`, `resetPassword`

### Lists (`services/lists.js`)
`getAll`, `getById`, `create`, `update`, `delete`, `share`, `getByShareCode`

### Items (`services/items.js`)
`getByListId`, `getById`, `create`, `update`, `delete`

---

## Tailwind Theme

| Token | Hex | Usage |
|-------|-----|-------|
| `deep-blue` | `#0d47a1` | Primary brand, nav, buttons |
| `teal` | `#00897b` | Accent, highlights |

---

## Seed Accounts

| User | Email | Password |
|------|-------|----------|
| admin | admin@catalogit.com | password123 |
| movie_buff | movies@example.com | password123 |
| bookworm | books@example.com | password123 |
| collector | collector@example.com | password123 |

---

## What's Next

- [ ] Server-side search/filter
- [ ] Component tests (Vitest)
- [ ] Deployment (Netlify + Render)
