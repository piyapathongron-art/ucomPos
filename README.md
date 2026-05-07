# UcomPos

Full-stack POS system for mobile shops. Migrated from a 1 480-line single-file React app into a modern **Next.js 15** application with TypeScript, Prisma ORM, Supabase, and JWT authentication.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + dark mode |
| Database | Supabase PostgreSQL |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Auth | Custom JWT (jose) + bcryptjs |
| State | Zustand |
| Validation | Zod |
| Runtime | Node.js 20+ |

---

## Features

| Module | Description |
|---|---|
| **POS** | Product search, cart, cash/transfer checkout, receipt printing |
| **Stock** | Product CRUD, bulk JSON import, soft-delete, favourite toggle |
| **Services** | Repair queue, mobile top-up, device extensions |
| **Installments** | Partner ledger, debt / payment / commission tracking |
| **Reports** | Daily/monthly/custom analytics, KPI cards, top products & categories |
| **Users** | Staff CRUD, role + permission assignment, password change |
| **Audit Log** | Immutable action history, paginated and filterable |
| **Settings** | Category manager, JSON backup/restore, daily close with expense tracking |

---

## Quick Start (Local Dev)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your **Supabase** connection strings and **JWT secrets**.

Generate strong JWT secrets:
```bash
openssl rand -base64 48
```

### 3. Set up the database

```bash
# Generate Prisma client
pnpm prisma:generate

# Apply schema to your Supabase DB
pnpm prisma:migrate        # dev — creates migration files
# OR for a quick push without migration history:
npx prisma db push

# Seed default users + sample inventory
pnpm prisma:seed
```

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`.

**Default credentials (after seed):**

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `1234` |
| Staff | `staff` | `1234` |

> Change these immediately after first login via **จัดการผู้ใช้ (Users)**.

---

## Deployment (Vercel + Supabase)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
gh repo create ucompos --private --source=. --push
```

### 2. Create Vercel project

Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo. Vercel auto-detects Next.js. The build command in `vercel.json` runs `pnpm build` which internally calls `prisma generate && next build`.

### 3. Set environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**:

| Variable | Where to find it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string (Transaction mode, port **6543**) |
| `DIRECT_URL` | Supabase → Project Settings → Database → Connection string (Session mode, port **5432**) |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | Generate a second unique value |
| `JWT_ACCESS_EXPIRY` | `15m` |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://ucompos.vercel.app` |

Optional (Supabase Storage / Realtime only):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

### 4. Migrate + seed production DB

Run once from your local machine with `.env.local` pointing to production:

```bash
npx prisma migrate deploy   # apply all pending migrations
pnpm prisma:seed            # seed default users + categories
```

### 5. Verify deployment

```
GET https://your-app.vercel.app/api/health
→ { "status": "ok", "db": "connected" }
```

---

## Available Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Production build (`prisma generate` + `next build`) |
| `pnpm start` | Serve production build |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | TypeScript check (no emit) |
| `pnpm prisma:generate` | Regenerate Prisma client after schema changes |
| `pnpm prisma:migrate` | Create + apply a new migration (dev) |
| `pnpm prisma:studio` | Open Prisma Studio |
| `pnpm prisma:seed` | Seed default users, categories, and sample stock |
| `pnpm db:reset` | Drop, re-migrate, and re-seed (dev only) |

---

## Project Structure

```
ucomPos/
├── app/
│   ├── (auth)/login/          ← Login page
│   ├── (dashboard)/           ← Protected pages
│   │   ├── pos/               ← POS module
│   │   ├── stock/             ← Inventory
│   │   ├── services/          ← Repairs / top-ups / extensions
│   │   ├── installments/      ← Partner ledger
│   │   ├── reports/           ← Analytics
│   │   ├── users/             ← User management
│   │   ├── audit/             ← Audit log
│   │   └── settings/          ← Backup, daily close, categories
│   └── api/                   ← REST API routes
│       ├── auth/              ← login / logout / refresh / me
│       ├── inventory/         ← Product CRUD + bulk import
│       ├── sales/             ← Sale create / void
│       ├── services/          ← Service CRUD
│       ├── partners/          ← Partner + transactions
│       ├── users/             ← User CRUD + password change
│       ├── categories/        ← Category CRUD
│       ├── audit-logs/        ← Audit log query
│       ├── backup/            ← export / import
│       ├── reports/           ← analytics + daily-close
│       └── health/            ← Liveness probe
├── components/
│   ├── ui/                    ← Button, Card, Input, Modal, Icons…
│   └── features/              ← Domain components per module
├── lib/                       ← Singletons + utilities
├── server/
│   ├── middleware/auth.ts     ← requirePermission() helper
│   └── services/              ← Business logic layer
├── store/                     ← Zustand (auth, ui, cart)
├── types/                     ← Shared TypeScript types
├── prisma/
│   ├── schema.prisma          ← Database schema
│   ├── seed.ts                ← Default data seeder
│   └── migrations/            ← Versioned migrations
├── middleware.ts              ← Edge JWT guard
├── vercel.json                ← Vercel deployment config
└── .env.example               ← Environment variable template
```

---

## Permissions

| Key | Module |
|---|---|
| `pos` | POS — sell products |
| `services` | Services — repairs, top-ups, extensions |
| `installments` | Installments — partner ledger |
| `stock` | Stock — add / edit / delete products |
| `report` | Reports — view analytics |
| `users` | Users — manage staff accounts |
| `audit` | Audit Log — view action history |
| `settings` | Settings — backup, daily close, categories |

The seeded `admin` user has all permissions. The seeded `staff` user has `pos`, `services`, and `report` only.

---

## Architecture Notes

- **Server vs Client Components** — data-fetching pages are Server Components; interactive leaf nodes use `'use client'`.
- **Permissions** — checked at the edge middleware (page redirect) and inside every API route handler via `requirePermission()` (defense in depth).
- **Prisma + pgBouncer** — runtime uses port 6543 (pooled); migrations use port 5432 (direct). Both `DATABASE_URL` and `DIRECT_URL` are required in production.
- **Cart state** — Zustand with `persist` middleware; survives page refresh via `localStorage`.
- **Print** — receipts and daily-close summaries use `window.print()` with a `#printable-area` CSS isolation trick. No external PDF library required.
- **Audit log** — every mutating API route calls `recordAudit()`; rows are append-only and never updated or deleted.

---

## Legacy

The original single-file React app is preserved in `UCOM-POS/index.html` for reference and is excluded from the TypeScript build via `tsconfig.json`.
