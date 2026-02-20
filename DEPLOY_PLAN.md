# CatalogIt - Deployment Plan

**Last Updated**: February 9, 2026  
**Target**: Week 5 (Mar 1-7) or earlier if ready  
**Strategy**: Render (backend + database) + Netlify (frontend)

---

## Architecture Overview

```
┌─────────────┐       HTTPS        ┌──────────────────┐
│   Browser   │ ──────────────────> │  Netlify (CDN)   │
│  (React)    │ <────────────────── │  Static SPA      │
└─────────────┘                     └──────────────────┘
      │                                    
      │ API calls (HTTPS)                  
      ▼                                    
┌──────────────────┐     Internal    ┌──────────────────┐
│  Render.com      │ ──────────────> │  Render.com      │
│  Rails API       │ <────────────── │  PostgreSQL      │
│  (Web Service)   │                 │  (Managed DB)    │
└──────────────────┘                 └──────────────────┘
```

**Why this stack?**
- Free tier available on both platforms
- Zero DevOps overhead (no Docker/AWS needed for MVP)
- Auto-deploy from GitHub
- SSL included free
- Good enough for a class project demo

---

## Phase 1: Pre-Deployment Prep (1-2 hours)

### 1.1 Backend Production Config

```bash
cd backend
```

**a) Add production gems to Gemfile (if not present):**

```ruby
group :production do
  gem "pg"   # already included
end
```

**b) Create `Procfile` in `backend/`:**

```
web: bundle exec puma -C config/puma.rb
release: bundle exec rails db:migrate
```

**c) Update `config/puma.rb` for production:**

```ruby
max_threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }
min_threads_count = ENV.fetch("RAILS_MIN_THREADS") { max_threads_count }
threads min_threads_count, max_threads_count

port ENV.fetch("PORT") { 3000 }

environment ENV.fetch("RAILS_ENV") { "development" }

workers ENV.fetch("WEB_CONCURRENCY") { 2 }
preload_app!
```

**d) Update `config/environments/production.rb`:**

```ruby
config.force_ssl = true
config.assume_ssl = true
```

**e) Update CORS for production (`config/initializers/cors.rb`):**

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    if Rails.env.production?
      origins ENV.fetch('FRONTEND_URL', 'https://catalogit.netlify.app')
    else
      origins 'http://localhost:5173', 'http://localhost:3000'
    end
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
```

### 1.2 Frontend Production Config

**a) Create `frontend/netlify.toml`:**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**b) Create `frontend/public/_redirects`:**

```
/*    /index.html   200
```

**c) Verify production build works:**

```bash
cd frontend
npm run build
npm run preview
```

---

## Phase 2: Deploy Database (15 min)

### 2.1 Create Render PostgreSQL

1. Go to [render.com](https://render.com) and sign up / log in
2. Click **New** > **PostgreSQL**
3. Configure:
   - **Name**: `catalogit-db`
   - **Region**: Oregon (US West) or closest to you
   - **PostgreSQL Version**: 16
   - **Plan**: Free
4. Click **Create Database**
5. Copy the **Internal Database URL** (starts with `postgres://...`)

> Free tier: 256MB storage, auto-expires after 90 days. Sufficient for demo.

---

## Phase 3: Deploy Backend (20 min)

### 3.1 Create Render Web Service

1. On Render dashboard, click **New** > **Web Service**
2. Connect your GitHub repo (`catalog-it`)
3. Configure:
   - **Name**: `catalogit-api`
   - **Region**: Same as database
   - **Branch**: `feature/frontend-init` (or `main` after merge)
   - **Root Directory**: `backend`
   - **Runtime**: Ruby
   - **Build Command**: `bundle install`
   - **Start Command**: `bundle exec puma -C config/puma.rb`
   - **Plan**: Free

### 3.2 Set Environment Variables

On the Render service settings, add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | *(paste Internal Database URL from Phase 2)* |
| `RAILS_ENV` | `production` |
| `RAILS_MASTER_KEY` | *(contents of `backend/config/master.key`)* |
| `SECRET_KEY_BASE` | *(run `rails secret` to generate)* |
| `FRONTEND_URL` | `https://catalogit.netlify.app` |
| `RAILS_LOG_TO_STDOUT` | `true` |

### 3.3 Seed Production Data

After the first deploy succeeds:

```bash
# Using Render Shell (available in dashboard)
bundle exec rails db:seed
```

Or use the Render **Shell** tab on the web service page.

### 3.4 Verify Backend

```bash
curl https://catalogit-api.onrender.com/api/v1/lists
# Should return JSON array of public lists
```

---

## Phase 4: Deploy Frontend (15 min)

### 4.1 Create Netlify Site

1. Go to [netlify.com](https://netlify.com) and sign up / log in
2. Click **Add new site** > **Import from Git**
3. Connect your GitHub repo
4. Configure:
   - **Branch**: `feature/frontend-init` (or `main`)
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

### 4.2 Set Environment Variables

In Netlify site settings > **Environment variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://catalogit-api.onrender.com/api/v1` |

### 4.3 Trigger Deploy

Click **Deploy site** or push a commit to trigger auto-deploy.

### 4.4 Verify Frontend

Visit `https://catalogit.netlify.app` (or whatever URL Netlify assigns).

---

## Phase 5: Post-Deploy Verification (30 min)

### Checklist

| Test | Expected Result |
|------|----------------|
| Visit homepage | Hero section loads, no console errors |
| Browse `/explore` | Public lists displayed |
| Click a list | List detail with items and ratings |
| Sign up new account | Success, redirected to dashboard |
| Login with seed account | `movies@example.com` / `password123` works |
| Create a list | List appears in dashboard |
| Add item to list | Item appears with rating |
| Edit item | Changes saved |
| Delete item | Item removed with confirmation |
| Delete list | List removed from dashboard |
| Logout | Redirected to home |
| Visit `/dashboard` logged out | Redirected to `/login` |
| API docs | `https://catalogit-api.onrender.com/api-docs` loads |

### Common Issues

| Problem | Fix |
|---------|-----|
| CORS errors | Check `FRONTEND_URL` env var matches Netlify URL exactly |
| 404 on page refresh | Verify `_redirects` file or `netlify.toml` redirect rule |
| DB connection failed | Check `DATABASE_URL` is the Internal URL |
| Assets not loading | Verify `npm run build` passes locally first |
| API returns 500 | Check Render logs for missing env vars |
| Free tier cold start | First request after 15min idle takes ~30s on Render free tier |

---

## Environment Variables Summary

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `RAILS_ENV` | Yes | `production` |
| `SECRET_KEY_BASE` | Yes | Rails secret (run `rails secret`) |
| `RAILS_MASTER_KEY` | Yes | From `config/master.key` |
| `FRONTEND_URL` | Yes | Netlify site URL for CORS |
| `RAILS_LOG_TO_STDOUT` | Yes | `true` |

### Frontend (Netlify)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Render API URL + `/api/v1` |

---

## Cost

| Service | Tier | Cost | Limits |
|---------|------|------|--------|
| Render Web Service | Free | $0 | 750 hrs/mo, spins down after 15min idle |
| Render PostgreSQL | Free | $0 | 256MB, expires after 90 days |
| Netlify | Free | $0 | 100GB bandwidth/mo, 300 build min/mo |
| **Total** | | **$0** | |

> **Note**: Render free tier spins down after 15 minutes of inactivity. First request after idle takes ~30 seconds (cold start). This is fine for a class demo -- just visit the site a minute before presenting.

---

## Alternative: Docker + AWS (if needed later)

If the project needs to move to AWS (per project charter), the steps are:

1. **Dockerize** both apps (add `Dockerfile` to `backend/` and `frontend/`)
2. **Push to ECR** (Elastic Container Registry)
3. **Deploy on ECS Fargate** or **EC2 Free Tier**
4. **RDS** for PostgreSQL
5. **CloudFront** for frontend CDN
6. **Route 53** for DNS

This is significantly more complex and not needed for MVP/demo. Start with Render + Netlify, migrate later if required.

---

## Timeline

| Day | Task | Time |
|-----|------|------|
| Day 1 | Pre-deploy prep (Procfile, configs) | 1-2 hrs |
| Day 1 | Deploy database + backend on Render | 30 min |
| Day 1 | Deploy frontend on Netlify | 15 min |
| Day 1 | Post-deploy verification | 30 min |
| Day 2 | Fix any issues, seed production data | 1 hr |
| Day 2 | Share URL with instructor/classmates | 5 min |

**Total estimated time: 3-4 hours**

---

## Security Architecture (Production)

### Network Defense
- **AWS WAF & CloudFront** (future): Blocks SQL injection and absorbs DDoS at the edge
- **Subnet Isolation**: Render managed PostgreSQL runs in a private subnet; API server is in a DMZ
- Netlify CDN serves frontend with built-in DDoS protection

### Data Encryption
- **In-Transit**: TLS 1.3 enforced (`config.force_ssl = true`, Render + Netlify provide free SSL)
- **At-Rest**: PostgreSQL data encrypted at rest via Render managed encryption (AES-256)
- **Credentials**: Passwords hashed with bcrypt + salt (never stored in plain text)
- **OTP Secrets**: Encrypted via Rails ActiveRecord::Encryption (AES-256-GCM)

### Access & Threat Prevention
- **Admin MFA**: TOTP-based two-factor authentication for admin/business admin accounts
- **XSS Prevention**: Input sanitization via `sanitize` gem
- **IDOR Prevention**: Object-level ownership checks on all CRUD endpoints
- **Rate Limiting**: Rack::Attack throttles login attempts and API abuse
- **User Status**: Active/suspended/deleted status blocks compromised accounts
- **Error Boundary**: React ErrorBoundary prevents UI crashes from exposing internals

### Environment Variables (Security-Sensitive)

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY_BASE` | Rails session/encryption master key |
| `JWT_SECRET_KEY` | JWT signing key |
| `ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY` | AES-256 encryption key |
| `ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY` | Deterministic encryption key |
| `ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT` | Key derivation salt |
| `DATABASE_URL` | PostgreSQL connection string |
| `FRONTEND_URL` | CORS allowed origin |

---

*Last updated: February 17, 2026*
