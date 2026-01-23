# Docker Compose Guide

This guide explains how to use Docker Compose to run the Multi-Agent Kanban Board locally without Kubernetes.

## Quick Start

### Production Mode (with Docker images)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# MCP Server: http://localhost:4000
# PostgreSQL: localhost:5432
```

### Development Mode (with hot-reload)

```bash
# Start all services in development mode
docker-compose --profile dev up

# Or start specific services
docker-compose --profile dev up backend-dev mcp-server-dev

# View logs for specific service
docker-compose logs -f backend-dev
```

### With Redis (for Phase 5+)

```bash
# Start all services including Redis
docker-compose --profile redis up -d
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 3000 | Next.js web application |
| backend | 3001 | Express.js API server |
| mcp-server | 4000 | MCP server for board manipulation |
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Redis cache (optional, with --profile redis) |

## Usage Examples

### Start and Stop

```bash
# Start all services in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v

# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### View Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs backend
docker-compose logs -f backend-dev  # Development mode
```

### Run Commands in Containers

```bash
# Run database migration
docker-compose exec backend npm run migrate

# Seed database with initial data
docker-compose exec backend npm run seed

# Access PostgreSQL directly
docker-compose exec postgres psql -U kanban -d kanban

# Access shell in a container
docker-compose exec backend sh
```

### Build and Rebuild

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and start
docker-compose up -d --build

# Force rebuild without cache
docker-compose build --no-cache
```

### Scale Services

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Note: Scaling requires proper load balancing configuration
```

## Environment Variables

Create a `.env` file in the project root to configure environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Required Variables

- `POSTGRES_USER`: Database username (default: `kanban`)
- `POSTGRES_PASSWORD`: Database password (default: `kanban_password`)
- `POSTGRES_DB`: Database name (default: `kanban`)

### Optional Variables

- `CLAUDE_API_KEY`: Anthropic API key for Claude integration (Phase 1+)
- `OPENAI_API_KEY`: OpenAI API key for GPT integration (Phase 1+)
- `JWT_SECRET`: JWT signing secret (change in production!)

## Profiles

### Production Profile (default)

Runs services with pre-built Docker images:

```bash
docker-compose up -d
```

### Development Profile

Runs services with hot-reload and volume mounts:

```bash
docker-compose --profile dev up
```

Development services include:
- `backend-dev` - Backend with hot-reload on port 3001 (debug: 9229)
- `mcp-server-dev` - MCP server with hot-reload on port 4000 (debug: 9229)
- `frontend-dev` - Frontend with hot-reload on port 3000

### Redis Profile

Adds Redis service for caching and job queues (Phase 5+):

```bash
docker-compose --profile redis up -d
```

### Combined Profiles

You can combine profiles:

```bash
# Development + Redis
docker-compose --profile dev --profile redis up
```

## Database Management

### Initialize Database

The database is automatically created when PostgreSQL starts. To initialize with schema and seed data:

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Seed with initial data
docker-compose exec backend npm run seed
```

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U kanban kanban > backup.sql

# Restore from backup
cat backup.sql | docker-compose exec -T postgres psql -U kanban kanban
```

### Access Database

```bash
# Using psql
docker-compose exec postgres psql -U kanban -d kanban

# Example queries
\dt                    # List tables
SELECT * FROM users;    # View users
SELECT * FROM boards;   # View boards
```

## Troubleshooting

### Services Won't Start

```bash
# Check service status
docker-compose ps

# Check logs for errors
docker-compose logs <service-name>

# Common issues:
# - Port conflicts: Change ports in docker-compose.yml
# - Volume issues: Remove with `docker-compose down -v`
# - Build failures: Rebuild with `docker-compose build --no-cache`
```

### Database Connection Errors

```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec backend npm run health
```

### Out of Sync (Code Changes Not Reflecting)

```bash
# For dev mode: Restart containers
docker-compose restart backend-dev

# For production: Rebuild images
docker-compose up -d --build
```

### Clear Everything and Start Fresh

```bash
# Stop all services and remove volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## Health Checks

All services include health checks. Check status with:

```bash
docker-compose ps
```

You should see `healthy` status for all services.

Manual health checks:

```bash
# Backend health
curl http://localhost:3001/health

# MCP server health
curl http://localhost:4000/health

# Frontend health
curl http://localhost:3000

# PostgreSQL
docker-compose exec postgres pg_isready -U kanban
```

## Performance Tips

### Use BuildKit for Faster Builds

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
docker-compose build
```

### Limit Resource Usage

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Use Volume Caching

Development mode uses volume mounts for instant hot-reload without rebuilds.

## Production Deployment

For production deployment, use Kubernetes instead of Docker Compose. See `PHASE0_README.md` for Kubernetes deployment guide.

## Next Steps

After starting the application:

1. Access frontend at http://localhost:3000
2. Verify backend health: `curl http://localhost:3001/health`
3. Run database migrations: `docker-compose exec backend npm run migrate`
4. Seed database: `docker-compose exec backend npm run seed`
5. Test MCP server: `curl http://localhost:4000/health`
6. Start developing! 🚀

## Additional Commands

```bash
# View resource usage
docker stats

# Inspect container
docker inspect <container-id>

# View container processes
docker-compose top <service-name>

# Execute command
docker-compose exec <service-name> <command>

# Run one-off command
docker-compose run <service-name> <command>
```

## See Also

- [PHASE0_README.md](./PHASE0_README.md) - Kubernetes deployment
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development log and architecture
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
