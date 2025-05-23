### 📄 `dev/README.md`

# 👨‍💻 JobSight Developer Overview

This readme is for contributors working inside the `/dev` directory, which contains reusable libraries, experimental components, and test environments for JobSight's frontend and backend systems.

---

## 📁 Folder Overview

| Folder         | Purpose                                        |
|----------------|------------------------------------------------|
| `/lib`         | AI, auth, DB, utilities                        |
| `/graphql`     | Schema generators, resolvers, inputs/outputs   |
| `/mock`        | MSW handlers and test fixtures                 |
| `/__tests__`   | Vitest unit tests                              |
| `/scripts`     | Dev automation tools (e.g. data seeds)         |
| `/playground`  | Rapid prototyping for new UI / GQL queries     |

---

## 🧱 Core Technologies

- **GraphQL** (code-first, modular, auto-generated schema)
- **Fastify** (API performance + plugin-based extensibility)
- **Supabase** (Postgres, RLS, storage, auth helper)
- **Clerk.dev** (auth + role-based permissions)
- **LangChain + OpenAI** (AI layer integration)
- **Next.js 15** (App Router + SSR + API routes)
- **TailwindCSS v4.1 + DaisyUI v5.0**

---

## 🚦 Development Workflow

```bash
# Lint
npm run lint

# Unit Tests (Vitest)
npm run test

# Type Check
npm run typecheck

# Dev Server
npm run dev
```

> Make sure your `.env.local` file is present and valid

---

## 🧪 Testing Strategy

- **Unit tests** in `__tests__` or co-located with source
- **Mocking** via `msw` (Supabase, Clerk, OpenAI)
- **CI enforced**: All PRs must pass tests, lints, and build

---

## 🔒 Auth in Dev Mode

- Clerk dev browser must be open
- Use mocked user context (`mockUser.ts`) for local testing
- RLS still enforced for Supabase test data

---

## 🛠 Prototyping in `/playground`

Use `dev/playground/` to:
- Test new GraphQL mutations or schema changes
- Prototype UI components
- Validate AI prompts in isolation

> Changes here should not be committed to `main` unless production-ready

---

## ✅ Ready to Contribute?

See: [`CONTRIBUTING.md`](../CONTRIBUTING.md) and [`ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
