# CatalogIt - Project Status

**Last Updated**: March 24, 2026  
**Branch**: `deployment` (verify on clone)  
**Overall Progress**: 99% | Attachments (note/link/file UX) + S3 path in progress, AWS deploy ongoing

---

## Quick Status

```
Backend:     ████████████ 100%  (core specs passing, 33 endpoints)
Frontend:    ████████████ 100%  (11 routes, comments/likes/attachments, UI + E2E tests)
Security:    ████████████ 100%  (TLS, MFA, XSS, encryption, rate limiting)
Deployment:  ████████░░░░  65%  Infra + ECR flow; S3 Active Storage cutover + migrate pending
```

---

## Backend: 100%

- 33 API endpoints (auth, lists, items, comments, reactions, analytics, attachments)
- JWT auth + password reset (secure token, 1h expiry)
- TOTP-based MFA (rotp gem, setup/verify/disable endpoints)
- Security: TLS, MFA, XSS, rate limiting, encryption, CORS
- New social features: comments on public/shared lists, likes on lists/items
- Attachment features: list/item attachments via ActiveStorage — kinds `link`, `image`, `file`, **`note`** (text body); unified optional fields in `ListDetail` UI
- Core spec suites passing (`spec/models`, `spec/requests`, `spec/services`)

## Frontend: 100%

### Done
- [x] 11 routes, 11 pages, 8 shared components
- [x] Auth (login, signup, forgot/reset password)
- [x] Login with MFA step (TOTP OTP code input)
- [x] Explore (search + 5 sort options)
- [x] Dashboard (stats, search, filter by visibility, list CRUD)
- [x] ListDetail (items, ratings, item CRUD, share button, comments, likes, attachments)
- [x] Profile page (user info, role, status, stats, MFA setup/disable)
- [x] Mobile responsive nav (hamburger menu)
- [x] ErrorBoundary (React crash recovery)
- [x] Share list (short URL, clipboard, `/s/:code`)
- [x] Loading skeletons, empty states, toast notifications
- [x] Frontend automated tests configured (Vitest + Playwright)
- [x] UI tests for list/item likes, comment posting/deletion permissions, unauthenticated behavior
- [x] E2E tests for list/item likes, comments, and auth-aware UI behavior
- [x] Attachment tests: backend model/request + frontend unit + frontend E2E
- [x] Item-level attachment management UI in `ListDetail` (single form: optional note, link, file, label)
- [x] Attachment endpoint documentation refreshed in Swagger

### Remaining (post-midterm)
- [ ] Deployment (AWS: Terraform + EC2 + RDS + S3 + CloudFront) — **see [OPERATIONS.md](OPERATIONS.md) / [DEPLOY_PLAN.md](DEPLOY_PLAN.md) for S3 upload cutover**

### Newly Completed
- [x] Server-side search/filter API (`GET /api/v1/lists` query params for `search`, `visibility`, `sort`)
- [x] Explore now uses backend filtering/sorting (`public_only=true`)
- [x] Dashboard now uses backend filtering (`owner_only=true`) and analytics endpoint
- [x] Comments/reactions analytics in dashboard (`GET /api/v1/lists/analytics`)
- [x] Item-level attachments now included in list payload item serialization
- [x] Attachment request specs expanded for item-level create flow

---

## This Week (Mar 19) - AWS Deployment Execution

### In scope this week
- [x] Validate Ruby image/version compatibility in EC2 target environment
- [ ] Finalize TLS termination strategy for `force_ssl` (CloudFront/ALB/reverse proxy)
- [x] Prepare `backend/.env.production` and run preflight checks
- [~] Deploy backend to EC2 and run DB setup/migration commands (in progress)
- [ ] Build frontend with `VITE_API_URL`, upload to S3, invalidate CloudFront
- [ ] Run deployment validation checklist (`/up`, `/api/v1/lists`, auth, CRUD, CORS, HTTPS)

### Confirmed progress today (Mar 20)
- [x] Terraform apply completed; outputs captured for EC2/RDS/S3/CloudFront
- [x] ECR flow validated (local buildx push, EC2 pull)
- [x] EC2 IAM runtime role permissions corrected for ECR/S3 path
- [x] Deployment debugging retrospective documented in `root_cause_deployment_lessons.md`

### Deferred / next session
- [ ] Production **`ACTIVE_STORAGE_SERVICE=amazon`** + migrated DB + new image on EC2
- [ ] EventBridge/budgets/terraform polish — see [OPERATIONS.md](OPERATIONS.md)
- [ ] Session handoff: **[OPERATIONS.md](OPERATIONS.md)**

---

## Charter Compliance

### Phase Completion

| Phase | Period | Status |
|-------|--------|--------|
| 1-3. Planning & Setup | Jan 11-19 | Complete |
| 4. Backend Development | Feb 1-7 | Complete |
| 5. Frontend Development | Feb 8-14 | Complete |
| 6. Core Functionality | Feb 15-21 | Complete |
| 7. Midterm Review | Feb 22-28 | **Ready** |
| 8-10. Integration & Closing | Mar 1-29 | Upcoming |

### ERD Business Rules

| Rule | Description | Status |
|------|-------------|--------|
| 1 | Unique UserID and Email | Done |
| 2 | User Status (Active/Suspended/Deleted) | Done |
| 3 | Role-based access (admin/user) | Done |
| 4 | List belongs to one User | Done |
| 5 | Visibility (Private/Shared/Public) | Done |
| 6 | Item belongs to one List | Done |
| 7 | Rating 1-5 | Done |
| 8 | DateAdded >= List CreatedAt | Done |
| 9-10 | Feedback entity (comments/reactions) | Done |
| 11 | ActivityLog | Future |
| 12-14 | Admin/KnowledgeBase entities | Future |

### Security Controls

| Control | Status |
|---------|--------|
| TLS/SSL (Force SSL in production) | Done |
| At-Rest Encryption (AES-256-GCM) | Done |
| Admin MFA (TOTP) | Done |
| JWT Authentication | Done |
| Password Reset | Done |
| Password Hashing (bcrypt) | Done |
| XSS Prevention | Done |
| Rate Limiting | Done |
| User Status Management | Done |
| CORS | Done |
| Input Validation | Done |
| Owner Authorization (IDOR) | Done |
| Error Boundary | Done |

---

## Quick Commands

```bash
# Backend
cd backend && bundle exec puma -p 3000

# Frontend
cd frontend && npm run dev

# Backend core tests
cd backend && RAILS_ENV=test bundle exec rspec spec/models spec/requests spec/services

# Frontend tests
cd frontend && npm run test
cd frontend && npm run test:e2e

# Build
cd frontend && npm run build
```

## CI Status

- Backend workflow: static security scans + RuboCop lint on PRs
- Frontend workflow: Vitest UI tests + Playwright E2E on PRs

---

*Last updated: March 21, 2026*  
*Backend: 33 endpoints, core specs passing (requests/models/services)*  
*Frontend: comments/likes/search/analytics/attachments complete; `ListDetail.test.jsx` aligned with unified attachment form*
