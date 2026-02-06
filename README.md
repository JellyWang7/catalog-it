# 🎯 CatalogIt

> A production-ready web application for creating and sharing personal catalogs (movies, books, collectibles, and more).

**Course**: CS701  
**Status**: Backend Complete ✅ | Frontend Starting Week 3 ⏳  
**Progress**: 50% Overall

---

## 📋 **Quick Links**

| Document | Purpose |
|----------|---------|
| **[WEEKLY_PLAN.md](WEEKLY_PLAN.md)** | Week-by-week roadmap ⭐ **Start here** |
| **[PROJECT_STATUS.md](PROJECT_STATUS.md)** | Detailed status, compliance, security |
| **[FRONTEND_SETUP.md](FRONTEND_SETUP.md)** | Frontend setup guide (Week 3) |
| **[backend/README.md](backend/README.md)** | Backend API documentation |
| **[backend/TESTING.md](backend/TESTING.md)** | Testing guide (175 tests) |

---

## 🎯 **What is CatalogIt?**

CatalogIt allows users to:
- ✅ Create **personal catalogs** (movie collections, reading lists, wishlists, etc.)
- ✅ Mark lists as **public** (shareable) or **private**
- ✅ Browse **public catalogs** created by others
- ✅ Rate and add notes to items
- ✅ Manage collections with full CRUD operations

---

## 🛠️ **Tech Stack**

### Backend ✅ **COMPLETE**
- **Framework**: Ruby on Rails 8.1.2 (API mode)
- **Database**: PostgreSQL 15+
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: XSS prevention, rate limiting, user status management
- **Testing**: RSpec (175 tests passing, 100%)
- **API Docs**: Swagger/OpenAPI

### Frontend ⏳ **STARTING WEEK 3**
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: Context API

### Deployment 🔜 **WEEK 5**
- **Backend**: AWS Free Tier (Docker)
- **Frontend**: Netlify
- **Database**: AWS RDS PostgreSQL
- **CDN**: AWS CloudFront

---

## 📁 **Project Structure**

```
catalog-it/
├── backend/              # Rails API ✅ COMPLETE
│   ├── app/
│   │   ├── controllers/  # API endpoints (lists, items, auth)
│   │   ├── models/       # User, List, Item
│   │   └── services/     # JWT service
│   ├── spec/             # 175 RSpec tests ✅
│   ├── config/           # CORS, rate limiting, routes
│   ├── db/               # Migrations, schema
│   └── swagger/          # OpenAPI documentation
│
├── frontend/             # React app ⏳ COMING WEEK 3
│   └── (Starting Monday)
│
├── docs/                 # 🔒 PROTECTED (Not in Git)
│   ├── requirements/     # Project charter, requirements
│   ├── architecture/     # ERD, network design
│   └── ui-mockups/       # HTML wireframes for React
│
├── README.md             # This file
├── WEEKLY_PLAN.md        # Week-by-week roadmap
├── PROJECT_STATUS.md     # Status, compliance, security
└── FRONTEND_SETUP.md     # Frontend setup guide
```

---

## 🚀 **Quick Start**

### Prerequisites
```bash
# Required
- Ruby 4.0+
- Rails 8.1+
- PostgreSQL 15+
- Node.js 18+ (for frontend, Week 3)
```

### Backend Setup (Already Complete ✅)

```bash
# 1. Install dependencies
cd backend
bundle install

# 2. Setup database
cp config/database.yml.example config/database.yml
# Edit database.yml with your PostgreSQL username
rails db:create
rails db:migrate
rails db:seed

# 3. Start server
bundle exec puma -p 3000
# Backend runs at http://localhost:3000
```

### Test the Backend

```bash
# Run all tests (175 tests)
cd backend
RAILS_ENV=test bundle exec rspec

# View API documentation
open http://localhost:3000/api-docs

# Test authentication
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "username": "testuser",
      "email": "test@example.com",
      "password": "password123",
      "password_confirmation": "password123"
    }
  }'
```

### Frontend Setup (Week 3 - Monday)

```bash
# Initialize React project
npm create vite@latest frontend -- --template react
cd frontend
npm install

# Install dependencies
npm install react-router-dom axios tailwindcss @headlessui/react

# Setup Tailwind
npx tailwindcss init -p

# Start dev server
npm run dev
# Frontend will run at http://localhost:5173
```

---

## 📡 **API Endpoints**

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/signup` | Create account | No |
| POST | `/api/v1/auth/login` | Login | No |
| GET | `/api/v1/auth/me` | Current user | Yes |

### Lists
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/lists` | Get all public lists | No |
| GET | `/api/v1/lists/:id` | Get list details | No* |
| POST | `/api/v1/lists` | Create list | Yes |
| PATCH | `/api/v1/lists/:id` | Update list | Yes (owner) |
| DELETE | `/api/v1/lists/:id` | Delete list | Yes (owner) |

*Public lists accessible to all, private lists only to owner

### Items
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/lists/:list_id/items` | Get list items | No* |
| GET | `/api/v1/items/:id` | Get item details | No* |
| POST | `/api/v1/lists/:list_id/items` | Add item | Yes (owner) |
| PATCH | `/api/v1/items/:id` | Update item | Yes (owner) |
| DELETE | `/api/v1/items/:id` | Delete item | Yes (owner) |

**Full API documentation**: http://localhost:3000/api-docs (when server running)

---

## 🔒 **Security Features**

### Implemented ✅
- ✅ **XSS Prevention** - HTML sanitization in user-generated content
- ✅ **Rate Limiting** - API abuse prevention (5 login attempts/min)
- ✅ **User Status** - Active/suspended/deleted account management
- ✅ **JWT Authentication** - Secure token-based auth (24hr expiration)
- ✅ **Password Hashing** - bcrypt with salt
- ✅ **CORS** - Environment-based origin control
- ✅ **Authorization** - Owner-based access control (IDOR prevention)
- ✅ **Input Validation** - All user inputs validated

### Production (Week 5) 🔜
- 🔜 SSL/TLS encryption
- 🔜 Content Security Policy (CSP)
- 🔜 Database encryption at rest
- 🔜 Web Application Firewall (WAF)
- 🔜 Security monitoring & alerting

---

## 🧪 **Testing**

### Current Status: 175/175 Tests Passing ✅

```bash
# Run all tests
cd backend
RAILS_ENV=test bundle exec rspec

# Run specific test file
RAILS_ENV=test bundle exec rspec spec/models/user_spec.rb

# Run with documentation format
RAILS_ENV=test bundle exec rspec --format documentation
```

### Test Coverage
- **Models**: 28 tests (User, List, Item, Security)
- **API Requests**: 67 tests (CRUD operations)
- **Authentication**: 20 tests (signup, login, tokens)
- **Authorization**: 27 tests (access control)
- **Services**: 10 tests (JWT)
- **Security**: 23 tests (XSS, user status)

**Total**: 175 tests, 100% passing, <10 second runtime

---

## 📊 **Project Status**

### ✅ **Completed - Backend (100%)**
- [x] Database schema (Users, Lists, Items)
- [x] JWT authentication & authorization
- [x] Full CRUD API (13 endpoints)
- [x] Security hardening (XSS, rate limiting, user status)
- [x] 175 comprehensive tests
- [x] API documentation (Swagger)
- [x] 90% compliance with specs

### ⏳ **In Progress - Frontend (0%)**
**Week 3 Goals** (Starting Monday):
- [ ] React + Vite + Tailwind setup
- [ ] Authentication UI (login, signup)
- [ ] Public catalog browsing
- [ ] List details view
- [ ] User dashboard (CRUD operations)

### 🔜 **Upcoming - Deployment (Week 5)**
- [ ] AWS infrastructure setup
- [ ] Production database (RDS)
- [ ] SSL/TLS configuration
- [ ] CDN setup
- [ ] Monitoring & logging
- [ ] Security audit

**See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed status and compliance info.**

---

## 📚 **Documentation**

### Getting Started
1. **[WEEKLY_PLAN.md](WEEKLY_PLAN.md)** - Start here! Week-by-week roadmap
2. **[FRONTEND_SETUP.md](FRONTEND_SETUP.md)** - Frontend setup (Week 3)
3. **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Detailed status & compliance

### Backend Documentation
- **[backend/README.md](backend/README.md)** - Backend overview & API guide
- **[backend/AUTHENTICATION.md](backend/AUTHENTICATION.md)** - JWT authentication guide
- **[backend/SECURITY_IMPLEMENTATION.md](backend/SECURITY_IMPLEMENTATION.md)** - Security features
- **[backend/TESTING.md](backend/TESTING.md)** - Testing guide & strategies

### Protected Documentation (Not in Git)
- **`docs/requirements/`** - Project charter, requirements, schedule
- **`docs/architecture/`** - ERD, business rules, network design
- **`docs/ui-mockups/`** - HTML wireframes for frontend development

---

## 🔧 **Development Workflow**

### Starting Work
```bash
# 1. Start backend
cd backend
bundle exec puma -p 3000

# 2. (Week 3+) Start frontend in new terminal
cd frontend
npm run dev

# 3. View API docs
open http://localhost:3000/api-docs

# 4. Run tests
cd backend
RAILS_ENV=test bundle exec rspec
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push to GitHub
git push -u origin feature/your-feature-name

# Create pull request on GitHub
```

### Environment Variables
```bash
# Backend (.env)
DATABASE_USERNAME=your_username
FRONTEND_URL=http://localhost:5173  # For CORS

# Frontend (.env) - Week 3
VITE_API_URL=http://localhost:3000
```

---

## 🎯 **Next Steps**

### This Weekend
- ✅ Review backend security fixes
- ✅ Read through UI mockups in `docs/ui-mockups/`
- ✅ Familiarize with [WEEKLY_PLAN.md](WEEKLY_PLAN.md)

### Monday (Week 3 - Day 1)
1. Initialize React project with Vite
2. Install dependencies (React Router, Axios, Tailwind)
3. Setup project structure
4. Create API service wrapper
5. Test backend connectivity

**Follow**: [WEEKLY_PLAN.md](WEEKLY_PLAN.md) for detailed daily tasks

---

## 🐛 **Troubleshooting**

### Backend Issues

**Database connection error**:
```bash
# Check PostgreSQL is running
pg_isready

# Check database.yml configuration
cat config/database.yml

# Reset database
rails db:reset
```

**Test failures**:
```bash
# Migrate test database
RAILS_ENV=test rails db:migrate

# Clean test database
RAILS_ENV=test rails db:reset
```

**Port already in use**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Common Errors

**Bundler errors**: Run `bundle install`  
**Migration errors**: Run `rails db:migrate`  
**Test errors**: Run `RAILS_ENV=test rails db:migrate`

---

## 📈 **Metrics & Performance**

### Current Performance
- **API Response Time**: <50ms (average)
- **Test Suite Runtime**: <10 seconds
- **Database Queries**: Optimized (N+1 queries prevented)
- **Code Quality**: A+ (Rubocop compliant)

### Compliance
- **Business Rules**: 95% (23/24 rules)
- **Security Controls**: 85% (13/15 controls)
- **Overall Compliance**: 90%
- **Test Coverage**: 100% (175/175 passing)

---

## 🤝 **Contributing**

This is a student project for CS701. Development follows:
- **Branch naming**: `feature/feature-name`, `fix/bug-name`
- **Commit format**: Conventional commits (`feat:`, `fix:`, `docs:`)
- **Testing**: All tests must pass before merging
- **Code review**: Required for all PRs

---

## 📞 **Resources**

### Documentation Links
- **Backend API**: http://localhost:3000/api-docs (when running)
- **Rails Guides**: https://guides.rubyonrails.org/
- **React Docs**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs

### Project Links
- **GitHub Repository**: https://github.com/JellyWang7/catalog-it
- **Current Branch**: `security-compliance-fixes`
- **Weekly Plan**: [WEEKLY_PLAN.md](WEEKLY_PLAN.md)

---

## 📝 **License**

MIT License - See [LICENSE](LICENSE) file for details

---

## 🎉 **Status Summary**

```
Backend:     ████████████ 100% ✅ COMPLETE
Frontend:    ░░░░░░░░░░░░   0% ⏳ STARTING WEEK 3
Deployment:  ░░░░░░░░░░░░   0% 🔜 WEEK 5
Overall:     ██████░░░░░░  50%
```

**Last Updated**: February 6, 2026  
**Tests**: 175/175 passing ✅  
**Security**: 90% compliant ✅  
**Ready for**: Frontend development 🚀

---

**🚀 Next Step**: Open [WEEKLY_PLAN.md](WEEKLY_PLAN.md) and start Week 3!
