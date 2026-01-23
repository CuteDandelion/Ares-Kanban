#!/bin/bash

set -e

echo "🚀 Building and Deploying Multi-Agent Kanban Board to Kubernetes"
echo "============================================================="

# Build Docker images
echo "📦 Building Docker images..."
docker build -t kanban-frontend:latest ./frontend
docker build -t kanban-backend:latest ./backend
docker build -t kanban-mcp-server:latest ./mcp-server

echo "✅ Docker images built successfully"

# Apply ConfigMaps and Secrets
echo "🔧 Applying ConfigMaps and Secrets..."
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/secrets/

echo "✅ ConfigMaps and Secrets applied"

# Apply Kubernetes manifests
echo "📋 Applying Kubernetes manifests..."
kubectl apply -k k8s/base

echo "✅ Kubernetes manifests applied"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s

echo "✅ PostgreSQL is ready"

# Wait for pods to be ready
echo "⏳ Waiting for all pods to be ready..."
kubectl wait --for=condition=ready pod -l app=backend --timeout=120s
kubectl wait --for=condition=ready pod -l app=mcp-server --timeout=120s
kubectl wait --for=condition=ready pod -l app=frontend --timeout=120s

echo "✅ All pods are ready"

# Show pod status
echo ""
echo "📊 Pod Status:"
kubectl get pods -l app in (postgres,backend,mcp-server,frontend)

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:30080 (via NodePort)"
echo "   Or use port-forward:"
echo "   kubectl port-forward svc/frontend-service 3000:3000"
echo ""
echo "🔍 To view logs:"
echo "   kubectl logs -f deployment/backend"
echo "   kubectl logs -f deployment/mcp-server"
echo "   kubectl logs -f deployment/frontend"
