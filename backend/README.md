# CatalogIt Backend

Rails 8 API backend for the CatalogIt cataloging platform.

## Quick Start

```bash
bundle install
cp config/database.yml.example config/database.yml
rails db:create db:migrate db:seed
bundle exec puma -p 3000
```

API: **http://localhost:3000** | Swagger: **http://localhost:3000/api-docs**

## Stack

- **Ruby on Rails 8** (API mode)
- **PostgreSQL 15+** (3NF schema)
- **JWT** (authentication, 24h expiry)
- **bcrypt** (password hashing)
- **RSpec** (175 tests passing)
- **Swagger/OpenAPI** (interactive docs)

## API Endpoints (17 total)

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Create account |
| POST | `/api/v1/auth/login` | Sign in, get JWT |
| GET | `/api/v1/auth/me` | Current user info (auth required) |
| POST | `/api/v1/auth/forgot_password` | Request password reset token |
| POST | `/api/v1/auth/reset_password` | Reset password with token |

### Lists

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/lists` | Public lists (+ own if auth'd) |
| GET | `/api/v1/lists/:id` | List with items |
| POST | `/api/v1/lists` | Create list (auth) |
| PATCH | `/api/v1/lists/:id` | Update list (owner) |
| DELETE | `/api/v1/lists/:id` | Delete list (owner) |
| POST | `/api/v1/lists/:id/share` | Generate share code (owner) |
| GET | `/api/v1/lists/shared/:code` | Look up list by share code |

### Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/lists/:list_id/items` | Items in list |
| GET | `/api/v1/items/:id` | Single item |
| POST | `/api/v1/lists/:list_id/items` | Add item (owner) |
| PATCH | `/api/v1/items/:id` | Update item (owner) |
| DELETE | `/api/v1/items/:id` | Delete item (owner) |

## Security

- JWT with 24h expiry + bcrypt password hashing
- Password reset with secure tokens (1h expiry)
- XSS prevention (sanitize gem)
- Rate limiting (Rack::Attack)
- User status management (active/suspended/deleted)
- CORS (environment-based origins)
- Owner-based authorization (IDOR prevention)

## Testing

```bash
RAILS_ENV=test bundle exec rspec          # all 175 tests
RAILS_ENV=test bundle exec rspec --format documentation  # verbose
```

## Documentation

| File | Purpose |
|------|---------|
| [AUTHENTICATION.md](AUTHENTICATION.md) | JWT auth + password reset guide |
| [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md) | Security controls |
| [TESTING.md](TESTING.md) | Test guide + patterns |
| [SWAGGER_SETUP.md](SWAGGER_SETUP.md) | API docs setup |
