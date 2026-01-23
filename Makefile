.PHONY: help build up down restart logs clean dev test db-migrate db-seed db-backup db-restore health

# Default target
help:
	@echo "Multi-Agent Kanban Board - Docker Compose Commands"
	@echo ""
	@echo "Production Commands:"
	@echo "  make build           - Build all Docker images"
	@echo "  make up              - Start all services (production mode)"
	@echo "  make down            - Stop all services"
	@echo "  make restart         - Restart all services"
	@echo "  make logs            - View logs for all services"
	@echo "  make clean           - Stop services and remove volumes (WARNING: deletes data)"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev             - Start all services in development mode (hot-reload)"
	@echo "  make dev-build       - Build development images"
	@echo "  make dev-down        - Stop development services"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-migrate      - Run database migrations"
	@echo "  make db-seed         - Seed database with initial data"
	@echo "  make db-backup       - Backup database to backup.sql"
	@echo "  make db-restore      - Restore database from backup.sql"
	@echo "  make db-shell        - Open PostgreSQL shell"
	@echo ""
	@echo "Health & Monitoring:"
	@echo "  make health          - Check health of all services"
	@echo "  make stats           - View resource usage statistics"
	@echo ""
	@echo "Test Commands:"
	@echo "  make test            - Run all tests"
	@echo "  make test-backend    - Run backend tests"
	@echo "  make test-frontend   - Run frontend tests"
	@echo ""
	@echo "Other:"
	@echo "  make rebuild         - Rebuild all images without cache"
	@echo "  make clean-all       - Complete cleanup (images + volumes)"

# Build images
build:
	docker-compose build

# Start services (production)
up:
	docker-compose up -d
	@echo "Services started:"
	@echo "  Frontend:  http://localhost:3000"
	@echo "  Backend:   http://localhost:3001"
	@echo "  MCP:       http://localhost:4000"
	@echo "  Postgres:  localhost:5432"

# Stop services
down:
	docker-compose down

# Restart services
restart:
	docker-compose restart

# View logs
logs:
	docker-compose logs -f

# Stop and remove everything
clean:
	@echo "⚠️  WARNING: This will delete all data including database!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "✓ All services stopped and volumes removed"; \
	else \
		echo "Cancelled"; \
	fi

# Start development mode (hot-reload)
dev:
	docker-compose --profile dev up

# Build development images
dev-build:
	docker-compose --profile dev build

# Stop development services
dev-down:
	docker-compose --profile dev down

# Run database migrations
db-migrate:
	docker-compose exec backend npm run migrate

# Seed database
db-seed:
	docker-compose exec backend npm run seed

# Backup database
db-backup:
	docker-compose exec postgres pg_dump -U kanban kanban > backup.sql
	@echo "✓ Database backed up to backup.sql"

# Restore database
db-restore:
	cat backup.sql | docker-compose exec -T postgres psql -U kanban kanban
	@echo "✓ Database restored from backup.sql"

# Open PostgreSQL shell
db-shell:
	docker-compose exec postgres psql -U kanban -d kanban

# Check health of all services
health:
	@echo "Checking service health..."
	@echo ""
	@docker-compose ps
	@echo ""
	@echo "Manual health checks:"
	@echo "  Backend:  $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/health)"
	@echo "  MCP:      $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/health)"
	@echo "  Frontend: $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000)"

# View resource usage
stats:
	docker stats

# Run all tests
test:
	docker-compose exec backend npm test
	docker-compose exec frontend npm test

# Run backend tests
test-backend:
	docker-compose exec backend npm test

# Run frontend tests
test-frontend:
	docker-compose exec frontend npm test

# Rebuild without cache
rebuild:
	docker-compose build --no-cache
	docker-compose up -d

# Complete cleanup
clean-all:
	@echo "⚠️  WARNING: This will delete ALL images and data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down --rmi all -v; \
		echo "✓ Complete cleanup finished"; \
	else \
		echo "Cancelled"; \
	fi

# Quick setup (build + up + migrate + seed)
setup: build up
	@echo "Waiting for services to start..."
	@sleep 10
	@echo "Running migrations..."
	@make db-migrate
	@echo "Seeding database..."
	@make db-seed
	@echo ""
	@echo "✓ Setup complete! Access the application at http://localhost:3000"
