# CatalogIt - Weekly Plan & Progress

**Last Updated**: March 9, 2026
**Current Branch**: `feature/mar-2-full-tests-doc-refresh`  
**Project Status**: Midterm Complete + Feedback Iteration + Attachments v1.1

---

## Progress

```
Backend:     ████████████ 100%
Frontend:    ████████████ 100%
Security:    ████████████ 100%
Deployment:  ░░░░░░░░░░░░   0%
Overall:     ████████████  99%
```

---

## Completed

### Weeks 1-2: Backend + Security (Feb 1-7)
- [x] Database schema (Users, Lists, Items) -- 3NF, PostgreSQL
- [x] JWT authentication + password reset (20 API endpoints)
- [x] Security hardening (TLS, MFA, XSS, rate limiting, CORS, encryption)
- [x] Backend RSpec suite passing (currently 234 examples, 0 failures)
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

## This Week: Feedback Sprint (Feb 24-Mar 1)

### Phase 7: Midterm Wrap-Up
- [x] Midterm presentation delivery
- [x] Live demo walkthrough
- [x] Capture professor feedback + convert to tasks

### Phase 8: Professor Feedback Implementation (Priority)
- [x] Add comment feature for public and shared lists
- [x] Add "thumbs up / I like it" reactions for lists
- [x] Add "thumbs up / I like it" reactions for items
- [x] Add/update DB models + migrations (comments, reactions)
- [x] Add API endpoints for comment/reaction CRUD
- [x] Add frontend UI/UX for comments and reactions
- [x] Add permissions + moderation guardrails (owner/delete rules, rate limiting)
- [x] Add tests for backend + frontend happy/error paths
- [x] Add CI workflow for frontend tests (Vitest + Playwright on PRs)

See [DEMO.md](DEMO.md) for full walkthrough, SQL commands, and curl examples.

## Remaining Work

### After Midterm
- [x] Component tests (Vitest + React Testing Library)
- [x] E2E tests (Playwright)
- [x] Server-side search/filter API
- [x] Comments + reactions analytics (engagement counts in dashboard)
- [ ] Deployment (Render + Netlify)

## New Feature Plan: Attachments (Mar 2-Mar 8)

### Phase 1: Backend Schema + Endpoints
- [x] Create `attachments` data model (polymorphic: `List`/`Item`, uploader, metadata)
- [x] Decide storage strategy (ActiveStorage + cloud bucket in production)
- [x] Add attachment validations (kind, URL for links, MIME allowlist, size limits)
- [x] Add attachment API endpoints (list/item index + create, attachment delete)
- [x] Add authorization rules (owner-only upload/delete, visibility-based read)
- [x] Add security guardrails (dangerous type blocking, size limits, https links)

### Phase 2: Frontend List/Item UI
- [x] Add attachments service methods (fetch/upload/create-link/delete)
- [x] Add list-level Attachments section in `ListDetail` (upload + link + render cards)
- [x] Add item-level attachments UI (owner add/delete + preview support)
- [x] Add UX states (loading/empty/permission-disabled/failure toasts)
- [x] Add attachment previews (link cards + uploaded file/image links)

### Phase 3: Tests + Polish + Docs
- [x] Backend model/request tests for attachments (happy path + auth + validation)
- [x] Frontend unit tests for attachment interactions and permission behavior
- [x] Frontend E2E tests for upload/link/view/delete flows
- [x] Swagger docs for attachment endpoints and request/response schemas
- [x] Update docs (`PROJECT_STATUS.md`, backend/frontend `README.md`, `DEMO.md`)
## This Week: Integration Sprint (Mar 9-Mar 15)

### Focus
- [x] Complete remaining attachment scope gaps from last sprint
- [x] Add item-level attachment UI in `ListDetail` with owner actions
- [x] Add/refresh Swagger coverage for attachment endpoints
- [x] Run full regression suite and fix failures
- [ ] Deployment execution (Render + Netlify)

### Validation Snapshot (Mar 9)
- [x] Backend full suite: `235 examples, 0 failures`
- [x] Frontend unit tests: `13 passed`
- [x] Frontend E2E: `5 passed`
- [x] Frontend production build passes


### Initial Scope Constraints (v1)
- [x] Start with list-level attachments first; expand to item-level after v1 is stable
- [x] Allowed upload MIME types: jpeg/png/webp/pdf/txt/zip
- [x] Max upload size: 5MB
- [x] Links must be `https://`

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
- [x] Core backend tests passing (requests/models/services)
- [x] 33 API endpoints (auth, lists, items, comments, likes, analytics, attachments)
- [x] Comments API (public/shared lists)
- [x] Reactions API (likes on lists/items)

### Frontend (100%)
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
- [x] Comment UI for public/shared list pages
- [x] Like/Thumbs-up UI for lists and items
- [x] List-level attachment uploads (files/images/links)
- [x] Component tests
- [x] E2E tests (Playwright)
- [x] Server-side search/filter (`/api/v1/lists` query params: `search`, `visibility`, `sort`, `owner_only`, `public_only`)
- [x] Dashboard analytics endpoint (`/api/v1/lists/analytics`) + frontend engagement cards

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

*Last updated: March 9, 2026*
