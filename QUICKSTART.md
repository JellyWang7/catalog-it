# CatalogIt Quick Start Guide

## Prerequisites Checklist

Before starting frontend development, ensure all of these are complete:

### ✅ System Requirements
- [x] Ruby 4.0+ installed
- [x] Rails 8+ installed  
- [x] PostgreSQL 15+ installed and running
- [x] Node.js 16+ and npm installed

### ✅ Database
- [x] PostgreSQL service running (`brew services list`)
- [x] Database `catalogit_development` created
- [x] Migrations run (3 tables: users, lists, items)
- [x] Seed data loaded (6 public lists, 24 items)

### ✅ Backend Configuration
- [x] `backend/config/database.yml` exists (copied from `.example`)
- [x] `backend/config/initializers/cors.rb` configured for localhost:5173
- [x] Gemfile dependencies installed (`bundle install`)
- [x] Tests passing (76 RSpec specs)

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

## Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/lists` | Get all public lists |
| GET | `/api/v1/lists/:id` | Get specific list with items |
| POST | `/api/v1/lists` | Create new list |
| PATCH | `/api/v1/lists/:id` | Update list |
| DELETE | `/api/v1/lists/:id` | Delete list |
| GET | `/api/v1/lists/:list_id/items` | Get items in list |
| POST | `/api/v1/lists/:list_id/items` | Add item to list |
| PATCH | `/api/v1/items/:id` | Update item |
| DELETE | `/api/v1/items/:id` | Delete item |

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
