# CatalogIt Quick Start Guide

Overview: [README.md](README.md) · First-time setup: [START_HERE.md](START_HERE.md) · Demo script: [DEMO.md](DEMO.md)

## Prerequisites Checklist

Before starting frontend development, ensure all of these are complete:

### ✅ System Requirements
- [x] Ruby 4.0+ installed
- [x] Rails 8+ installed  
- [x] PostgreSQL 15+ installed and running
- [x] Node.js 18+ and npm installed (16 may work with current pins)

### ✅ Database
- [x] PostgreSQL service running (`brew services list`)
- [x] Database `catalogit_development` created
- [x] Migrations run (full schema — comments, reactions, attachments, etc.)
- [x] Seed data loaded when you need demo data (`rails db:seed`)

### ✅ Backend Configuration
- [x] `backend/config/database.yml` exists (copied from `.example`)
- [x] `backend/config/initializers/cors.rb` configured for localhost:5173
- [x] Gemfile dependencies installed (`bundle install`)
- [x] Tests passing (`bundle exec rspec` — see [backend/TESTING.md](backend/TESTING.md))

### ✅ Security
- [x] `.gitignore` protecting sensitive files
- [x] `master.key`, `database.yml` NOT in git
- [x] `.env.example` template available

## Running the Application

### 1. Start PostgreSQL (if not running)
```bash
brew services start postgresql@15
```

### 2. Start Rails Backend
```bash
cd backend

# First time setup (if database.yml doesn't exist):
cp config/database.yml.example config/database.yml
# Edit database.yml and set your username

# Start the server
rails server
```

Rails API will run on **http://localhost:3000**

### 3. Test API Endpoints
```bash
# Health check
curl http://localhost:3000/up

# Get all public lists
curl http://localhost:3000/api/v1/lists

# Get specific list
curl http://localhost:3000/api/v1/lists/1
```

### 4. Start Frontend (once built)
```bash
cd frontend
npm install
npm run dev
```

Frontend will run on **http://localhost:5173**

## API surface

Lists, items, auth, comments, likes, attachments, and more — see the full table in [README.md](README.md) or Swagger at `http://localhost:3000/api-docs`.

## Troubleshooting

### Rails server won't start
- Check if `database.yml` exists: `ls backend/config/database.yml`
- If missing: `cp backend/config/database.yml.example backend/config/database.yml`
- Update username in `database.yml` to match your system user

### Database connection error
- Ensure PostgreSQL is running: `brew services list`
- Check database exists: `rails db` (should open psql console)
- If not: `rails db:create db:migrate db:seed`

### CORS errors in frontend
- Verify CORS is configured for `http://localhost:5173`
- Check `backend/config/initializers/cors.rb`
- Restart Rails server after CORS changes

### Port already in use
- Kill existing Rails server: `kill $(cat tmp/pids/server.pid)`
- Or use different port: `rails server -p 3001`

## Next Steps

1. ✅ Backend is complete and tested
2. → **Build React frontend** (you are here)
3. → Connect frontend to backend API
4. → Deploy to AWS

## Useful Commands

```bash
# Run backend tests
cd backend && bundle exec rspec

# Check routes
cd backend && rails routes | grep api

# Rails console
cd backend && rails console

# Reset database (⚠️ deletes all data)
cd backend && rails db:reset
```
