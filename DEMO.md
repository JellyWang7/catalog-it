# CatalogIt - Demo Guide

**Date**: February 20, 2026
**Branch**: `midterm-demo`

---

## 1. Start the App

Open **three terminal tabs** and run:

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

```bash
# Terminal 3 — SQL / Commands (keep open for live queries)
psql -d catalogit_development
```

**URLs**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api-docs

---

## 2. Show the Database (SQL)

### List all tables

```sql
\dt
```

```
 Schema |         Name         | Type  | Owner
--------+----------------------+-------+--------
 public | items                | table | Jelly1
 public | lists                | table | Jelly1
 public | users                | table | Jelly1
```

### Show table schemas

```sql
\d users
\d lists
\d items
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
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint WHERE contype = 'f';
```

---

## 3. Test the API (curl)

### Login and get JWT token

```bash
curl -s http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user":{"email":"movies@example.com","password":"password123"}}' \
  | python3 -m json.tool
```

### List public lists

```bash
curl -s http://localhost:3000/api/v1/lists | python3 -m json.tool | head -30
```

### Create a list (authenticated)

```bash
TOKEN=$(curl -s http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user":{"email":"movies@example.com","password":"password123"}}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -s http://localhost:3000/api/v1/lists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"list":{"title":"Demo List","description":"Created via API","visibility":"public"}}' \
  | python3 -m json.tool
```

---

## 4. Run Tests

```bash
cd backend
RAILS_ENV=test bundle exec rspec spec/models spec/requests spec/services
# 175 examples, 0 failures
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
| 9 | **Explore** (`/explore`) | Public list grid, search, sort dropdown (5 options) |
| 10 | **Profile** (`/profile`) | Avatar, role badge, status, stats cards, MFA section |
| 11 | **MFA Setup** | Click "Enable MFA", copy secret, verify with TOTP code |
| 12 | **Forgot Password** (`/forgot-password`) | Enter email, show reset token (dev mode) |
| 13 | **Mobile Nav** | Resize browser narrow, show hamburger menu |

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
- **Responsive** — mobile hamburger menu, works on all screen sizes
- **175 Tests** — models, requests, services, auth, authorization, security
