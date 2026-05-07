# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the ucomPos Next.js redesign project.

## Project Overview

**ucomPos** is a comprehensive POS (Point-of-Sale) system for mobile shops being redesigned from a single-file React app (1480 lines) into a modern **Next.js full-stack application** with TypeScript, Prisma ORM, and Supabase.

### Migration Context
- **Current State**: Single-file HTML+React app with localStorage persistence, dark mode, Thai language support
- **Target State**: Scalable full-stack Next.js 14+ app with database persistence, authentication, multi-tenant architecture
- **Key Features to Preserve**: All 8 business domains (POS, Services, Installments, Stock, Reports, Users, Audit Logs, Settings)
- **Database**: Supabase PostgreSQL + Prisma ORM for type-safe queries
- **Authentication**: JWT-based with secure password hashing (bcrypt)

## Architecture Overview

### From Monolithic to Layered

```
Legacy (Single-File):                Modern (Full-Stack):
HTML + React + localStorage    →     Next.js App Router
  ↓                                    ├─ Server Components (layout, rendering)
  └─ All state in browser             ├─ API Routes (RESTful endpoints)
                                       ├─ Prisma Client (ORM)
                                       └─ Supabase (PostgreSQL)
```

### Tech Stack

- **Frontend**: React 18 + Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS (preserved from original)
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 or custom JWT
- **State Management**: Zustand (for client-side global state)
- **Validation**: Zod (schema validation on both client/server)
- **PDF Generation**: @react-pdf/renderer (server-side PDF exports)

## Project Structure

```
ucomPos/
├── app/                           ← Next.js App Router
│   ├── (auth)/                    ← Auth route group
│   │   ├── login/page.tsx         ← Login page
│   │   ├── register/page.tsx      ← User registration (admin only)
│   │   └── layout.tsx             ← Auth layout (no sidebar)
│   ├── (dashboard)/               ← Protected route group
│   │   ├── pos/page.tsx           ← POS module
│   │   ├── services/page.tsx      ← Services module
│   │   ├── installments/page.tsx  ← Installments module
│   │   ├── stock/page.tsx         ← Inventory management
│   │   ├── reports/page.tsx       ← Analytics & reporting
│   │   ├── users/page.tsx         ← User management (admin)
│   │   ├── audit/page.tsx         ← Audit logs (admin)
│   │   ├── settings/page.tsx      ← System settings (admin)
│   │   └── layout.tsx             ← Dashboard layout (sidebar)
│   ├── api/                       ← API Routes
│   │   ├── auth/
│   │   │   ├── login/route.ts     ← POST: Login, returns JWT
│   │   │   ├── logout/route.ts    ← POST: Logout
│   │   │   └── refresh/route.ts   ← POST: Refresh JWT token
│   │   ├── inventory/
│   │   │   ├── route.ts           ← GET all, POST create
│   │   │   ├── [id]/route.ts      ← GET one, PUT update, DELETE
│   │   │   └── bulk-import/route.ts ← POST: Bulk import CSV/JSON
│   │   ├── sales/
│   │   │   ├── route.ts           ← POST: Create transaction
│   │   │   ├── [id]/route.ts      ← GET one, DELETE (void sale)
│   │   │   └── analytics/route.ts ← GET: Sales analytics (report data)
│   │   ├── services/
│   │   │   ├── repairs/route.ts   ← Repair queue CRUD
│   │   │   ├── topups/route.ts    ← Mobile top-up CRUD
│   │   │   └── extensions/route.ts ← Device extensions CRUD
│   │   ├── partners/
│   │   │   ├── route.ts           ← Partner/debt CRUD
│   │   │   └── [id]/route.ts      ← Update partner balance
│   │   ├── users/
│   │   │   ├── route.ts           ← GET all users, POST create
│   │   │   ├── [id]/route.ts      ← GET one, PUT update, DELETE
│   │   │   └── permissions/route.ts ← GET available permissions
│   │   ├── categories/
│   │   │   └── route.ts           ← Category CRUD
│   │   ├── audit-logs/
│   │   │   └── route.ts           ← GET audit logs (searchable)
│   │   ├── backup/
│   │   │   ├── export/route.ts    ← GET: Download JSON backup
│   │   │   └── import/route.ts    ← POST: Restore from backup
│   │   └── reports/
│   │       ├── daily-close/route.ts ← POST: Daily close with PDF
│   │       └── analytics/route.ts ← GET: Sales metrics
│   ├── layout.tsx                 ← Root layout (metadata, providers)
│   ├── page.tsx                   ← Redirect to /dashboard/pos
│   └── error.tsx                  ← Global error boundary
├── components/
│   ├── ui/                        ← Base UI components
│   │   ├── Button.tsx             ← Button with variants
│   │   ├── Input.tsx              ← Text/number input with validation
│   │   ├── Modal.tsx              ← Modal dialog wrapper
│   │   ├── Card.tsx               ← Card container
│   │   ├── Notification.tsx       ← Toast notifications
│   │   ├── ConfirmDialog.tsx      ← Confirmation modal
│   │   ├── Badge.tsx              ← Status badges
│   │   ├── Tabs.tsx               ← Tab navigation
│   │   └── Select.tsx             ← Dropdown select
│   ├── features/                  ← Domain-specific components
│   │   ├── pos/
│   │   │   ├── POSView.tsx        ← Main POS interface
│   │   │   ├── ProductSearch.tsx  ← Product search & filter
│   │   │   ├── CartSummary.tsx    ← Cart items + totals
│   │   │   └── CheckoutForm.tsx   ← Payment method & discounts
│   │   ├── services/
│   │   │   ├── ServicesView.tsx   ← Services dashboard
│   │   │   ├── RepairForm.tsx     ← Add/edit repair
│   │   │   ├── TopupForm.tsx      ← Mobile top-up form
│   │   │   └── ExtensionForm.tsx  ← Device extension form
│   │   ├── stock/
│   │   │   ├── StockView.tsx      ← Inventory list
│   │   │   ├── ProductForm.tsx    ← Add/edit product
│   │   │   ├── BulkImport.tsx     ← CSV/JSON importer
│   │   │   └── StockTable.tsx     ← Searchable/sortable table
│   │   ├── reports/
│   │   │   ├── ReportView.tsx     ← Report dashboard
│   │   │   ├── DateRangePicker.tsx ← Custom date filters
│   │   │   ├── SalesMetrics.tsx   ← KPI cards (revenue, profit)
│   │   │   ├── ProductRanking.tsx ← Top 5 products chart
│   │   │   └── TransactionList.tsx ← Detailed transaction view
│   │   ├── installments/
│   │   │   ├── InstallmentView.tsx ← Debt ledger
│   │   │   ├── PartnerForm.tsx    ← Add/edit partner
│   │   │   └── PaymentForm.tsx    ← Record payment
│   │   ├── users/
│   │   │   ├── UsersView.tsx      ← User management list
│   │   │   ├── UserForm.tsx       ← Add/edit user
│   │   │   └── PermissionSelector.tsx ← Permission checkboxes
│   │   ├── audit/
│   │   │   └── AuditLogView.tsx   ← Searchable audit log
│   │   ├── settings/
│   │   │   ├── SettingsView.tsx   ← Settings dashboard
│   │   │   ├── CategoryManager.tsx ← Add/edit categories
│   │   │   ├── BackupRestore.tsx  ← Backup/restore UI
│   │   │   └── DailyClose.tsx     ← Daily close & expense tracking
│   │   └── layout/
│   │       ├── DashboardLayout.tsx ← Main layout with sidebar
│   │       ├── Sidebar.tsx        ← Navigation sidebar
│   │       ├── TopBar.tsx         ← Top navigation bar
│   │       └── MobileMenu.tsx     ← Mobile hamburger menu
├── lib/                           ← Core utilities & singletons
│   ├── prisma.ts                  ← Prisma client singleton
│   ├── supabase.ts                ← Supabase client (server & client)
│   ├── auth.ts                    ← JWT utilities (sign, verify)
│   ├── bcrypt.ts                  ← Password hashing helpers
│   ├── api-client.ts              ← Axios instance + interceptors
│   ├── validators.ts              ← Zod schemas for API requests
│   ├── constants.ts               ← App-wide constants
│   └── utils.ts                   ← Helper functions (parseNum, etc.)
├── server/                        ← Server-side logic (optional)
│   ├── actions/                   ← Server Actions (async functions)
│   │   ├── sales.ts               ← Create sale, void sale
│   │   ├── inventory.ts           ← Update stock, import
│   │   ├── auth.ts                ← Login, logout actions
│   │   └── reports.ts             ← Generate report data
│   ├── services/                  ← Business logic layer
│   │   ├── salesService.ts        ← Sales calculations & validation
│   │   ├── reportService.ts       ← Report aggregation & filtering
│   │   ├── inventoryService.ts    ← Stock management logic
│   │   └── auditService.ts        ← Audit log tracking
│   └── middleware/                ← Custom middleware
│       ├── auth.ts                ← JWT verification
│       └── errorHandler.ts        ← Error normalization
├── store/                         ← Zustand global state
│   ├── authStore.ts               ← Auth state (currentUser, token)
│   ├── uiStore.ts                 ← UI state (darkMode, notifications)
│   ├── cartStore.ts               ← Cart state (items, discounts)
│   └── filterStore.ts             ← Report filters (date range, etc.)
├── types/                         ← Shared TypeScript types
│   ├── index.ts                   ← Main type exports
│   ├── database.ts                ← Prisma schema types
│   ├── api.ts                     ← API request/response types
│   ├── ui.ts                      ← Component prop types
│   └── domain.ts                  ← Business domain types
├── hooks/                         ← Custom React hooks
│   ├── useAuth.ts                 ← Authentication hook
│   ├── useCart.ts                 ← Cart state management
│   ├── useFetch.ts                ← Data fetching with caching
│   ├── useNotification.ts         ← Toast notifications
│   ├── useLocalStorage.ts         ← Browser localStorage sync
│   ├── usePagination.ts           ← Pagination logic
│   └── useDebounce.ts             ← Debounce hook
├── prisma/
│   ├── schema.prisma              ← Database schema (tables, relations)
│   └── migrations/                ← Versioned migrations
├── styles/
│   ├── globals.css                ← Tailwind imports + global styles
│   ├── variables.css              ← CSS custom properties
│   └── animations.css             ← Reusable animations
├── middleware.ts                  ← Next.js middleware (JWT guard)
├── next.config.js                 ← Next.js configuration
├── tailwind.config.ts             ← Tailwind configuration
├── tsconfig.json                  ← TypeScript configuration
├── .env.example                   ← Environment variables template
├── .env.local                     ← Local secrets (git ignored)
├── .eslintrc.json                 ← ESLint configuration
├── package.json                   ← Dependencies
└── README.md                      ← Project documentation
```

## Database Schema (Prisma)

Migration from localStorage to Supabase PostgreSQL via Prisma:

### Core Tables

```
User (authentication + permissions)
├── id: String (UUID, PK)
├── username: String (unique)
├── email: String (optional)
├── passwordHash: String
├── name: String
├── role: Enum (ADMIN, STAFF)
├── permissions: String[] (array of permission names)
├── isActive: Boolean
├── createdAt: DateTime
└── updatedAt: DateTime

Product (inventory)
├── id: Int (PK)
├── productId: String (unique, e.g., "P-0001")
├── name: String
├── category: String (FK to Category)
├── description: String (optional)
├── qty: Int (current stock)
├── cost: Decimal (purchase price)
├── price: Decimal (selling price)
├── isFavorite: Boolean
├── createdAt: DateTime
└── updatedAt: DateTime

Sale (completed transactions)
├── id: String (UUID, PK)
├── userId: String (FK to User)
├── date: DateTime
├── items: SaleItem[] (relationship)
├── itemDiscount: Decimal
├── billDiscount: Decimal
├── subtotal: Decimal
├── total: Decimal
├── cost: Decimal (sum of item costs)
├── profit: Decimal
├── paymentMethod: Enum (CASH, TRANSFER)
├── notes: String (optional)
└── updatedAt: DateTime

SaleItem (line items in transaction)
├── id: Int (PK)
├── saleId: String (FK to Sale)
├── productId: Int (FK to Product)
├── qty: Int
├── price: Decimal (unit price at time of sale)
├── itemDiscount: Decimal
└── subtotal: Decimal

Service (one-off transactions: repairs, topups, extensions)
├── id: String (UUID, PK)
├── type: Enum (REPAIR, TOPUP, EXTENSION)
├── name: String
├── description: String (optional)
├── cost: Decimal
├── price: Decimal
├── date: DateTime
├── status: Enum (PENDING, COMPLETED, CANCELLED)
├── details: Json (flexible fields per service type)
└── userId: String (FK to User)

Partner (customer debt tracking)
├── id: String (UUID, PK)
├── name: String
├── phone: String (optional)
├── email: String (optional)
├── totalDebt: Decimal
├── totalCommission: Decimal
├── notes: String
├── createdAt: DateTime
└── updatedAt: DateTime

PartnerTransaction (payment history)
├── id: String (UUID, PK)
├── partnerId: String (FK to Partner)
├── type: Enum (DEBT, PAYMENT, COMMISSION)
├── amount: Decimal
├── description: String
├── date: DateTime
└── userId: String (FK to User)

Category (product categories)
├── id: String (UUID, PK)
├── name: String
├── description: String (optional)
└── order: Int (for sorting)

AuditLog (immutable action history)
├── id: String (UUID, PK)
├── userId: String (FK to User)
├── action: String (e.g., "CREATE_SALE", "DELETE_PRODUCT")
├── entityType: String (e.g., "Sale", "Product")
├── entityId: String
├── changes: Json (before/after values)
├── timestamp: DateTime
└── ipAddress: String (optional)

DailyClose (end-of-day summary)
├── id: String (UUID, PK)
├── date: Date (unique per shop)
├── cashSales: Decimal
├── transferSales: Decimal
├── expenses: Decimal
├── profit: Decimal
├── notes: String
├── pdfUrl: String (S3 or Supabase storage)
├── createdAt: DateTime
└── updatedAt: DateTime

Expense (daily expenses)
├── id: String (UUID, PK)
├── dailyCloseId: String (FK to DailyClose)
├── name: String
├── amount: Decimal
├── category: String
└── createdAt: DateTime
```

### Key Design Decisions

1. **User passwords**: Hashed with bcrypt, never stored in plain text
2. **Permissions**: Array stored in User table (normalized via separate `Permission` lookup table optional)
3. **Flexible service details**: JSON column (`details`) for repairs, topups, extensions with different fields
4. **Audit immutability**: AuditLog rows never updated/deleted, only appended
5. **Cascading deletes**: Most deletes are soft-deletes (isActive = false) except transactional data (Sales)
6. **Time zones**: All timestamps in UTC, localization happens in frontend

## Feature Mapping: Legacy → New

### 1. POS Module
**Legacy**: `renderPOSView()` (lines 1003-1167)
**New**: 
- `app/(dashboard)/pos/page.tsx` - Server component wrapper
- `components/features/pos/*` - Client components (ProductSearch, CartSummary, CheckoutForm)
- `api/inventory/route.ts` - Fetch products
- `api/sales/route.ts` - Create transaction
- `store/cartStore.ts` - Client-side cart state (Zustand)

**Key features**:
- Product search by name/category
- Cart management (add, adjust qty, remove)
- Item & bill discount
- Cash/transfer payment
- Real-time profit calculation
- Print receipt

### 2. Services Module
**Legacy**: `renderServicesView()` (lines 959-992)
**New**:
- `app/(dashboard)/services/page.tsx`
- `components/features/services/*` (RepairForm, TopupForm, ExtensionForm)
- `api/services/repairs|topups|extensions/route.ts`
- `server/services/serviceService.ts` - Unified service logic

**Key features**:
- Repair queue (name, cost, price, date)
- Mobile top-up (carrier selection, amount)
- Device extension (commission tracking)

### 3. Installments Module
**Legacy**: `renderInstallmentView()` (lines 1168-1177)
**New**:
- `app/(dashboard)/installments/page.tsx`
- `components/features/installments/*` (PartnerForm, PaymentForm)
- `api/partners/route.ts`
- `server/services/partnerService.ts`

**Key features**:
- Partner ledger (debt tracking)
- Payment recording (partial payments)
- Commission management

### 4. Stock Module
**Legacy**: `renderStockView()` (lines 993-1002)
**New**:
- `app/(dashboard)/stock/page.tsx`
- `components/features/stock/*` (ProductForm, BulkImport, StockTable)
- `api/inventory/route.ts` (full CRUD)
- `server/services/inventoryService.ts`

**Key features**:
- Product CRUD (add, edit, delete)
- Quantity tracking (cost vs selling price)
- Bulk import (CSV/JSON)
- Search & sort by any field
- Favorite marking

### 5. Reports Module
**Legacy**: `renderReportView()` (lines 1179-1350+)
**New**:
- `app/(dashboard)/reports/page.tsx`
- `components/features/reports/*` (DateRangePicker, SalesMetrics, ProductRanking)
- `api/reports/analytics/route.ts` - Server-side filtering & aggregation
- `server/services/reportService.ts` - Heavy computation

**Key features**:
- Sales analytics (daily/monthly/yearly/custom)
- Payment method breakdown
- Profit calculations (actual vs topup-specific)
- Top 5 products & categories
- Transaction-level detail view

### 6. Users Module
**Legacy**: `renderUsersView()` (lines 945-950)
**New**:
- `app/(dashboard)/users/page.tsx`
- `components/features/users/*` (UserForm, PermissionSelector)
- `api/users/route.ts` (CRUD)
- `api/auth/register/route.ts` - User registration
- `server/services/authService.ts`

**Key features**:
- Staff account management
- Role assignment (admin/staff)
- Permission assignment (granular)
- Password changes
- Account activation/deactivation

### 7. Audit Logs Module
**Legacy**: `renderAuditLogView()` (lines 952-958)
**New**:
- `app/(dashboard)/audit/page.tsx`
- `components/features/audit/AuditLogView.tsx`
- `api/audit-logs/route.ts` - Search, filter, pagination
- `server/services/auditService.ts` - Auto-logging wrapper

**Key features**:
- Immutable transaction history
- Searchable by user, action, date
- Exportable audit trails

### 8. Settings Module
**Legacy**: `renderSettingsView()` (lines 876-942)
**New**:
- `app/(dashboard)/settings/page.tsx`
- `components/features/settings/*` (CategoryManager, BackupRestore, DailyClose)
- `api/backup/export|import/route.ts`
- `api/reports/daily-close/route.ts`
- `server/services/dailyCloseService.ts`

**Key features**:
- Backup/restore (JSON export/import)
- Category management
- Daily close (สรุปยอดปิดร้าน) with expense tracking
- PDF export of daily summary
- System version display

## Authentication & Authorization

### JWT Strategy

1. **Login** (`POST /api/auth/login`)
   - Accept: `{ username, password }`
   - Verify password against `bcrypt` hash
   - Return: `{ accessToken, refreshToken, user }`
   - Store tokens: `accessToken` in memory/cookie, `refreshToken` in httpOnly cookie

2. **Middleware** (`middleware.ts`)
   - Verify JWT on protected routes (all /dashboard/* routes)
   - Reject if token expired or invalid
   - Attach `user` to request

3. **Permission Checks**
   - Each API route checks `user.permissions` array
   - Frontend components conditionally render based on `useAuth()` hook
   - `hasPermission(tab)` utility function

### Default Users (Seeded on Setup)
- **Admin**: username `admin`, password hashed, permissions: `['all']`
- **Staff**: username `staff`, password hashed, permissions: `['pos', 'services', 'report']`

## Key Implementation Details

### Data Fetching Pattern

```typescript
// Client Component (useEffect hook)
const [data, setData] = useState(null);
useEffect(() => {
  fetch('/api/inventory')
    .then(r => r.json())
    .then(setData)
    .catch(err => showNotification(err.message, 'error'));
}, []);

// OR: useQuery hook (optional React Query for caching)
const { data, isLoading, error } = useQuery(['inventory'], () => fetch('/api/inventory').then(r => r.json()));
```

### Server Action Pattern (Mutation)

```typescript
// app/(dashboard)/stock/action.ts (Server Action)
'use server'
import { prisma } from '@/lib/prisma';

export async function deleteProduct(id: int) {
  try {
    await prisma.product.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// components/features/stock/ProductForm.tsx (Client)
'use client'
const { data, action } = useFormStatus();
const handleDelete = async () => {
  const result = await deleteProduct(productId);
  if (result.success) showNotification('Deleted', 'success');
};
```

### Cart State Management (Zustand)

```typescript
// store/cartStore.ts
import { create } from 'zustand';

export const useCartStore = create((set) => ({
  items: [],
  itemDiscount: 0,
  billDiscount: 0,
  addItem: (product) => set((state) => ({ items: [...state.items, product] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
  setDiscount: (type, amount) => set((state) => ({ [type]: amount })),
  total: () => { /* calculate */ },
  clear: () => set({ items: [], itemDiscount: 0, billDiscount: 0 }),
}));

// components/features/pos/CartSummary.tsx
const { items, total, removeItem } = useCartStore();
```

### PDF Generation

```typescript
// api/reports/daily-close/route.ts (Server)
import { PDFDocument, PDFPage } from 'pdfkit';

export async function POST(request) {
  const data = await request.json();
  const doc = new PDFDocument();
  
  doc.fontSize(16).text('Daily Close Summary', 100, 50);
  doc.fontSize(12).text(`Cash Sales: ${data.cashSales}`, 100, 100);
  // ... more PDF generation
  
  const buffer = await doc.finalize();
  return new Response(buffer, {
    headers: { 'Content-Type': 'application/pdf' },
  });
}
```

### Error Handling

```typescript
// lib/api-client.ts
export const apiClient = axios.create({
  baseURL: '/api',
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login';
    }
    throw error.response?.data || error;
  }
);
```

## Development Workflow

### Initial Setup
1. Initialize Next.js project: `npx create-next-app@latest ucomPos --typescript`
2. Install dependencies: `npm install prisma @prisma/client zustand zod bcryptjs`
3. Configure Supabase credentials in `.env.local`
4. Initialize Prisma: `npx prisma init`
5. Define schema in `prisma/schema.prisma`
6. Run migration: `npx prisma migrate dev --name init`
7. Generate Prisma client: `npx prisma generate`

### Feature Development Sequence
1. **Phase 1**: Authentication (login, middleware, JWT)
2. **Phase 2**: Database schema & migrations
3. **Phase 3**: POS module (foundation)
4. **Phase 4**: Stock module (inventory management)
5. **Phase 5**: Services module
6. **Phase 6**: Installments module
7. **Phase 7**: Reports module
8. **Phase 8**: Users & audit modules
9. **Phase 9**: Settings & backup/restore

### Testing Strategy
- **Unit tests**: Jest for utility functions, validators
- **Integration tests**: API routes with Prisma mock/real DB
- **E2E tests**: Playwright for critical user flows (login, POS, report)
- **Manual testing**: All features on desktop + mobile (responsive)

### Deployment
- **Hosting**: Vercel (Next.js native)
- **Database**: Supabase (managed PostgreSQL)
- **Environment variables**: Stored in Vercel project settings
- **CI/CD**: GitHub Actions (lint, test, deploy on push to main)

## Common Pitfalls & Solutions

| Issue | Solution |
|-------|----------|
| JWT token expires mid-session | Use refresh token to get new access token, retry original request |
| N+1 database queries | Use Prisma `include` or `select` to fetch related data in one query |
| Cart not persisting on refresh | Store in browser localStorage via custom hook, or Zustand persist middleware |
| Slow reports on large datasets | Add database indexes on `date` and `userId`, use server-side filtering before sending to frontend |
| Thai text not rendering | Ensure Sarabun font is loaded in `app/layout.tsx`, use `lang="th"` HTML attribute |
| PDF export cuts off | Use page breaks in PDF generation, test different browsers (rendering varies) |
| Permission checks bypassed | Apply permission checks in middleware AND in API route handler (defense in depth) |

## Migration Checklist

### Phase 0: Project Setup
- [ ] Initialize Next.js with TypeScript
- [ ] Install all dependencies (prisma, zustand, zod, bcryptjs, etc.)
- [ ] Configure Supabase credentials
- [ ] Create Prisma schema based on database design above
- [ ] Run migrations to create tables
- [ ] Seed initial users and categories

### Phase 1: Authentication
- [ ] Create login page (`app/(auth)/login/page.tsx`)
- [ ] Implement JWT signing/verification (`lib/auth.ts`)
- [ ] Build login API route (`api/auth/login/route.ts`)
- [ ] Create auth middleware (`middleware.ts`)
- [ ] Test login flow

### Phase 2: Core Modules
- [ ] POS module with product search, cart, checkout
- [ ] Stock module with CRUD, bulk import
- [ ] Services module with repair/topup/extension
- [ ] Installments module with partner ledger
- [ ] Reports module with analytics

### Phase 3: Admin Features
- [ ] Users module (add/edit/delete staff)
- [ ] Audit logs (immutable history)
- [ ] Settings (backup, restore, daily close)

### Phase 4: Polish
- [ ] Dark mode toggle (preserved from original)
- [ ] Responsive design (mobile-first)
- [ ] PDF export (daily close)
- [ ] Error handling & notifications
- [ ] Performance optimization (lazy loading, caching)

## Preserving Legacy Features

### What Stays the Same
- **UI/UX**: Tailwind CSS styling, dark mode toggle, Thai font (Sarabun)
- **Features**: All 8 modules with same business logic
- **Icons**: SVG icons library (reusable)
- **Theming**: Dark/light mode with CSS variables
- **Localization**: Thai language throughout (strings, date format)
- **Permissions**: Role-based access (admin vs staff)

### What Changes
- **Storage**: localStorage → Supabase PostgreSQL
- **Architecture**: Monolithic → Full-stack (separation of concerns)
- **Type Safety**: Loose types → TypeScript strict mode
- **Code organization**: 1480-line file → modular components & API routes
- **Build**: No build → Next.js compilation & optimization
- **Deployment**: File:// protocol → Vercel + Supabase

## Documentation & References

### Internal
- Database schema: `prisma/schema.prisma`
- API contracts: `types/api.ts`
- Database types: `types/database.ts`
- Validators: `lib/validators.ts`

### External
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Supabase: https://supabase.com/docs
- Zustand: https://github.com/pmndrs/zustand
- Zod: https://zod.dev

---

## Next Steps

When implementation begins:
1. Start with `/CLAUDE.md` in plan mode to design individual features
2. Follow the development sequence outlined above
3. Create sub-tasks for each module
4. Keep database schema synchronized with Prisma migrations
5. Maintain TypeScript strict mode for type safety

### Coding Guidelines & Best Practices

- **File Size & Modularity:** 
  Keep files under 300 lines of code. Extract and modularize into smaller components whenever possible.
- **State Management:** 
  Avoid excessive use of `useState` in a single component. Leverage `Zustand` for global or complex state management across multiple components.
- **Server vs. Client Components (Next.js App Router):**
  Default to Server Components for data fetching and layouts to optimize performance. Only add `'use client'` at the lowest possible leaf node in the component tree where interactivity (e.g., `onClick`, `useState`, `useEffect`) is strictly required.
- **Type Safety & Data Validation:**
  Strict TypeScript mode is mandatory; never use `any`. All incoming API payloads and form submissions MUST be validated using `Zod` schemas (defined in `lib/validators.ts`) before processing or database execution.
- **Data Fetching & Prisma Queries:**
  Prevent over-fetching and N+1 query problems. Always use `select` or `include` explicitly in Prisma queries to fetch only the required columns.
- **Styling Standards:**
  Utilize standard Tailwind CSS v4 utility classes and DaisyUI components for UI consistency. Avoid inline styles. If custom styling is unavoidable, utilize `@layer components` in the CSS configuration to keep JSX clean.
- **Server Actions vs API Routes:**
  Use Server Actions (`server/actions/`) primarily for form mutations and simple CRUD operations from Client Components. Use API Routes (`app/api/`) for external integrations, webhooks, or complex data aggregations like reports.