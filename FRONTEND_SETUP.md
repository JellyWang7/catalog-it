# CatalogIt Frontend Setup Guide

**Last Updated**: March 21, 2026  
**Branch**: `deployment`  
**Status**: 100% — Comments, likes, unified attachments (note/link/file), tests

---

## Prerequisites

- Node.js 18+ recommended (Node 16 currently works with pinned test tooling)
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
│   │   ├── Dashboard.jsx        # User dashboard (search, filter, CRUD, stats)
│   │   ├── ListDetail.jsx       # List + items + share + comments + likes + attachments
│   │   ├── SharedList.jsx       # /s/:code redirect
│   │   ├── Profile.jsx          # User profile + stats
│   │   └── NotFound.jsx         # 404
│   ├── services/
│   │   ├── api.js               # Axios + interceptors
│   │   ├── auth.js              # Auth API (signup/login/reset/MFA)
│   │   ├── lists.js             # Lists CRUD + share + comments + likes + attachments
│   │   └── items.js             # Items CRUD + item likes
│   ├── hooks/                   # Custom hooks
│   ├── utils/                   # Helpers
│   ├── test/                    # Vitest setup
│   └── e2e/                     # Playwright tests
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

## Routes (11)

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/` | Home | No | Landing page |
| `/explore` | Explore | No | Public lists with server-side search + sort |
| `/lists/:id` | ListDetail | No | List + items + ratings + share + comments/likes + attachments |
| `/s/:code` | SharedList | No | Resolve share code |
| `/login` | Login | No | Sign in |
| `/signup` | Signup | No | Register |
| `/forgot-password` | ForgotPassword | No | Request reset |
| `/reset-password` | ResetPassword | No | New password |
| `/dashboard` | Dashboard | Yes | Server-side search/filter, list CRUD + engagement stats |
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
| **ListFormModal** | Create/edit list modal (title, description, visibility) |
| **ItemFormModal** | Create/edit item modal (name, category, notes, rating) |
| **ConfirmModal** | Confirmation dialog (danger variant) |
| **ListCardSkeleton** | Animated loading placeholder |

---

## Key Features

### Authentication
- Login / Signup with form validation
- Login with MFA step (TOTP OTP code input when MFA enabled)
- JWT stored in localStorage, attached via Axios interceptor
- 401 responses clear auth only when needed; public routes remain accessible for guests
- Forgot password -> email -> reset token -> new password

### Dashboard
- Stats cards (total lists, public lists, total items, comments received, reactions received)
- Server-side search/filter via API (`owner_only=true`, `search`, `visibility`)
- Create, edit, delete lists via modals
- Color-coded cards by visibility

### Explore
- Public list grid with server-side search + sorting via API (`public_only=true`)
- Sort by newest, oldest, A-Z, Z-A, most items
- Loading skeletons, empty state, count badge

### List Detail
- Items displayed with star ratings
- Add/edit/delete items via modals
- Share button generates short URL (`/s/:code`) for non-private lists
- Comments on public/shared lists
- "Thumbs up / I like it" reactions for lists and items
- List-level attachments: one form with optional **text note**, **https link**, or **file** (plus optional label)
- Item-level attachments: same pattern per item (owner add/delete; previews for image/audio/link/file/note)
- Comment moderation: comment owner or list owner can delete
- List owners cannot like or comment on their own lists
- 422 moderation errors are surfaced with clean, user-friendly warnings
- Owner vs. visitor views

### Profile
- Avatar initials, username, email
- Role badge, status badge
- Stats cards (lists, public, items)
- MFA setup (enable TOTP, verify code, disable)

---

## API Service Layer

### Base Config (`services/api.js`)
- Base URL: `/api/v1` (proxied via Vite to Rails)
- Request interceptor: JWT token from localStorage
- Response interceptor: 401 -> clear auth, redirect

### Auth (`services/auth.js`)
`signup`, `login`, `me`, `forgotPassword`, `resetPassword`, `mfaSetup`, `mfaVerify`, `mfaDisable`

### Lists (`services/lists.js`)
`getAll`, `getAnalytics`, `getById`, `create`, `update`, `delete`, `share`, `getByShareCode`, `getComments`, `addComment`, `deleteComment`, `getAttachments`, `createAttachment`, `deleteAttachment`, `like`, `unlike`

### Items (`services/items.js`)
`getByListId`, `getById`, `create`, `update`, `delete`, `getAttachments`, `createAttachment`, `like`, `unlike`

---

## Testing

### Scripts

```bash
cd frontend
npm run test        # Vitest (UI/component tests)
npm run test:e2e    # Playwright end-to-end tests
npm run build       # Production build verification
```

### Coverage Focus

- UI tests: likes, comments, attachments, permissions, unauthenticated behavior
- E2E tests: list/item likes + comment interactions + attachment flows + auth-aware UX
- CI workflow on PRs: `.github/workflows/frontend-tests.yml`

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

- [x] Server-side search/filter API
- [x] Engagement analytics views (comments/reactions counts)
- [ ] Deployment (Netlify + Render)
