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
- **PostgreSQL 15+** (3NF schema, AES-256 encryption at rest)
- **JWT** (authentication, 24h expiry)
- **bcrypt** (password hashing)
- **ROTP** (TOTP-based MFA for admin accounts)
- **ActiveRecord::Encryption** (AES-256-GCM for sensitive fields)
- **ActiveStorage** (file/image uploads; **S3** in production via `ACTIVE_STORAGE_SERVICE=amazon` + `aws-sdk-s3`)
- **Obscenity + custom moderation service** (strict profanity/slur filtering)
- **RSpec** (core suites passing; Swagger integration specs tracked separately)
- **Swagger/OpenAPI** (interactive docs)

## API Endpoints (33 total)

### Authentication (8)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Create account |
| POST | `/api/v1/auth/login` | Sign in, get JWT (supports MFA) |
| GET | `/api/v1/auth/me` | Current user info (auth required) |
| POST | `/api/v1/auth/forgot_password` | Request password reset token |
| POST | `/api/v1/auth/reset_password` | Reset password with token |
| POST | `/api/v1/auth/mfa/setup` | Generate MFA secret (auth required) |
| POST | `/api/v1/auth/mfa/verify` | Verify code, enable MFA (auth required) |
| DELETE | `/api/v1/auth/mfa` | Disable MFA (auth required) |

### Lists

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/lists` | Public lists (+ own if auth'd) |
| GET | `/api/v1/lists/analytics` | Engagement analytics for current user's lists (auth) |
| GET | `/api/v1/lists/:id` | List with items |
| POST | `/api/v1/lists` | Create list (auth) |
| PATCH | `/api/v1/lists/:id` | Update list (owner) |
| DELETE | `/api/v1/lists/:id` | Delete list (owner) |
| POST | `/api/v1/lists/:id/share` | Generate share code (owner) |
| GET | `/api/v1/lists/shared/:code` | Look up list by share code |
| POST | `/api/v1/lists/:id/like` | Like list (auth) |
| DELETE | `/api/v1/lists/:id/like` | Unlike list (auth) |

> Note: list owners cannot like their own lists.
>
> `GET /api/v1/lists` supports query params for server-side filtering:
> - `search=<text>`
> - `visibility=public|private|shared|all`
> - `sort=newest|oldest|name_asc|name_desc|most_items|most_liked`
> - `owner_only=true` (auth required)
> - `public_only=true`

### Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/lists/:list_id/items` | Items in list |
| GET | `/api/v1/items/:id` | Single item |
| POST | `/api/v1/lists/:list_id/items` | Add item (owner) |
| PATCH | `/api/v1/items/:id` | Update item (owner) |
| DELETE | `/api/v1/items/:id` | Delete item (owner) |
| POST | `/api/v1/items/:id/like` | Like item (auth) |
| DELETE | `/api/v1/items/:id/like` | Unlike item (auth) |

### Attachments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/lists/:list_id/attachments` | List attachments for a list |
| POST | `/api/v1/lists/:list_id/attachments` | Create list attachment (owner) |
| GET | `/api/v1/items/:item_id/attachments` | List attachments for an item |
| POST | `/api/v1/items/:item_id/attachments` | Create item attachment (list owner) |
| DELETE | `/api/v1/attachments/:id` | Delete attachment (list owner) |

> Attachment rules (v1):
> - kinds: `link`, `image`, `file`
> - links must be valid `https://` URLs
> - allowed upload types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `text/plain`, `application/zip`
> - max upload size: 5MB

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/lists/:list_id/comments` | List comments (public/shared lists) |
| POST | `/api/v1/lists/:list_id/comments` | Add comment (auth) |
| DELETE | `/api/v1/comments/:id` | Delete comment (comment owner or list owner) |

> Note: list owners cannot comment on their own lists.

## Security

- **TLS/SSL** enforced in production (HSTS, TLS 1.3)
- **At-rest encryption** (AES-256-GCM via Rails ActiveRecord::Encryption)
- **Admin MFA** (TOTP-based two-factor authentication via rotp)
- **JWT** with 24h expiry + bcrypt password hashing
- **Password reset** with secure tokens (1h expiry)
- **XSS prevention** (sanitize gem)
- **Profanity/slur filtering** (`obscenity` dictionary + strict custom slur patterns)
- **Rate limiting** (Rack::Attack)
- **User status management** (active/suspended/deleted)
- **CORS** (environment-based origins)
- **Owner-based authorization** (IDOR prevention)

## Testing

```bash
RAILS_ENV=test bundle exec rspec spec/models spec/requests spec/services
RAILS_ENV=test bundle exec rspec --format documentation
```

## Documentation

| File | Purpose |
|------|---------|
| [AUTHENTICATION.md](AUTHENTICATION.md) | JWT auth + password reset guide |
| [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md) | Security controls |
| [TESTING.md](TESTING.md) | Test guide + patterns |
| [SWAGGER_SETUP.md](SWAGGER_SETUP.md) | API docs setup |
