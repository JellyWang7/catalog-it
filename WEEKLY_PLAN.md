# CatalogIt - Weekly Plan & Progress

**Last Updated**: February 20, 2026
**Current Branch**: `midterm-demo`  
**Project Status**: Midterm Ready (Frontend 95%)

---

## Progress

```
Backend:     ████████████ 100%
Frontend:    ███████████░  95%
Security:    ████████████ 100%
Deployment:  ░░░░░░░░░░░░   0%
Overall:     ██████████░░  90%
```

---

## Completed

### Weeks 1-2: Backend + Security (Feb 1-7)
- [x] Database schema (Users, Lists, Items) -- 3NF, PostgreSQL
- [x] JWT authentication + password reset (20 API endpoints)
- [x] Security hardening (TLS, MFA, XSS, rate limiting, CORS, encryption)
- [x] 175 RSpec tests passing (100%)
- [x] Swagger/OpenAPI docs at `/api-docs`

### Week 3: Frontend Core (Feb 8-9)
- [x] React 18 + Vite 4 + Tailwind CSS 3 setup
- [x] Auth UI (login, signup, forgot/reset password)
- [x] AuthContext (JWT token management)
- [x] Explore page (public list grid, search, skeletons)
- [x] Dashboard (stats cards, list CRUD, visibility badges)
- [x] ListDetail (items, star ratings, item CRUD)
- [x] Share list (short URL, `/s/:code` redirect)
- [x] Enriched seed data (5 users, 10 lists, 50+ items)

### Week 4: Frontend Polish (Feb 10-14)
- [x] Mobile responsive hamburger menu
- [x] Sort dropdown on Explore (5 sort options)
- [x] ErrorBoundary component (React crash recovery)
- [x] Profile page (`/profile`)
- [x] Production build verified (435 modules, 0 errors)

### Week 5: Midterm Prep + Security (Feb 15-17)
- [x] Dashboard search & filter (search bar + visibility dropdown)
- [x] Force SSL/TLS in production (HSTS)
- [x] At-rest encryption (AES-256-GCM via Rails ActiveRecord::Encryption)
- [x] Admin MFA (TOTP via rotp gem, full backend + frontend)
- [x] Login flow with MFA step (OTP code input)
- [x] Profile page MFA setup/disable UI
- [x] 3 new API endpoints (20 total)
- [x] All security spec requirements met
- [x] Documentation cleanup + demo walkthrough prepared

---

## This Week: Midterm Review (Feb 22-28)

### Phase 7: Midterm Presentation
- [ ] Midterm presentation delivery
- [ ] Live demo walkthrough
- [ ] Q&A preparation

See [DEMO.md](DEMO.md) for full walkthrough, SQL commands, and curl examples.

## Remaining Work

### After Midterm
- [ ] Component tests (Vitest + React Testing Library)
- [ ] Server-side search/filter API
- [ ] Deployment (Render + Netlify)

See [DEPLOY_PLAN.md](DEPLOY_PLAN.md) for deployment instructions.

---

## Feature Checklist

### Backend (100%)
- [x] Database schema (Users, Lists, Items)
- [x] JWT authentication (signup, login, me)
- [x] Password reset (forgot + reset with token)
- [x] Authorization (public/private, owner-based)
- [x] List sharing (unique short codes)
- [x] API documentation (Swagger)
- [x] Security (TLS, MFA, XSS, rate limiting, encryption, CORS)
- [x] 175 tests passing
- [x] 20 API endpoints (auth 8, lists 7, items 5)

### Frontend (95%)
- [x] React + Vite + Tailwind setup
- [x] Auth UI (login, signup, forgot/reset password)
- [x] Login with MFA step (TOTP OTP code input)
- [x] Protected routes + AuthContext
- [x] Public catalog (Explore with search + sort)
- [x] List detail (items, star ratings, share)
- [x] Dashboard (stats, search, filter, list CRUD)
- [x] Item management (add/edit/delete)
- [x] Profile page (user info, stats, MFA setup/disable)
- [x] Mobile responsive navigation
- [x] Error boundary
- [x] Loading skeletons + empty states + toasts
- [ ] Component tests
- [ ] Server-side search

### Deployment (0%)
- [ ] Backend on Render
- [ ] Frontend on Netlify

---

## Seed Data

| User | Email | Password | Role |
|------|-------|----------|------|
| admin | admin@catalogit.com | password123 | admin |
| movie_buff | movies@example.com | password123 | user |
| bookworm | books@example.com | password123 | user |
| collector | collector@example.com | password123 | user |
| banned_user | banned@example.com | password123 | suspended |

10 lists, 50+ items with varied ratings.

---

*Last updated: February 20, 2026*
