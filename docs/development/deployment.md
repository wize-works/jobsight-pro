### 📄 `DEPLOYMENT.md`

# 🚀 JobSight Deployment Guide

This document outlines the deployment pipeline and infrastructure setup for **JobSight**, including local preview, CI/CD, hosting targets, and production readiness.

---

## 🧪 Local Dev Preview

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build production assets
npm run build
```

- Requires `.env.local` file (see `ENVIRONMENT.md`)
- Uses Next.js App Router + Tailwind v4.1 + DaisyUI v5.0

---

## 🧱 Deployment Targets

| Environment | Platform           | URL                          |
|-------------|--------------------|-------------------------------|
| Staging     | Fly.io or AKS Dev  | `https://staging.jobsight.co` |
| Production  | Azure Kubernetes Service (AKS) | `https://jobsight.co` |

> Optional preview environments available via GitHub PR integrations (Vercel/Fly.io)

---

## ⚙️ CI/CD Pipeline

Handled via **GitHub Actions** + Docker + Helm

### Workflow:

1. On `push` to `main` or PR to `main`:
   - Run lint, test, typecheck
   - Build Docker image
   - Push to Azure Container Registry (ACR)
   - Deploy via Helm to AKS staging/production

2. Secrets managed via GitHub Environments

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci && npm run build
      - run: docker build -t $REGISTRY_URL/jobsight:$SHA .
      - run: docker push $REGISTRY_URL/jobsight:$SHA
      - run: helm upgrade --install jobsight ./helm \
          --set image.tag=$SHA \
          --namespace=jobsight-prod
```

---

## 📦 Helm & AKS Setup

- Cluster provisioned via Terraform or Azure Portal
- Helm charts stored in `/infra/helm/jobsight`
- cert-manager handles SSL
- nginx ingress routes:
  - `/api` → Fastify
  - `/*` → Next.js frontend
- Supports blue-green and rollback via Helm

---

## 🔐 Secrets & Config

| Secret            | Location                  |
|-------------------|---------------------------|
| OpenAI API Key    | GitHub Actions secret     |
| Supabase keys     | GitHub + Helm chart vars  |
| Clerk Keys        | GitHub + `.env.production`|
| DB Credentials    | Azure Key Vault / AKS env |

> Never commit secrets into Git or Docker images

---

## ✅ Production Checklist

- [ ] Domain DNS + SSL cert (via cert-manager)
- [ ] Health checks on `/api/health`
- [ ] Uptime monitoring (UptimeRobot, Sentry)
- [ ] Manual QA sign-off for major releases
- [ ] Docs published (`docs/` folder auto-deployed)

---

Need help? See: `ARCHITECTURE.md`, `ENVIRONMENT.md`, or `SUPPORT.md`
