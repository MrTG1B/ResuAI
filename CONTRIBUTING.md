# Contributing to ResuAI

Thank you for contributing to ResuAI! This guide explains how two engineers (one frontend, one backend) can work **simultaneously** on this project and merge into `main` without conflicts.

---

## 📁 Codebase Ownership

The repository is divided into clear ownership zones so that frontend and backend engineers rarely touch the same files.

| Area | Owner | Paths |
|------|-------|-------|
| **UI Pages & Layouts** | Frontend | `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `src/app/globals.css` |
| **React Components** | Frontend | `src/components/` |
| **Custom Hooks** | Frontend | `src/hooks/` |
| **Static Assets** | Frontend | `public/`, `tailwind.config.ts`, `postcss.config.mjs` |
| **Admin Dashboard** | Frontend | `admin-dashboard/` |
| **API Routes** | Backend | `src/app/api/` |
| **AI Flows (Genkit)** | Backend | `src/ai/` |
| **Server Actions** | Backend | `src/app/actions.ts` |
| **Libraries & Utilities** | Backend | `src/lib/`, `src/services/` |
| **TypeScript Types** | Shared | `src/types/` |
| **Middleware** | Backend | `src/middleware.ts` |
| **Firebase & Security** | Backend | `firestore.rules`, `firebase.json`, `apphosting.yaml` |
| **PDF Generator Service** | Backend | `pdf-generator-service/` |
| **Config & Root Files** | Shared | `next.config.ts`, `tsconfig.json`, `package.json` |

> ⚠️ **Shared files** (`src/types/`, `next.config.ts`, `package.json`) require coordination. Communicate with your teammate before editing these.

---

## 🌿 Branching Strategy

We use a feature-branch workflow. **Never commit directly to `main`.**

```
main                    ← stable, production-ready
├── dev                 ← integration branch (merge here first)
│   ├── fe/feature-name ← frontend feature branch
│   └── be/feature-name ← backend feature branch
```

### Branch Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Frontend feature | `fe/<short-description>` | `fe/new-resume-template` |
| Backend feature | `be/<short-description>` | `be/stripe-webhook-fix` |
| Bug fix (FE) | `fe/fix-<description>` | `fe/fix-portfolio-layout` |
| Bug fix (BE) | `be/fix-<description>` | `be/fix-ai-rate-limit` |
| Shared / infra | `chore/<description>` | `chore/update-dependencies` |
| Hotfix | `hotfix/<description>` | `hotfix/auth-crash` |

---

## 🔄 Workflow for Simultaneous Development

Follow these steps to avoid merge conflicts:

### Step 1 – Sync with `main`

```bash
git checkout main
git pull origin main
git checkout -b fe/your-feature   # or be/your-feature
```

### Step 2 – Work in your lane

- **Frontend engineer**: only modify files in `src/components/`, `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `src/hooks/`, `public/`.
- **Backend engineer**: only modify files in `src/app/api/`, `src/ai/`, `src/lib/`, `src/services/`, `src/middleware.ts`, `firestore.rules`.

### Step 3 – Keep your branch up to date

Regularly rebase onto `main` (or `dev`) to catch any upstream changes early:

```bash
git fetch origin
git rebase origin/main
```

### Step 4 – Open a Pull Request

1. Push your branch: `git push origin fe/your-feature`
2. Open a PR against `main` (or `dev`).
3. Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md).
4. Request a review from the appropriate code owner (see [CODEOWNERS](.github/CODEOWNERS)).

### Step 5 – Merge

- Squash-merge feature branches into `main`/`dev` to keep history clean.
- Delete the branch after merging.

---

## 🛠️ Local Development Setup

See the root [README.md](README.md#-getting-started) for full setup instructions. Quick summary:

```bash
# 1. Clone & install
git clone https://github.com/MrTG1B/ResuAI.git
cd ResuAI
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Firebase & Gemini keys

# 3. Start dev server
npm run dev          # Main app  → http://localhost:3000

# 4. (Optional) Start AI dev server
npm run genkit:dev   # Genkit UI → http://localhost:4000
```

For backend-only work on the PDF generator microservice:

```bash
cd pdf-generator-service
npm install
node server.js       # Starts on http://localhost:3001
```

For admin dashboard:

```bash
cd admin-dashboard
npm install
npm run dev          # Admin UI  → http://localhost:3001
```

---

## ✅ Code Quality Standards

Before opening a PR:

```bash
npm run lint        # ESLint checks
npm run typecheck   # TypeScript type checking
npm run build       # Ensure production build passes
```

- Follow existing file and naming conventions.
- Use TypeScript for all new files; avoid `any` types.
- Keep components small and focused (single responsibility).
- Document complex logic with inline comments.
- Add or update JSDoc for exported functions in `src/lib/` and `src/ai/`.

---

## 📝 Commit Message Convention

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short summary>

Types: feat | fix | docs | style | refactor | test | chore
Scope: fe | be | ai | auth | pdf | admin | deps
```

**Examples:**

```bash
feat(fe): add dark mode toggle to header
fix(be): handle stripe webhook signature mismatch
docs: update CONTRIBUTING guide
chore(deps): upgrade firebase to 10.14
```

---

## 🤝 Communication & Coordination

To avoid the most common merge conflicts:

1. **Announce shared-file changes** – Post in your team channel before editing `package.json`, `tsconfig.json`, `next.config.ts`, or `src/types/`.
2. **Don't refactor silently** – Large refactors that touch many files should be discussed first.
3. **Use short-lived branches** – The longer a branch lives, the higher the chance of conflicts. Merge frequently.
4. **Review PRs promptly** – Stale PRs drift further from `main` every day.

---

## 🔒 Security Guidelines

- **Never commit secrets** – All API keys, tokens, and credentials go in `.env` (which is git-ignored).
- Reference `.env.example` for required variables.
- See [docs/security/SECURITY.md](docs/security/SECURITY.md) for the full security policy.

---

## 📚 Further Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture & data flow |
| [docs/frontend/README.md](docs/frontend/README.md) | Frontend engineering guide |
| [docs/backend/README.md](docs/backend/README.md) | Backend engineering guide |
| [docs/setup/QUICK_START.md](docs/setup/QUICK_START.md) | Quick-start setup |
| [docs/setup/ADMIN_SETUP.md](docs/setup/ADMIN_SETUP.md) | Admin dashboard setup |
| [docs/security/SECURITY.md](docs/security/SECURITY.md) | Security guidelines |
