# Phase 0: Foundation Setup

This directory contains the Phase 0 implementation of the Multi-Agent Kanban Board system.

## Project Structure

```
multi-agent-orchestrator/
├── frontend/           # Next.js frontend application
├── backend/            # Express.js backend API
├── mcp-server/         # MCP server for board manipulation tools
├── k8s/              # Kubernetes manifests
│   ├── base/          # Base deployments and services
│   ├── configmaps/    # Configuration
│   ├── secrets/       # Secrets (API keys, passwords)
│   └── overlays/      # Environment-specific overlays
└── deploy.sh         # Deployment script
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│  PostgreSQL │
│  (Next.js)  │     │  (Express)  │     │   (DB)      │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  MCP Server │
                    │  (Tools)    │
                    └─────────────┘
```

## Prerequisites

- ✅ Kubernetes (kubectl v1.31+)
- ✅ Docker (v20+)
- ✅ Node.js (v20+)
- ✅ npm (v11+)

## Quick Start

### Option A: Docker Compose (Recommended for Local Development)

Docker Compose is the simplest way to run the application locally without Kubernetes.

```bash
# Quick start (one command)
make setup

# Or manually
make up              # Start all services
make db-migrate       # Run migrations
make db-seed         # Seed database
```

**Access the application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MCP Server: http://localhost:4000

**Development mode (hot-reload)**:
```bash
make dev             # Start with hot-reload
```

See [DOCKER_COMPOSE.md](./DOCKER_COMPOSE.md) for detailed Docker Compose guide.

### Option B: Kubernetes (For Production and K8s Development)

```bash
# Build all Docker images and deploy to Kubernetes
./deploy.sh
```

This will:
1. Build Docker images (frontend, backend, mcp-server)
2. Apply ConfigMaps and Secrets
3. Deploy all services to Kubernetes
4. Wait for pods to be ready

### 2. Access the Application

**Option 1: Using NodePort (frontend service)**
```bash
# Frontend is exposed on NodePort 30080
open http://localhost:30080
```

**Option 2: Using Port-Forwarding**
```bash
# Terminal 1: Forward frontend
kubectl port-forward svc/frontend-service 3000:3000

# Terminal 2: Forward backend
kubectl port-forward svc/backend-service 3001:3001

# Terminal 3: Forward MCP server
kubectl port-forward svc/mcp-server-service 4000:4000
```

Then open http://localhost:3000

### 3. View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend

# MCP server logs
kubectl logs -f deployment/mcp-server

# Frontend logs
kubectl logs -f deployment/frontend

# PostgreSQL logs
kubectl logs -f statefulset/postgres
```

### 4. Database Initialization

The database schema is applied automatically by PostgreSQL. To create a default user and board:

```bash
# Run seed script in backend pod
kubectl exec -it deployment/backend -- npm run seed
```

This creates:
- User: `user@example.com` / `password123`
- Board: `My Kanban Board`
- Columns: Backlog, To Do, In Progress, Done

## Manual Deployment Steps

If you prefer to deploy manually:

### Build Docker Images

```bash
docker build -t kanban-frontend:latest ./frontend
docker build -t kanban-backend:latest ./backend
docker build -t kanban-mcp-server:latest ./mcp-server
```

### Apply Kubernetes Resources

```bash
# Apply ConfigMaps
kubectl apply -f k8s/configmaps/frontend-config.yaml
kubectl apply -f k8s/configmaps/backend-config.yaml
kubectl apply -f k8s/configmaps/mcp-config.yaml

# Apply Secrets
kubectl apply -f k8s/secrets/db-secrets.yaml
kubectl apply -f k8s/secrets/api-secrets.yaml

# Apply Deployments and Services
kubectl apply -f k8s/base/postgres-statefulset.yaml
kubectl apply -f k8s/base/backend-deployment.yaml
kubectl apply -f k8s/base/mcp-server-deployment.yaml
kubectl apply -f k8s/base/frontend-deployment.yaml

# Or use Kustomize
kubectl apply -k k8s/base
```

## Service Configuration

### Frontend Service
- **Type**: NodePort (for dev access)
- **Port**: 3000 (ClusterIP)
- **NodePort**: 30080
- **Replicas**: 2

### Backend Service
- **Type**: ClusterIP
- **Port**: 3001
- **Replicas**: 2

### MCP Server Service
- **Type**: ClusterIP
- **Port**: 4000
- **Replicas**: 1

### PostgreSQL Service
- **Type**: ClusterIP
- **Port**: 5432
- **Replicas**: 1 (StatefulSet)
- **Storage**: 10Gi PersistentVolume

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods
kubectl describe pod <pod-name>
```

### View Logs

```bash
kubectl logs <pod-name> -f
```

### Restart a Deployment

```bash
kubectl rollout restart deployment/backend
kubectl rollout restart deployment/frontend
kubectl rollout restart deployment/mcp-server
```

### Scale Deployments

```bash
kubectl scale deployment/backend --replicas=3
kubectl scale deployment/frontend --replicas=3
```

### Access PostgreSQL directly

```bash
kubectl exec -it statefulset/postgres-0 -- psql -U kanban -d kanban
```

### Clean up all resources

```bash
kubectl delete -k k8s/base
```

## Configuration

### Environment Variables

The following environment variables are configured via ConfigMaps:

**Backend:**
- `NODE_ENV`: production
- `PORT`: 3001
- `DATABASE_HOST`: postgres-service
- `DATABASE_PORT`: 5432
- `DATABASE_NAME`: kanban
- `MCP_SERVER_URL`: http://mcp-server-service:4000

**MCP Server:**
- `NODE_ENV`: production
- `PORT`: 4000
- `DATABASE_HOST`: postgres-service
- `DATABASE_PORT`: 5432
- `DATABASE_NAME`: kanban

**Frontend:**
- `NEXT_PUBLIC_API_URL`: http://backend-service:3001

### Secrets

The following secrets need to be configured:

**Database Secrets (db-secrets):**
- `username`: Database user (default: kanban)
- `password`: Database password (default: kanban_password)

**API Secrets (api-secrets):**
- `JWT_SECRET`: JWT signing secret
- `CLAUDE_API_KEY`: Anthropic API key (for future use)
- `OPENAI_API_KEY`: OpenAI API key (for future use)

## Next Steps

### For Docker Compose Users

After starting with `make setup`:

1. ✅ Verify frontend loads at http://localhost:3000
2. ✅ Test backend health: `curl http://localhost:3001/health`
3. ✅ Test MCP server health: `curl http://localhost:4000/health`
4. ✅ Seed database (if not done by setup): `make db-seed`
5. ✅ Move to Phase 1: Single Agent MVP

### For Kubernetes Users

After Phase 0 is deployed and tested:

1. ✅ Verify frontend loads at http://localhost:30080
2. ✅ Test backend health: `kubectl port-forward svc/backend-service 3001:3001` → curl http://localhost:3001/health
3. ✅ Test MCP server health: `kubectl port-forward svc/mcp-server-service 4000:4000` → curl http://localhost:4000/health
4. ✅ Seed database with default user and board
5. ✅ Move to Phase 1: Single Agent MVP

## Troubleshooting

### Pods stuck in ErrImageNeverPull or ImagePullBackOff

When using `imagePullPolicy: Never` with local Kubernetes, pods may fail to start if the images are not available on all nodes.

**Solutions:**

#### Option 1: Load images into Kubernetes (for minikube/k3s)
```bash
# For minikube
minikube image load kanban-backend:latest
minikube image load kanban-frontend:latest
minikube image load kanban-mcp-server:latest

# For k3s
k3d image load kanban-backend:latest
k3d image load kanban-frontend:latest
k3d image load kanban-mcp-server:latest
```

#### Option 2: Use imagePullPolicy: IfNotPresent
Update deployments to use `imagePullPolicy: IfNotPresent` instead of `Never` and ensure images are tagged correctly.

#### Option 3: Use Docker Compose (Recommended for Local Dev)

For local development, Docker Compose is the easiest option:

```bash
# Production mode
make up

# Development mode with hot-reload
make dev

# Or use docker-compose directly
docker-compose up
docker-compose --profile dev up
```

See [DOCKER_COMPOSE.md](./DOCKER_COMPOSE.md) for comprehensive Docker Compose guide.

#### Option 4: Run components locally (without Kubernetes)
```bash
# Terminal 1: PostgreSQL
docker run -d --name kanban-postgres \
  -e POSTGRES_USER=kanban \
  -e POSTGRES_PASSWORD=kanban_password \
  -e POSTGRES_DB=kanban \
  -p 5432:5432 \
  postgres:15-alpine

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: MCP Server
cd mcp-server && npm run dev

# Terminal 4: Frontend
cd frontend && npm run dev
```

### Insufficient CPU resources

If pods fail to schedule with "Insufficient cpu" error:
```bash
# Check resource usage
kubectl describe nodes

# Scale down deployments
kubectl scale deployment/backend --replicas=1
kubectl scale deployment/frontend --replicas=1

# Or reduce resource requests in deployment manifests
```

### Pods stuck in Pending

If pods stay in Pending state:
```bash
# Check pod events for issues
kubectl describe pod <pod-name>

# Common issues:
# - Insufficient resources (scale down or reduce requests)
# - Image pull errors (check imagePullPolicy)
# - Node selector not matching (check node labels)
```

## Development Notes

### Running locally (without Kubernetes)

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**MCP Server:**
```bash
cd mcp-server
npm install
npm run dev
```

### Building for Production

```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && npm run build

# MCP Server
cd mcp-server && npm run build
```

## Status

- ✅ Project structure created
- ✅ Frontend (Next.js + TypeScript)
- ✅ Backend (Express + TypeScript)
- ✅ MCP Server (Node.js + TypeScript)
- ✅ Database schema (PostgreSQL)
- ✅ Docker images (multi-stage builds)
- ✅ Kubernetes manifests (Deployments + Services)
- ✅ ConfigMaps and Secrets
- ✅ Basic kanban UI (drag-drop)
- ⏳ Authentication system (Phase 1+)
- ⏳ Agent integration (Phase 1+)

---

**Last Updated**: 2026-01-23
