# ResuAI – Frontend Engineer Guide

This guide is for the **frontend engineer** working on the ResuAI project. It covers your ownership areas, tech stack, component conventions, and day-to-day workflow.

---

## 🟢 Your Ownership Areas

As the frontend engineer, you own these directories and files:

```
src/
├── app/
│   ├── globals.css               ← Global CSS / Tailwind base
│   ├── layout.tsx                ← Root layout (fonts, providers)
│   ├── page.tsx                  ← Landing page
│   ├── about/page.tsx
│   ├── aptitude-test/page.tsx
│   ├── build/page.tsx
│   ├── cover-letter-generator/page.tsx
│   ├── dashboard/page.tsx
│   ├── faq/page.tsx
│   ├── feedback/page.tsx
│   ├── interview-prep/page.tsx
│   ├── login/page.tsx
│   ├── mentra/page.tsx
│   ├── not-found.tsx
│   ├── payment/*/page.tsx
│   ├── portfolio/*/page.tsx
│   ├── pricing/page.tsx
│   ├── privacy/page.tsx
│   ├── profile/page.tsx
│   ├── public/portfolio/[id]/page.tsx
│   ├── resume-analyzer/page.tsx
│   ├── resume-builder/*/page.tsx
│   ├── signup/page.tsx
│   └── terms/page.tsx
│
├── components/                   ← All React UI components
│   ├── ui/                       ← ShadCN base components (rarely touch)
│   └── *.tsx                     ← Feature components (your main workbench)
│
└── hooks/                        ← Custom React hooks
    ├── use-dynamic-text.ts
    ├── use-mobile.tsx
    ├── use-scroll-reveal.ts
    ├── use-subscription.ts
    └── use-toast.ts

public/                           ← Static assets (images, icons, fonts)
tailwind.config.ts                ← Tailwind theme config
postcss.config.mjs                ← PostCSS config
admin-dashboard/                  ← Separate admin Next.js app (see below)
```

> **Do not edit** `src/app/api/`, `src/ai/`, `src/lib/`, `src/services/`, or `src/middleware.ts` — those belong to the backend engineer. Coordinate before touching `src/types/` or `package.json`.

---

## 🛠️ Tech Stack

| Technology | Purpose | Docs |
|------------|---------|------|
| Next.js 15 (App Router) | React framework, routing, SSR | [nextjs.org](https://nextjs.org/docs) |
| React 19 | UI rendering | [react.dev](https://react.dev) |
| TypeScript | Type safety | [typescriptlang.org](https://www.typescriptlang.org/docs) |
| Tailwind CSS v3 | Utility-first styling | [tailwindcss.com](https://tailwindcss.com/docs) |
| ShadCN UI | Pre-built accessible components | [ui.shadcn.com](https://ui.shadcn.com) |
| Radix UI | Headless primitives under ShadCN | [radix-ui.com](https://www.radix-ui.com) |
| Lucide React | Icon set | [lucide.dev](https://lucide.dev) |
| React Hook Form | Form state & validation | [react-hook-form.com](https://react-hook-form.com) |
| Zod | Schema validation (forms) | [zod.dev](https://zod.dev) |
| Recharts | Data visualization | [recharts.org](https://recharts.org) |

---

## 🏁 Getting Started

```bash
# From the repo root
npm install
cp .env.example .env       # Add your Firebase keys
npm run dev                # http://localhost:3000
```

Check the root [README.md](../../README.md#-getting-started) for API key setup.

---

## 🧩 Component Conventions

### File Naming

- `kebab-case.tsx` for component files (e.g., `resume-editor-client.tsx`)
- `PascalCase` for component function names (e.g., `export function ResumeEditorClient()`)

### Client vs Server Components

- **Server Components** (default in App Router): pages that only read data can stay server components for better performance.
- **Client Components**: add `"use client"` directive at the top when the component uses hooks, event handlers, or browser APIs.
- Pattern: suffix client components with `-client.tsx` (e.g., `resume-editor-client.tsx`).

### Passing Data from Server to Client

```tsx
// app/resume-builder/editor/page.tsx  (Server Component)
import { ResumeEditorClient } from '@/components/resume-editor-client'

export default async function Page() {
  const data = await fetchResumeData()  // server-side fetch
  return <ResumeEditorClient initialData={data} />
}
```

### Using ShadCN Components

ShadCN components live in `src/components/ui/`. Import them directly:

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
```

To add a new ShadCN component:

```bash
npx shadcn@latest add <component-name>
```

### Tailwind Class Guidelines

- Use `cn()` from `src/lib/utils.ts` to conditionally merge classes:

```tsx
import { cn } from '@/lib/utils'

<div className={cn('base-class', isActive && 'active-class', className)} />
```

- Prefer Tailwind utility classes over inline styles or custom CSS.
- For complex, reusable styles, add a component-level CSS class in `globals.css`.

---

## 📋 Forms

Use React Hook Form + Zod for all forms:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
})

type FormData = z.infer<typeof schema>

function MyForm() {
  const form = useForm<FormData>({ resolver: zodResolver(schema) })
  // ...
}
```

---

## 🔗 Calling Backend (Server Actions)

The backend engineer exposes **Server Actions** in `src/app/actions.ts`. Call them directly from client components:

```tsx
'use client'
import { generateResume } from '@/app/actions'

async function handleSubmit(data) {
  const result = await generateResume(data)
  // handle result
}
```

Never call Firestore, Firebase Auth, or AI flows directly from frontend components — use the Server Actions provided by the backend engineer.

---

## 🎨 Theming & Styling

- Colors and design tokens are in `tailwind.config.ts`.
- CSS variables for dark/light mode are in `src/app/globals.css`.
- The project uses a dark-themed design; new UI should match the existing palette.

---

## 📱 Responsive Design

- Design mobile-first. Start with the smallest breakpoint and scale up.
- Use Tailwind's responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`.
- Test on at least mobile (375px) and desktop (1280px) widths.
- Use the `useIsMobile()` hook from `src/hooks/use-mobile.tsx` when you need JS-level breakpoint checks.

---

## 🖥️ Admin Dashboard

The admin dashboard is a **separate Next.js application** in `admin-dashboard/`. It has its own `package.json`, dependencies, and Firebase config.

```bash
cd admin-dashboard
npm install
npm run dev   # http://localhost:3002 (use --port 3002 to avoid conflict with pdf-generator-service)
```

The admin dashboard shares type definitions (user, feedback) with the main app. Keep these in sync manually when changing `src/types/user.ts` or `src/types/feedback.ts`.

---

## 🔀 Branching & PRs

- Branch naming: `fe/<description>` (e.g., `fe/add-dark-mode-toggle`)
- Open PRs against `main` (or `dev` if used).
- Fill in the PR template; tag the backend engineer if your changes touch shared types or `package.json`.
- See [CONTRIBUTING.md](../../CONTRIBUTING.md) for the full workflow.

---

## ✅ Pre-PR Checklist

```bash
npm run lint        # Fix any ESLint errors
npm run typecheck   # Fix any TypeScript errors
npm run build       # Ensure build succeeds
```

- [ ] New components have TypeScript types for all props
- [ ] Forms use React Hook Form + Zod validation
- [ ] All interactive elements are accessible (keyboard nav, ARIA attributes)
- [ ] Responsive design tested at mobile and desktop breakpoints
- [ ] No hardcoded secrets or API keys
