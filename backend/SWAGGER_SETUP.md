# Swagger/OpenAPI Documentation Setup

CatalogIt API now includes complete Swagger/OpenAPI documentation for easy API exploration and testing.

## 🌐 Accessing the Swagger UI

Once your Rails server is running, you can access the interactive API documentation at:

**http://localhost:3000/api-docs**

This provides a beautiful, interactive interface where you can:
- Browse all API endpoints
- View request/response schemas
- Test API calls directly from your browser
- See example requests and responses

## 📄 Viewing the OpenAPI Spec

The raw OpenAPI specification is available at:

**http://localhost:3000/api-docs/v1/swagger.yaml**

You can import this spec into tools like:
- Postman
- Insomnia
- API Blueprint
- Any OpenAPI-compatible tool

## 🔧 How It Works

### Gems Used

- **rswag-api**: Serves the OpenAPI specification
- **rswag-ui**: Provides the Swagger UI interface
- **rswag-specs**: Generates OpenAPI docs from RSpec tests

### File Structure

```
backend/
├── spec/
│   ├── swagger_helper.rb          # Main Swagger configuration
│   └── integration/
│       └── api/
│           └── v1/
│               ├── lists_spec.rb  # Lists API documentation
│               └── items_spec.rb  # Items API documentation
└── swagger/
    └── v1/
        └── swagger.yaml           # Generated OpenAPI spec
```

## 🔄 Regenerating Documentation

If you make changes to the API or update the integration specs, regenerate the documentation:

```bash
cd backend
RAILS_ENV=test bundle exec rake rswag:specs:swaggerize
```

This will:
1. Run all integration specs
2. Extract API information from the specs
3. Generate an updated `swagger/v1/swagger.yaml` file

## 📝 Adding New Endpoints

To document a new endpoint:

1. Create or update an integration spec in `spec/integration/api/v1/`
2. Use the rswag DSL to describe the endpoint:

```ruby
require 'swagger_helper'

RSpec.describe 'api/v1/your_resource', type: :request do
  path '/api/v1/your_resource' do
    get('List resources') do
      tags 'YourResource'
      produces 'application/json'
      description 'Retrieves all resources'

      response(200, 'successful') do
        schema type: :array,
          items: { '$ref' => '#/components/schemas/YourResource' }

        run_test!
      end
    end
  end
end
```

3. Add the schema to `swagger_helper.rb` if needed
4. Regenerate the documentation

## 🎨 Customizing the Documentation

Edit `spec/swagger_helper.rb` to customize:
- API title and description
- Server URLs
- Contact information
- Schema definitions
- Security schemes (for authentication)

## 📚 API Overview

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Create account |
| POST | `/api/v1/auth/login` | Sign in, get JWT |
| GET | `/api/v1/auth/me` | Current user info |
| POST | `/api/v1/auth/forgot_password` | Request password reset |
| POST | `/api/v1/auth/reset_password` | Reset password with token |

### Lists Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/lists` | List all public lists |
| POST | `/api/v1/lists` | Create a new list |
| GET | `/api/v1/lists/:id` | Show a specific list |
| PATCH | `/api/v1/lists/:id` | Update a list |
| DELETE | `/api/v1/lists/:id` | Delete a list |
| POST | `/api/v1/lists/:id/share` | Generate share code |
| GET | `/api/v1/lists/shared/:code` | Look up by share code |

### Items Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/lists/:list_id/items` | List all items in a list |
| POST | `/api/v1/lists/:list_id/items` | Create a new item |
| GET | `/api/v1/items/:id` | Show a specific item |
| PATCH | `/api/v1/items/:id` | Update an item |
| DELETE | `/api/v1/items/:id` | Delete an item |

## 🚀 Testing with Swagger UI

1. Start your Rails server: `bundle exec rails server`
2. Open http://localhost:3000/api-docs in your browser
3. Click on any endpoint to expand it
4. Click "Try it out" to test the endpoint
5. Fill in any required parameters
6. Click "Execute" to send the request
7. View the response below

## 📦 Exporting Documentation

You can export the OpenAPI spec in multiple formats:

```bash
# View as YAML
curl http://localhost:3000/api-docs/v1/swagger.yaml

# Save to file
curl http://localhost:3000/api-docs/v1/swagger.yaml > catalogit-api-spec.yaml

# Import into Postman or other tools
```

## 🔗 Useful Links

- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [rswag Documentation](https://github.com/rswag/rswag)
- [rswag Examples](https://github.com/rswag/rswag/blob/master/rswag-specs/README.md)

## ✅ Benefits

- **Interactive Documentation**: Test API endpoints directly from the browser
- **Always Up-to-Date**: Generated from actual tests that verify API behavior
- **Industry Standard**: OpenAPI/Swagger is widely supported
- **Easy Integration**: Import into Postman, Insomnia, or any API client
- **Better Collaboration**: Clear API contracts for frontend developers
