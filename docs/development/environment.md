### 📄 `ENVIRONMENT.md`

# 🛠️ JobSight Environment Configuration Guide

This document outlines how to configure your environment for local development, staging, and production deployments of **JobSight**.

---

## 📦 Environments

JobSight uses the following environments:

| Environment | Purpose                  | URL Example                 |
|-------------|---------------------------|-----------------------------|
| `local`     | Developer testing         | `http://localhost:3000`     |
| `staging`   | Pre-production validation | `https://staging.jobsight.co` |
| `production`| Live user environment     | `https://jobsight.co`       |

---

## 🔐 Environment Variables

All variables should be stored in `.env.local` for local dev and configured securely in CI/CD for deploys.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk (Auth)
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# OpenAI (AI Assistant)
OPENAI_API_KEY=

# App Metadata
NEXT_PUBLIC_APP_ENV=local
NEXT_PUBLIC_APP_NAME=JobSight
```

> Note: For TailwindCSS v4.1, your environment must support `tailwind.config.ts`. Use Node 18+ for compatibility.

---

## 🌐 Domains & Redirects

| Env        | Domain                     | Notes                          |
|------------|----------------------------|---------------------------------|
| `local`    | `localhost:3000`           | PWA + Clerk dev mode           |
| `staging`  | `staging.jobsight.co`      | Optional: password protected   |
| `prod`     | `jobsight.co`              | Public                         |

---

## 🧱 Folder-Specific Env Usage

| Folder         | Depends On                      |
|----------------|----------------------------------|
| `/app`         | NEXT_PUBLIC_* vars               |
| `/lib/ai`      | OPENAI_API_KEY                   |
| `/lib/auth`    | Clerk SDK, uses both public/secret keys |
| `/api`         | Supabase Admin, AI assistant     |

---

## 🧪 Test & Debug Tips

- Use Clerk's dev browser to simulate multiple roles
- Use Supabase Studio to inspect DB row-level security
- Validate `.env.local` loading with `console.log(process.env.X)`
- For mobile PWA, test offline mode via Chrome DevTools > Network > Offline

---

## 🔒 Secrets Management

| Environment | Secret Storage                   |
|-------------|----------------------------------|
| `local`     | `.env.local` (not committed)     |
| `staging`   | GitHub Actions > Environment Secrets |
| `prod`      | GitHub Actions > Environment Secrets |

> Rotate your Clerk + OpenAI API keys periodically.

---

## 📌 Notes

- All env values should be prefixed with `NEXT_PUBLIC_` to expose to the browser **only if safe**
- Backend-only values (e.g. `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) must never be used in the frontend
- Fail gracefully if env vars are missing

---

For any environment issues, contact the platform maintainer.
