# Testing Guide for CatalogIt API

*Last reviewed: March 21, 2026 — attachment kinds include `note`; run full suite after DB migrations.*

## Test Coverage Summary

### ✅ Core Backend Test Suites Passing

- **Scope**: `spec/models`, `spec/requests`, `spec/services`
- **Includes**:
  - authentication + authorization
  - list/item CRUD
  - comments and reactions (likes)
  - security behavior (XSS sanitization, rate limiting helpers, status checks)

### Test Breakdown by Category

#### 1. Authentication (`spec/requests/api/v1/authentication_spec.rb`)
- **Signup Tests** (8 tests)
  - Valid user creation with token return
  - Password hashing verification
  - Duplicate email/username rejection
  - Invalid email format handling
  - Password confirmation mismatch

- **Login Tests** (6 tests)
  - Successful login with valid credentials
  - Token generation and return
  - Invalid password rejection
  - Non-existent user handling
  - Missing credentials handling

- **Current User Tests** (6 tests)
  - Valid token authentication
  - Invalid token rejection
  - Expired token rejection
  - Missing token handling
  - Password exclusion from response

#### 2. Authorization (`spec/requests/api/v1/authorization_spec.rb`)
- **Lists Authorization** (27 tests)
  - Public list access without authentication
  - Private list access control
  - Owner-only create/update/delete operations
  - Cross-user access prevention
  - Authenticated vs unauthenticated access patterns

- **Items Authorization** (17 tests)
  - Item access based on parent list visibility
  - Owner-only item modifications
  - Cascading authorization from lists
  - Cross-user item access prevention

- **Token Validation** (3 tests)
  - Expired token rejection
  - Invalid token format handling
  - Malformed Authorization header handling

#### 3. JWT Service (`spec/services/json_web_token_spec.rb`)
- **Token Encoding** (5 tests)
  - JWT format validation
  - Payload inclusion
  - Expiration time setting
  - Custom expiration support

- **Token Decoding** (6 tests)
  - Valid token decoding
  - Invalid token rejection
  - Expired token handling
  - Nil/empty token handling
  - HashWithIndifferentAccess return type

- **Security Tests** (3 tests)
  - Secret key validation
  - Signature verification
  - Token tampering detection

- **Edge Cases** (3 tests)
  - Complex payloads
  - Special characters in data
  - Large user IDs

#### 4. Model Tests (`spec/models/`)
- **User Model** (9 tests)
  - Validations (username, email, role)
  - Associations (has_many lists)
  - Password security (has_secure_password)
  - Default values
  - Factory validity

- **List Model**
  - Validations (title, visibility)
  - Associations (belongs_to user, has_many items)
  - Scopes (public_lists)
  - Dependent destroy
  - Factory validity

- **Item Model**
  - Validations (name, rating range)
  - Associations (belongs_to list)
  - Rating constraints
  - Factory validity

## Running Tests

### Run All Core Tests
```bash
cd backend
RAILS_ENV=test bundle exec rspec spec/requests spec/services spec/models
```

### Run Specific Test Suites

**Authentication Tests Only:**
```bash
RAILS_ENV=test bundle exec rspec spec/requests/api/v1/authentication_spec.rb
```

**Authorization Tests Only:**
```bash
RAILS_ENV=test bundle exec rspec spec/requests/api/v1/authorization_spec.rb
```

**JWT Service Tests Only:**
```bash
RAILS_ENV=test bundle exec rspec spec/services/json_web_token_spec.rb
```

**Model Tests Only:**
```bash
RAILS_ENV=test bundle exec rspec spec/models
```

### Run Tests with Documentation Format
```bash
RAILS_ENV=test bundle exec rspec --format documentation
```

### Run Specific Test
```bash
RAILS_ENV=test bundle exec rspec spec/requests/api/v1/authentication_spec.rb:20
```

## Test Factories

We use FactoryBot for test data creation. Available factories:

### User Factory
```ruby
create(:user)                    # Regular user
create(:user, :admin)            # Admin user
create(:user, email: 'test@example.com')  # Custom attributes
```

### List Factory
```ruby
create(:list)                    # Private list
create(:list, :public)           # Public list
create(:list, :with_items)       # List with 3 items
create(:list, user: user)        # List for specific user
```

### Item Factory
```ruby
create(:item)                    # Basic item
create(:item, list: list)        # Item for specific list
create(:item, rating: 5)         # Item with rating
```

## Integration Tests (Swagger / OpenAPI)

**Current status:** Swagger integration specs are not part of the core pass gate.  
They may fail until OpenAPI examples are refreshed for the latest auth + permission behavior.

To update integration tests:
1. Add JWT token generation in `spec/integration/api/v1/*_spec.rb`
2. Include `Authorization: Bearer {token}` header in requests
3. Update request examples to match new authentication requirements

## Continuous Integration

### Pre-commit Checklist
- [ ] Core backend suites passing (`spec/models`, `spec/requests`, `spec/services`)
- [ ] No new linter errors introduced
- [ ] Authentication headers included in protected endpoint tests
- [ ] Factories updated if models changed
- [ ] New features have corresponding tests

### Test Coverage Goals
- **Current Coverage**: ~95% for authentication and authorization
- **Target Coverage**: 95%+ for all new features
- **Critical Paths**: 100% coverage for authentication and authorization

## Common Test Patterns

### Testing Authenticated Endpoints
```ruby
let(:user) { create(:user) }
let(:token) { JsonWebToken.encode(user_id: user.id) }
let(:auth_headers) { { 'Authorization' => "Bearer #{token}" } }

it 'allows authenticated access' do
  get '/api/v1/protected', headers: auth_headers
  expect(response).to have_http_status(:ok)
end
```

### Testing Authorization
```ruby
let(:owner) { create(:user) }
let(:other_user) { create(:user) }
let(:resource) { create(:list, user: owner) }

it 'allows owner access' do
  token = JsonWebToken.encode(user_id: owner.id)
  patch "/api/v1/lists/#{resource.id}", 
        headers: { 'Authorization' => "Bearer #{token}" },
        params: { list: { title: 'Updated' } }
  expect(response).to have_http_status(:ok)
end

it 'denies non-owner access' do
  token = JsonWebToken.encode(user_id: other_user.id)
  patch "/api/v1/lists/#{resource.id}",
        headers: { 'Authorization' => "Bearer #{token}" },
        params: { list: { title: 'Updated' } }
  expect(response).to have_http_status(:forbidden)
end
```

### Testing Token Expiration
```ruby
it 'rejects expired tokens' do
  expired_token = JsonWebToken.encode({ user_id: user.id }, 1.hour.ago)
  get '/api/v1/auth/me', headers: { 'Authorization' => "Bearer #{expired_token}" }
  expect(response).to have_http_status(:unauthorized)
end
```

## Troubleshooting

### Tests Failing After Checkout
```bash
# Reset test database
RAILS_ENV=test bundle exec rake db:reset

# Reinstall dependencies
bundle install

# Re-run tests
RAILS_ENV=test bundle exec rspec
```

### Authentication Tests Failing
- Check if `JsonWebToken` service is loaded (see `config/application.rb`)
- Verify JWT gem is installed: `bundle list | grep jwt`
- Ensure test database has users table: `RAILS_ENV=test bundle exec rake db:migrate`

### Factory Errors
- Check factory definitions in `spec/factories/`
- Ensure all required attributes are provided
- Verify associations are correctly defined

## Next Steps

1. **Refresh Swagger Integration Specs**
   - Update authentication and ownership scenarios in `spec/integration/api/v1/*`
   - Regenerate endpoint examples to match current API responses

2. **Add More Multi-user Request Specs**
   - Expanded moderation and reaction edge cases

3. **Performance Tests** (Future)
   - JWT token generation benchmarks
   - Database query optimization
   - Concurrent request handling

## Resources

- [RSpec Documentation](https://rspec.info/)
- [FactoryBot Guide](https://github.com/thoughtbot/factory_bot)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [Rails Testing Guide](https://guides.rubyonrails.org/testing.html)
