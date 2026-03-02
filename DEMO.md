# CatalogIt - Demo Guide

**Date**: March 2, 2026
**Branch**: `midterm-demo`

---

## 1. Start the App

Open **two terminal tabs** and run:

```bash
# Terminal 1 — Backend API
cd backend
bundle install
rails db:migrate
rails db:seed    # only if DB is empty
bundle exec puma -p 3000
```

```bash
# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

**URLs**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api-docs

---

## 2. Show the Database (DBeaver)

Connect to `catalogit_development` in DBeaver, then run these queries in a SQL Editor tab.

### Show all tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Show table columns

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'lists' ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'items' ORDER BY ordinal_position;
```

### Show all users

```sql
SELECT id, username, email, role, status FROM users ORDER BY id;
```

### Show all lists with owners and item counts

```sql
SELECT l.id, l.title, l.visibility, u.username AS owner,
       COUNT(i.id) AS items
FROM lists l
JOIN users u ON l.user_id = u.id
LEFT JOIN items i ON i.list_id = l.id
GROUP BY l.id, l.title, l.visibility, u.username
ORDER BY l.id;
```

### Show items with ratings

```sql
SELECT i.name, i.category, i.rating, l.title AS list
FROM items i
JOIN lists l ON i.list_id = l.id
ORDER BY l.id, i.id
LIMIT 15;
```

### 3NF proof — no redundant data

```sql
-- Users have unique emails and usernames
SELECT COUNT(*) AS total, COUNT(DISTINCT email) AS unique_emails,
       COUNT(DISTINCT username) AS unique_names FROM users;

-- Foreign keys enforced
SELECT tc.constraint_name, tc.table_name, kcu.column_name,
       ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

## 3. Test the API (Swagger UI)

Open **http://localhost:3000/api-docs** in your browser.

### Step 1 — Login and copy JWT token

1. Expand **POST /api/v1/auth/login**
2. Click **Try it out**
3. Use this request body:
   ```json
   {
     "user": {
       "email": "movies@example.com",
       "password": "password123"
     }
   }
   ```
4. Click **Execute** — copy the `token` from the response

### Step 2 — Authorize Swagger

1. Click the **Authorize** button (lock icon, top right)
2. Paste: `Bearer <your-token>`
3. Click **Authorize**, then **Close**

### Step 3 — Browse public lists

1. Expand **GET /api/v1/lists**
2. Click **Try it out** → **Execute**
3. Show the JSON response with public lists, owners, and items

### Step 4 — Create a list (authenticated)

1. Expand **POST /api/v1/lists**
2. Click **Try it out**
3. Use this request body:
   ```json
   {
     "list": {
       "title": "Demo List",
       "description": "Created live via Swagger",
       "visibility": "public"
     }
   }
   ```
4. Click **Execute** — show the 200 response with the new list

### Step 5 — Show all 28 endpoints

Scroll through Swagger to highlight all endpoint groups:
- **Authentication (8)** — signup, login, me, forgot/reset password, MFA setup/verify/disable
- **Lists (10)** — CRUD + share + shared lookup + list like/unlike + analytics
- **Items (7)** — CRUD + item like/unlike
- **Comments (3)** — list comments + delete

---

## 4. Run Tests

```bash
cd backend
RAILS_ENV=test bundle exec rspec spec/models spec/requests spec/services
# core backend specs
```

```bash
cd frontend
npm run test
npm run test:e2e
# frontend UI + E2E checks
```

---

## 5. Frontend Build

```bash
cd frontend
npm run build
# 435 modules, 0 errors
```

---

## 6. Demo Walkthrough (UI)

Open http://localhost:5173 and walk through:

| Step | Page | What to Show |
|------|------|-------------|
| 1 | **Home** (`/`) | Hero section, feature cards, CTA button |
| 2 | **Sign Up** (`/signup`) | Create a new account, form validation |
| 3 | **Login** (`/login`) | Sign in with `movies@example.com` / `password123` |
| 4 | **Dashboard** (`/dashboard`) | Stats cards, search bar, visibility filter, list cards |
| 5 | **Create List** | Click "+ New List", fill modal (title, description, public) |
| 6 | **List Detail** (`/lists/:id`) | Click a list, show items with star ratings |
| 7 | **Add Item** | Click "+ Add Item", fill name/category/rating/notes |
| 8 | **Share List** | Click "Share" button, short URL copied to clipboard |
| 9 | **List Interactions** (`/lists/:id`) | Like list, like item, add comment, delete own comment |
| 9a | **Moderation** (`/lists/:id`) | Try profanity/slur text in comment or item notes and show 422 clean warning |
| 10 | **Explore** (`/explore`) | Public list grid, search, sort dropdown (5 options) |
| 11 | **Profile** (`/profile`) | Avatar, role badge, status, stats cards, MFA section |
| 12 | **MFA Setup** | Click "Enable MFA", copy secret, verify with TOTP code |
| 13 | **Forgot Password** (`/forgot-password`) | Enter email, show reset token (dev mode) |
| 14 | **Mobile Nav** | Resize browser narrow, show hamburger menu |

### Demo Accounts

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| admin@catalogit.com | password123 | admin | Admin user |
| movies@example.com | password123 | user | Has movie lists |
| books@example.com | password123 | user | Has book lists |
| collector@example.com | password123 | user | Has game/music lists |
| banned@example.com | password123 | user | Suspended (login blocked) |

---

## 7. Key Features to Highlight

- **JWT Authentication** — token-based, 24h expiry, bcrypt hashing
- **Password Reset** — secure random token, 1h expiry
- **Owner Authorization** — only list owners can edit/delete (try with different accounts)
- **3NF Database** — Users -> Lists -> Items, no redundancy, FK constraints
- **TLS/SSL** — enforced in production (HSTS, TLS 1.3)
- **At-Rest Encryption** — AES-256-GCM via Rails ActiveRecord::Encryption
- **Admin MFA** — TOTP-based two-factor authentication (setup, verify, disable)
- **Security** — XSS prevention, rate limiting, user status, CORS, error boundary
- **Share Lists** — generates short URL (`/s/:code`), clipboard copy
- **Comments + Likes** — social feedback on public/shared lists and list items
- **Strict content moderation** — profanity/slur filtering blocks inappropriate comments and item notes with clear 422 messaging
- **Responsive** — mobile hamburger menu, works on all screen sizes
- **Automated Test Coverage** — backend core specs + frontend UI tests + frontend E2E tests
