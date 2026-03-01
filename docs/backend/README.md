# ResuAI – Backend Engineer Guide

This guide is for the **backend engineer** working on the ResuAI project. It covers your ownership areas, tech stack, API conventions, AI flow development, and day-to-day workflow.

---

## 🔵 Your Ownership Areas

As the backend engineer, you own these directories and files:

```
src/
├── ai/                           ← Genkit AI flows & configuration
│   ├── flows/                    ← Individual AI feature flows
│   │   ├── generate-resume.ts
│   │   ├── analyze-resume.ts
│   │   ├── generate-cover-letter.ts
│   │   ├── interview-prep.ts
│   │   └── ...
│   ├── genkit.ts                 ← Genkit plugin configuration
│   └── dev.ts                    ← Genkit dev server entry point
│
├── app/
│   ├── api/                      ← Next.js API route handlers
│   │   ├── genkit/[[...path]]/   ← Genkit HTTP endpoint
│   │   └── stripe/               ← Stripe webhook & checkout session
│   └── actions.ts                ← Next.js Server Actions (called by FE)
│
├── lib/                          ← Utility modules
│   ├── firebase.ts               ← Firebase client SDK initialization
│   ├── firebaseAdmin.ts          ← Firebase Admin SDK (server-side)
│   ├── plans.ts                  ← Subscription plan definitions
│   ├── security.ts               ← Rate limiting & security helpers
│   └── utils.ts                  ← Shared utility functions
│
├── middleware.ts                 ← Edge middleware (auth, security headers)
│
└── services/
    └── image-upload-service.ts   ← ImageBB upload wrapper

firestore.rules                   ← Firestore security rules
firebase.json                     ← Firebase project & hosting config
apphosting.yaml                   ← Firebase App Hosting config
pdf-generator-service/            ← PDF microservice (Node.js + Playwright)
```

> **Do not edit** `src/components/`, `src/app/**/page.tsx` (except `actions.ts`), or `src/hooks/` — those belong to the frontend engineer. Coordinate before touching `src/types/` or `package.json`.

---

## 🛠️ Tech Stack

| Technology | Purpose | Docs |
|------------|---------|------|
| Next.js 15 Server Actions | RPC-style backend functions called from UI | [nextjs.org/docs/app/building-your-application/data-fetching/server-actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) |
| Next.js API Routes | REST endpoints (Stripe, Genkit) | [nextjs.org/docs/app/building-your-application/routing/route-handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) |
| Firebase Admin SDK | Server-side Firestore & Auth access | [firebase.google.com/docs/admin](https://firebase.google.com/docs/admin/setup) |
| Firebase Auth | User authentication | [firebase.google.com/docs/auth](https://firebase.google.com/docs/auth) |
| Cloud Firestore | NoSQL database | [firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore) |
| Firebase Storage | File storage (avatars, resumes) | [firebase.google.com/docs/storage](https://firebase.google.com/docs/storage) |
| Genkit | AI orchestration framework | [firebase.google.com/docs/genkit](https://firebase.google.com/docs/genkit) |
| Google Gemini AI | LLM for AI features | [ai.google.dev](https://ai.google.dev) |
| Stripe | Payment processing | [stripe.com/docs](https://stripe.com/docs) |
| Playwright | Headless browser for PDF generation | [playwright.dev](https://playwright.dev) |
| Zod | Schema validation | [zod.dev](https://zod.dev) |

---

## 🏁 Getting Started

```bash
# From the repo root
npm install
cp .env.example .env   # Add Firebase, Gemini, Stripe keys
npm run dev            # Next.js dev server on http://localhost:3000

# Run the Genkit AI development server (optional, for AI flow testing)
npm run genkit:dev     # Genkit UI on http://localhost:4000
```

### PDF Generator Service (separate process)

```bash
cd pdf-generator-service
npm install
node server.js         # Starts on http://localhost:3001
```

---

## 🤖 Working with AI Flows (Genkit)

AI flows live in `src/ai/flows/`. Each flow is a self-contained Genkit flow that calls the Gemini API.

### Creating a New AI Flow

```typescript
// src/ai/flows/my-new-flow.ts
'use server'

import { ai } from '@/ai/genkit'
import { z } from 'zod'

const InputSchema = z.object({
  userInput: z.string(),
})

const OutputSchema = z.object({
  result: z.string(),
})

export const myNewFlow = ai.defineFlow(
  {
    name: 'myNewFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: `Process this: ${input.userInput}`,
      output: { schema: OutputSchema },
    })
    return output!
  }
)
```

### Exposing a Flow via Server Action

After creating a flow, expose it as a Server Action in `src/app/actions.ts`:

```typescript
// src/app/actions.ts
'use server'

import { myNewFlow } from '@/ai/flows/my-new-flow'

export async function runMyNewFlow(userInput: string) {
  return myNewFlow({ userInput })
}
```

The frontend engineer then calls `runMyNewFlow()` directly from their components.

### Testing AI Flows

```bash
npm run genkit:dev
# Open http://localhost:4000 to test flows in the Genkit Developer UI
```

---

## 🔌 API Routes

REST API routes live in `src/app/api/`. Follow Next.js App Router conventions:

```typescript
// src/app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // ... process
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Rate Limiting

Apply rate limiting on all public API routes using `src/lib/security.ts`:

```typescript
import { rateLimit } from '@/lib/security'

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req)
  if (limited) return limited  // returns 429 response
  // ...
}
```

---

## 🗄️ Firestore Database

### Accessing Firestore (Server-Side)

Use the Admin SDK for server-side operations:

```typescript
import { adminDb } from '@/lib/firebaseAdmin'

const doc = await adminDb.collection('users').doc(uid).get()
```

### Accessing Firestore (Client-Side)

Use the client SDK for real-time subscriptions in frontend components. Import from `src/lib/firebase.ts`:

```typescript
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
```

### Database Schema

See [docs/ARCHITECTURE.md](../ARCHITECTURE.md#️-database-schema-firestore) for the full Firestore schema.

### Firestore Security Rules

Rules are in `firestore.rules`. After editing, deploy with:

```bash
firebase deploy --only firestore:rules
```

Key rule: users can only read/write their own documents:

```
allow read, write: if request.auth != null && request.auth.uid == userId;
```

---

## 🔐 Authentication & Middleware

The middleware at `src/middleware.ts` runs on every request to protected routes (`/dashboard/*`, `/api/*` except public ones).

It validates the Firebase ID token from the `Authorization` header or cookies and blocks unauthenticated requests.

### Getting the Current User in a Server Action

```typescript
'use server'

import { adminAuth } from '@/lib/firebaseAdmin'
import { cookies } from 'next/headers'

async function getCurrentUser() {
  const cookieStore = cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) throw new Error('Unauthorized')
  return adminAuth.verifyIdToken(token)
}
```

---

## 💳 Stripe Integration

Stripe integration lives in `src/app/api/stripe/`. Three endpoints:

| File | Endpoint | Purpose |
|------|----------|---------|
| `create-checkout-session/route.ts` | `POST /api/stripe/create-checkout-session` | Creates Stripe Checkout session |
| `portal/route.ts` | `POST /api/stripe/portal` | Opens customer billing portal |
| `webhook/route.ts` | `POST /api/stripe/webhook` | Handles Stripe webhook events |

Subscription plans are defined in `src/lib/plans.ts`.

**Required env variables:**

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## 📄 PDF Generator Microservice

The PDF service is a standalone Node.js + Playwright server in `pdf-generator-service/`.

```bash
cd pdf-generator-service
npm install
node server.js    # POST http://localhost:3001/generate-pdf
                  # (use PORT=3002 if the admin dashboard is also running)
```

**API:**

```bash
POST /generate-pdf
Content-Type: application/json

{ "html": "<html>...</html>" }
```

Returns a PDF buffer. The main app calls this service from a Server Action or API route.

---

## 🔀 Branching & PRs

- Branch naming: `be/<description>` (e.g., `be/add-job-match-flow`)
- Open PRs against `main` (or `dev` if used).
- Fill in the PR template; tag the frontend engineer if your changes to `src/app/actions.ts` change the function signature of existing Server Actions.
- See [CONTRIBUTING.md](../../CONTRIBUTING.md) for the full workflow.

---

## ✅ Pre-PR Checklist

```bash
npm run lint        # Fix any ESLint errors
npm run typecheck   # Fix any TypeScript errors
npm run build       # Ensure production build passes
```

- [ ] New Server Actions are exported from `src/app/actions.ts` (so FE can call them)
- [ ] New API routes have rate limiting applied
- [ ] Firestore rules updated if new collections/documents are added
- [ ] No secrets committed – all keys in `.env`
- [ ] New AI flows registered in `src/ai/dev.ts` for Genkit dev UI
- [ ] Zod schemas defined for all AI flow inputs and outputs
