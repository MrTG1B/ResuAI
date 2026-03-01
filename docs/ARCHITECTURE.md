# ResuAI – System Architecture

This document gives an overview of the ResuAI system architecture to help both frontend and backend engineers understand how the pieces fit together.

---

## 🗺️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                           │
│            Next.js 15 (React 19 + TypeScript)                   │
│         src/app/**/page.tsx   src/components/**                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP / Server Actions
┌────────────────────────────▼────────────────────────────────────┐
│                    Next.js Server Layer                          │
│   ┌────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│   │  API Routes    │  │  Server Actions  │  │  Middleware    │  │
│   │ src/app/api/   │  │ src/app/actions  │  │ src/middleware │  │
│   └───────┬────────┘  └────────┬─────────┘  └────────────────┘  │
└───────────┼────────────────────┼────────────────────────────────┘
            │                    │
   ┌─────────▼──────────────────▼─────────────────────────────┐
   │                    Backend Services                        │
   │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
   │  │  Firebase    │  │  Genkit AI   │  │  Stripe APIs    │  │
   │  │  (Auth +     │  │  src/ai/     │  │  Payment flows  │  │
   │  │  Firestore + │  │  flows/      │  │                 │  │
   │  │  Storage)    │  │              │  │                 │  │
   │  └──────────────┘  └──────────────┘  └─────────────────┘  │
   └──────────────────────────────────────────────────────────┘
            │
   ┌────────▼───────────────────────────────────────────────────┐
   │              External Services                              │
   │   Google Gemini AI   ·   ImageBB   ·   Stripe Payments     │
   └────────────────────────────────────────────────────────────┘

   ┌────────────────────────────────────────────────────────────┐
   │         PDF Generator Microservice  (separate process)      │
   │                  pdf-generator-service/                     │
   │                  Node.js + Playwright                       │
   └────────────────────────────────────────────────────────────┘

   ┌────────────────────────────────────────────────────────────┐
   │         Admin Dashboard  (separate Next.js app)             │
   │                  admin-dashboard/                           │
   └────────────────────────────────────────────────────────────┘
```

---

## 📦 Repository Structure

```
ResuAI/
├── src/                          # Main Next.js application
│   ├── ai/                       # 🔵 BACKEND – Genkit AI flows
│   │   ├── flows/                # Individual AI flow definitions
│   │   ├── genkit.ts             # Genkit configuration
│   │   └── dev.ts                # Genkit dev server entry
│   │
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # 🔵 BACKEND – REST API routes
│   │   │   ├── genkit/           # Genkit HTTP handler
│   │   │   └── stripe/           # Stripe webhook & checkout
│   │   ├── actions.ts            # 🔵 BACKEND – Next.js Server Actions
│   │   ├── globals.css           # 🟢 FRONTEND – Global styles
│   │   └── **/page.tsx           # 🟢 FRONTEND – Page components
│   │
│   ├── components/               # 🟢 FRONTEND – React UI components
│   │   ├── ui/                   # ShadCN/Radix base components
│   │   └── *.tsx                 # Feature-specific components
│   │
│   ├── hooks/                    # 🟢 FRONTEND – Custom React hooks
│   ├── lib/                      # 🔵 BACKEND – Utilities & Firebase
│   ├── middleware.ts             # 🔵 BACKEND – Edge middleware
│   ├── services/                 # 🔵 BACKEND – External service wrappers
│   └── types/                   # ⚪ SHARED  – TypeScript interfaces
│
├── admin-dashboard/              # 🟢 FRONTEND – Separate admin Next.js app
├── pdf-generator-service/        # 🔵 BACKEND – PDF microservice (Node.js)
├── docs/                         # 📖 Documentation
│   ├── ARCHITECTURE.md           # This file
│   ├── frontend/README.md        # Frontend guide
│   ├── backend/README.md         # Backend guide
│   ├── setup/                    # Setup guides
│   └── security/                 # Security docs
├── public/                       # 🟢 FRONTEND – Static assets
├── .github/                      # GitHub configuration
│   ├── CODEOWNERS                # Auto-review assignments
│   └── PULL_REQUEST_TEMPLATE.md  # PR checklist
├── firestore.rules               # 🔵 BACKEND – Firestore security rules
├── firebase.json                 # 🔵 BACKEND – Firebase project config
├── CONTRIBUTING.md               # Contribution guide
└── README.md                     # Project overview
```

**Legend:**  🟢 Frontend  |  🔵 Backend  |  ⚪ Shared

---

## 🔄 Data Flow

### Resume Generation (example end-to-end flow)

```
User fills Resume Form (FE)
  → src/components/resume-form.tsx

Submits → Server Action (BE)
  → src/app/actions.ts  →  generateResume()

Calls Genkit AI Flow (BE)
  → src/ai/flows/generate-resume.ts

Gemini API returns data
  → JSON resume data

Action saves to Firestore (BE)
  → Firebase Firestore  (users/{uid}/resumes/{resumeId})

Page re-renders with new resume (FE)
  → src/components/resume-editor-client.tsx
```

### PDF Generation

```
User clicks "Download PDF" (FE)
  → src/app/api/  (or direct call to microservice)

PDF Generator Microservice (BE)
  → pdf-generator-service/server.js
  → Playwright headless browser renders HTML
  → Returns PDF buffer

Browser triggers file download (FE)
```

### Authentication

```
User clicks "Sign in with Google" (FE)
  → src/components/  (login UI)

Firebase Auth (BE)
  → src/lib/firebase.ts  (client SDK)
  → src/lib/firebaseAdmin.ts  (server-side Admin SDK)

Middleware validates session (BE)
  → src/middleware.ts  checks Firebase ID token

User redirected to dashboard (FE)
  → src/app/dashboard/page.tsx
```

---

## 🗄️ Database Schema (Firestore)

```
users/
  {uid}/
    profile     – name, email, avatar, subscription tier
    resumes/
      {resumeId} – resume data (JSON)
    portfolios/
      {portfolioId} – portfolio data + template choice
    coverLetters/
      {letterId} – cover letter content
    chats/
      {chatId} – AI chat history (title, messages[])

feedback/
  {feedbackId} – user feedback submissions

portfolios/  (public collection)
  {portfolioId} – publicly viewable portfolio data
```

---

## 🔐 Security Architecture

- **Firestore Rules** – Row-level security; users can only read/write their own documents.
- **Middleware** – All `/dashboard/*` and `/api/*` routes require a valid Firebase ID token.
- **Rate Limiting** – `src/lib/security.ts` applies per-IP rate limits on API routes.
- **CSP Headers** – `next.config.ts` sets Content-Security-Policy and other HTTP security headers.
- **Secret Management** – All API keys are stored in `.env` (git-ignored); never committed.

See [docs/security/SECURITY.md](security/SECURITY.md) for detailed security documentation.

---

## 🚀 Deployment Architecture

| Component | Platform | URL |
|-----------|----------|-----|
| Main App | Vercel | `https://resuu-ai.vercel.app` |
| Admin Dashboard | Firebase Hosting | Configured in `admin-dashboard/firebase.json` |
| PDF Service | Docker / Cloud Run | `pdf-generator-service/Dockerfile` |
| Firestore | Firebase | `firebase.json` |

---

## 🔗 Key Dependencies

| Package | Purpose | Owner |
|---------|---------|-------|
| `next` | Full-stack React framework | Shared |
| `firebase` | Auth + Firestore client SDK | Backend |
| `firebase-admin` | Server-side Firebase access | Backend |
| `genkit` | AI orchestration framework | Backend |
| `@genkit-ai/googleai` | Gemini AI provider | Backend |
| `stripe` | Payment processing | Backend |
| `playwright-core` | PDF generation via headless browser | Backend |
| `tailwindcss` | Utility-first CSS | Frontend |
| `shadcn/ui` (via Radix) | Accessible UI component library | Frontend |
| `react-hook-form` | Form state management | Frontend |
| `zod` | Schema validation (shared) | Shared |
