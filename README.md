# CatalogIt

A production-ready web application for creating and sharing personal lists (movies, books, collectibles).

**Course: CS701**

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Ruby on Rails (API Mode)
- **Database:** PostgreSQL
- **Deployment:** AWS Free Tier (Dockerized)

## Project Structure

```
catalog-it/
├── backend/              # Rails API (PostgreSQL)
├── frontend/             # React Vite app (coming soon)
├── docs/                 # Design prototypes (HTML mockups)
├── frontend_files/       # React component templates
├── docker-compose.yml    # Docker orchestration
├── FRONTEND_SETUP.md     # Frontend setup guide
└── README.md             # This file
```

## Setup Instructions

### Prerequisites

- Ruby 4.0+ and Rails 8+
- Node.js 18+ and npm
- PostgreSQL 15+

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   bundle install
   ```

2. **Configure database:**
   ```bash
   # Copy the example file
   cp config/database.yml.example config/database.yml
   
   # Edit config/database.yml and set your database username
   # Or set environment variable:
   export DATABASE_USERNAME=your_username
   ```

3. **Create and migrate database:**
   ```bash
   rails db:create
   rails db:migrate
   rails db:seed
   ```

4. **Start the server:**
   ```bash
   rails server
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/lists | Get all public lists |
| GET | /api/v1/lists/:id | Get a specific list |
| POST | /api/v1/lists | Create a new list |
| PATCH | /api/v1/lists/:id | Update a list |
| DELETE | /api/v1/lists/:id | Delete a list |
| GET | /api/v1/lists/:list_id/items | Get items in a list |
| POST | /api/v1/lists/:list_id/items | Add item to a list |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Note:** Never commit `.env`, `database.yml`, or `master.key` to version control!

## Development

- Backend API runs on: http://localhost:3000
- Health check: http://localhost:3000/up

## License

MIT
