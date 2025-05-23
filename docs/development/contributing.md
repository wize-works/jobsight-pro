### 📄 `CONTRIBUTING.md`

# 🤝 Contributing to JobSight

Thanks for your interest in contributing to **JobSight**! Whether you're fixing a bug, building a feature, or improving documentation — your support helps build a better platform for field teams everywhere.

---

## 🚧 Ground Rules

1. Be kind, constructive, and professional.
2. Respect our product vision and architectural decisions.
3. Use consistent formatting (see `eslint`, `prettier`, `tailwind.config.ts`).
4. All changes must pass lint, tests, and build checks.
5. File an issue before working on large or breaking features.

---

## 📦 Project Structure

```txt
/app             → Next.js App Router (pages, layouts)
/components      → Reusable UI elements (DaisyUI/Tailwind)
/api             → GraphQL resolvers & route handlers
/lib             → Utilities (auth, ai, db, validation)
/docs            → Markdown docs (canvas-generated)
/public          → Static assets (images, favicon, etc.)
/branding        → Logos, fonts, and color palettes
```

---

## ✅ How to Contribute

1. **Fork the repo** → [https://github.com/brandonkorous/jobsight](https://github.com/brandonkorous/jobsight)
2. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes** (keep commits clean and descriptive)
4. **Test locally**
5. **Push & open a PR** targeting `main`
6. Add a clear PR description with screenshots if needed

> PR titles should follow `feat:`, `fix:`, `docs:`, `refactor:`, `chore:` prefixes

---

## 🔧 Local Dev Setup

1. Clone and install:
   ```bash
   git clone https://github.com/brandonkorous/jobsight
   cd jobsight
   npm install
   ```

2. Add `.env.local` with required keys (see `ENVIRONMENT.md`)
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. (Optional) Run lint + test before committing:
   ```bash
   npm run lint
   npm run test
   ```

---

## 🧪 Testing Guidelines

- Use `vitest` for unit tests (TDD encouraged)
- Use `msw` to mock Supabase/Clerk API calls
- Place tests in `__tests__` folders or alongside modules

---

## 📬 Submitting Bug Reports or Feature Requests

- Use GitHub Issues
- Add labels: `bug`, `enhancement`, `question`, or `good first issue`
- Be specific about expected vs. actual behavior

---

## 📄 Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/)

By contributing, you agree to follow it.

---

Thanks for helping us build a better jobsite! 👷‍♂️
