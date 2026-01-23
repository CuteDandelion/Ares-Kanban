---
name: devops
description: DevOps capabilities including Docker, Kubernetes, CI/CD, and Infrastructure as Code
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineers
  expertise: devops
---

## What I do

I provide comprehensive DevOps capabilities for building, deploying, and managing modern applications.

### Core Capabilities

#### Containerization (Docker)
- Create Dockerfiles for applications
- Build and optimize Docker images
- Run and manage containers
- Configure Docker networks and volumes
- Use Docker Compose for multi-container apps
- Container security best practices
- Multi-stage builds for smaller images

#### Orchestration (Kubernetes)
- Design Kubernetes manifests (YAML)
- Deploy applications to K8s
- Configure services and ingress
- Manage deployments and rolling updates
- Use Helm charts for templating
- Configure ConfigMaps and Secrets
- Resource limits and requests
- Health checks and liveness probes

#### CI/CD Pipelines
- Design and implement CI/CD workflows
- GitHub Actions workflows
- GitLab CI pipelines
- Jenkins pipelines
- Automated testing integration
- Automated deployments
- Rollback strategies

#### Infrastructure as Code (IaC)
- Terraform for cloud infrastructure
- AWS CloudFormation
- Google Cloud Deployment Manager
- Ansible for configuration management
- Environment management (dev, staging, prod)
- Infrastructure drift detection

#### Monitoring & Logging
- Set up monitoring with Prometheus
- Use Grafana for dashboards
- Configure log aggregation with ELK stack
- Application performance monitoring (APM)
- Alert configuration
- Health checks and uptime monitoring

#### Cloud Services
- AWS services (EC2, EKS, RDS, S3, Lambda)
- Google Cloud (GKE, Cloud SQL, Cloud Functions)
- Azure services (AKS, SQL Database, Functions)
- Multi-cloud strategies
- Cost optimization

#### Automation
- Automate repetitive tasks
- Scripting with Bash, Python
- Configuration management with Ansible
- Infrastructure provisioning
- Deployment automation
- Scaling automation

## When to use me

Use this when you need to:
- Containerize an application
- Deploy to Kubernetes
- Set up CI/CD pipelines
- Manage cloud infrastructure
- Automate deployments
- Monitor applications
- Scale applications
- Implement IaC practices

## Docker Commands

```bash
# Build and run
docker build -t app:latest .
docker run -p 8080:8080 app:latest
docker compose up -d

# Management
docker ps -a
docker logs <container>
docker exec -it <container> bash
docker images
docker rmi <image>
```

## Kubernetes Commands

```bash
# Deploy and manage
kubectl apply -f deployment.yaml
kubectl get pods -n namespace
kubectl logs <pod>
kubectl exec -it <pod> -- bash
kubectl scale deployment/app --replicas=3

# Services and ingress
kubectl expose deployment/app --port=80
kubectl get svc
kubectl describe ingress
```

## Helm Commands

```bash
# Chart operations
helm install myapp ./chart
helm upgrade myapp ./chart
helm rollback myapp
helm uninstall myapp
helm list
```

## Terraform Commands

```bash
# Infrastructure management
terraform init
terraform plan
terraform apply
terraform destroy
terraform validate
```

## CI/CD Examples

### GitHub Actions
```yaml
name: CI/CD
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy
        run: kubectl apply -f k8s/
```

### GitLab CI
```yaml
stages:
  - test
  - build
  - deploy

test:
  script:
    - npm test

deploy:
  stage: deploy
  script:
    - kubectl apply -f k8s/
```

## Best Practices I Follow

1. **Container Best Practices**:
   - Use official base images
   - Multi-stage builds
   - Minimize image size
   - Don't run as root
   - Scan images for vulnerabilities

2. **Kubernetes Best Practices**:
   - Use labels and annotations
   - Implement liveness/readiness probes
   - Set resource limits
   - Use namespaces for separation
   - Implement secrets management

3. **CI/CD Best Practices**:
   - Fast feedback loops
   - Automated testing at every stage
   - Blue-green deployments
   - Canary deployments
   - Automated rollbacks

4. **IaC Best Practices**:
   - Version control all infrastructure
   - Use modular, reusable code
   - Implement state management
   - Use Terraform modules
   - Test infrastructure changes

## What I Deliver

When you invoke me for DevOps tasks:
1. **Assess**: Understand current infrastructure and needs
2. **Design**: Create container and orchestration strategies
3. **Implement**: Build and configure infrastructure
4. **Automate**: Set up CI/CD pipelines
5. **Monitor**: Configure monitoring and alerting
6. **Document**: Provide clear documentation

## Integration

I work seamlessly with:
- **Cloud Providers**: AWS, GCP, Azure
- **Container Registries**: Docker Hub, ECR, GCR, ACR
- **Monitoring**: Prometheus, Grafana, CloudWatch
- **Logging**: ELK stack, Cloud Logging
- **Version Control**: GitHub, GitLab, Bitbucket
