# Lumo Browser Backend API

Professional-grade REST API backend for Lumo Browser, built with Express.js and SQLite.

## Overview

The backend provides:
- RESTful API endpoints for browser operations
- SQLite database for persistent storage
- Authentication and session management
- Task tracking and execution
- AI provider management
- Workflow execution

## Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:3001`

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Home Page (`/api/home`)

- `GET /data` - Get home page data (tasks, providers, actions, workflows)
- `POST /search` - Execute a search query
- `POST /action/:actionId/execute` - Execute a quick action
- `POST /workflow/:workflowId/execute` - Execute a workflow

### Authentication (`/api/auth`)

- `POST /signup` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user profile
- `PATCH /theme` - Update user theme (light/dark)

### Providers (`/api/providers`)

- `GET /` - List all AI providers
- `POST /` - Add new provider
- `PATCH /:providerId/status` - Update provider status
- `DELETE /:providerId` - Delete provider

### Tasks (`/api/tasks`)

- `GET /` - List recent tasks
- `GET /:taskId` - Get task details
- `POST /` - Create new task
- `PATCH /:taskId` - Update task (status, result, confidence)
- `DELETE /:taskId` - Delete task

### Health (`/api/health`)

- `GET /` - Health check endpoint

## Database Schema

### Users
- `id` - UUID primary key
- `email` - Unique email
- `name` - User name
- `password_hash` - Hashed password
- `avatar_url` - Profile picture
- `theme` - dark | light (default: dark)
- `created_at` / `updated_at` - Timestamps

### Recent Tasks
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `goal` - Task description
- `status` - completed | failed | in-progress
- `result` - Task result/output
- `confidence_score` - 0-1 confidence value
- `timestamp` - Execution time
- `created_at` - Created time

### AI Providers
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `name` - Provider name (OpenAI, Claude, etc.)
- `provider_type` - Type identifier
- `status` - connected | disconnected | error
- `model` - Model name (GPT-4, Claude-3, etc.)
- `api_key_hash` - Hashed API key
- `last_used` - Last usage timestamp
- `is_default` - Default provider flag
- `created_at` / `updated_at` - Timestamps

### Quick Actions
- `id` - UUID primary key
- `user_id` - Foreign key to users (nullable for defaults)
- `title` - Action name
- `description` - Action description
- `icon` - Icon identifier
- `category` - Action category
- `action_type` - Action type
- `execution_count` - Number of executions
- `last_executed` - Last execution time
- `created_at` - Created time

### Workflow Shortcuts
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `name` - Workflow name
- `description` - Workflow description
- `frequency` - daily | hourly | every-6h | weekly
- `enabled` - Enabled flag
- `execution_count` - Number of executions
- `last_executed` - Last execution time
- `created_at` / `updated_at` - Timestamps

### Sessions
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `token` - Session token
- `expires_at` - Expiration time
- `created_at` - Created time

## Project Structure

```
backend/
├── src/
│   ├── server.ts           # Express server setup
│   ├── database.ts         # Database initialization
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   ├── routes/
│   │   ├── home.routes.ts      # Home page endpoints
│   │   ├── auth.routes.ts      # Authentication endpoints
│   │   ├── provider.routes.ts  # Provider management
│   │   └── task.routes.ts      # Task management
│   ├── middleware/
│   │   └── errorHandler.ts # Error handling middleware
│   └── utils/
│       └── logger.ts       # Logging utility
├── package.json
├── tsconfig.json
└── .env.example
```

## Testing

```bash
npm test
```

## TypeScript

Strict mode enabled with zero `any` types allowed.

```bash
npm run type-check
```

## Linting

```bash
npm run lint
npm run lint -- --fix
```

## Code Formatting

```bash
npm run format
```

## Error Handling

Centralized error handling with structured error responses:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "status": 400,
    "timestamp": "2026-05-30T10:30:00.000Z"
  }
}
```

## Logging

Structured JSON logging with configurable levels:

```
LOG_LEVEL=info|debug|warn|error
```

## Security Notes

- Passwords should be hashed with bcrypt (currently using plain text for dev)
- API keys should be encrypted before storage
- CORS is configured for frontend origin
- Add JWT/Bearer token authentication middleware for production
- Enable HTTPS in production
- Rate limiting should be added for production

## Future Enhancements

- JWT authentication tokens
- Database migrations system
- Caching layer (Redis)
- Message queuing (Bull/RabbitMQ)
- WebSocket support for real-time updates
- Comprehensive API documentation (Swagger)
- Advanced logging and monitoring
- Multi-user session management
- Database backup and recovery
- API versioning

## Contributing

Follow project conventions:
- Semantic commit messages
- TypeScript strict mode
- 80%+ test coverage
- Clean Architecture patterns
- SOLID principles

## License

See main project LICENSE file
