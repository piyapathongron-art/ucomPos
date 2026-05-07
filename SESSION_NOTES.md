# Session Handover Notes

> Pick up here in the next session. This file is the running log of what's done, what's stubbed, and the next concrete step. Keep it terse — append, don't archive.

## Last touched: 2026-05-07 (session 5) — ALL PHASES COMPLETE

## Phase status

- [x] **Phase 0** — Configs, Prisma 7 schema (`schema.prisma` has no url; `prisma.config.ts` holds `datasource.url` from `DIRECT_URL`)
- [x] **Phase 1** — Auth (JWT + httpOnly cookies, login/logout/refresh/me, edge middleware, dashboard shell with permission-filtered sidebar)
- [x] **Phase 2** — POS + Stock + Categories
- [x] **Phase 3** — Reports
- [x] **Phase 4** — Services (repairs / topups / extensions)
- [x] **Phase 5** — Installments (partner ledger) — all components + API routes were already complete
- [x] **Phase 6** — Users + Audit log UI
- [x] **Phase 7** — Settings (backup/restore, daily close, category manager UI)
- [x] **Phase 8** — Polish (receipt printing, daily close print, stock negative guard)
- [x] **Phase 9** — Deployment prep (vercel.json, health route, README, .env.example, build script, .gitignore)

---

## What Phase 2 shipped

### API routes
- `GET /api/inventory` — list products (query: `q`, `categoryId`, `favorites=1`, `includeInactive=1`). Permission: `pos`.
- `POST /api/inventory` — create product. Permission: `stock`.
- `GET /api/inventory/[id]` · `PUT /api/inventory/[id]` · `DELETE /api/inventory/[id]` (soft delete via `isActive=false`). Mixed perms (`pos` for read, `stock` for write).
- `POST /api/inventory/bulk-import` — JSON array, upserts by `productId`. Quantities are **incremented** when the productId exists (so re-imports add stock instead of overwriting). Permission: `stock`.
- `GET /api/categories` (any auth) · `POST /api/categories` (perm: `settings`).
- `PUT /api/categories/[id]` · `DELETE /api/categories/[id]` — perm: `settings`.
- `POST /api/sales` — creates sale + decrements stock atomically in a `prisma.$transaction`. Perm: `pos`.
- `GET /api/sales` — list with `from`, `to`, `limit`. Perm: `report`.
- `GET /api/sales/[id]` (perm: `report`) · `DELETE /api/sales/[id]` — soft void: marks `voided=true`, restores stock. Perm: `report`.

### Server services
- `server/services/inventoryService.ts` — `listProducts`, `getProduct`, `createProduct`, `updateProduct`, `softDeleteProduct`, `bulkCreateProducts` (upsert + qty increment).
- `server/services/salesService.ts` — `computeSaleTotals`, `createSale`, `listSales`, `getSale`, `voidSale`. **Note**: profit/total math lives here; if pricing rules change, edit only this file.
- `server/services/auditService.ts` — `recordAudit({ userId, action, entityType, entityId, changes })`. Already called from inventory + sales routes.

### UI
- `app/(dashboard)/stock/page.tsx` → `<StockView />` — searchable table, ★ favorite toggle, add/edit modal, bulk JSON import, soft delete.
- `app/(dashboard)/pos/page.tsx` → `<POSView />` — two-column layout: product grid (left, with search/category/favorites filter) and cart sidebar (right, sticky on lg+). `<CheckoutForm />` modal handles cash (with change calc) or transfer.
- Cart state: `store/cartStore.ts` (Zustand + persist). Computed getters: `subtotal()`, `totalItemDiscount()`, `total()`, `totalCost()`, `profit()`. **Be aware**: these are functions, not values — components must subscribe to `items`/`billDiscount` separately to trigger re-renders (already handled in `<CartSummary />`).

---

## What Phase 3 shipped

### API
- `GET /api/reports/analytics` — accepts `from`, `to` (ISO date strings), perm: `report`. Returns `{ summary, topProducts, topCategories }`.
  - `summary`: revenue, profit, cost, saleCount, avgTicket, cashTotal/cashCount, transferTotal/transferCount.
  - `topProducts`: top 10 by revenue (Prisma `groupBy` on `SaleItem.productId`).
  - `topCategories`: top 10 by revenue (app-level grouping via `SaleItem → Product → Category`).

### Server service
- `server/services/reportService.ts` — `getRangeSummary`, `getTopProducts`, `getTopCategories`. All queries automatically exclude `voided=true` sales.

### UI (`components/features/reports/`)
- `DateRangePicker.tsx` — preset buttons: วันนี้ / สัปดาห์นี้ / เดือนนี้ / กำหนดเอง (two date inputs appear on custom).
- `KPICards.tsx` — 4-card grid: ยอดขายรวม, กำไรสุทธิ (with margin %), ยอดเฉลี่ย/บิล, เงินสด/โอน.
- `TopProducts.tsx` — bar list, width proportional to revenue vs max.
- `TopCategories.tsx` — same layout, green bars.
- `TransactionList.tsx` — fetches from `GET /api/sales`, client-side pagination (20/page), click row → `SaleDetailModal` with line items + discount breakdown.
- `ReportView.tsx` — orchestrates all the above; loads analytics on date-range change.
- `Icons.ChevronRight` added to `components/ui/Icons.tsx`.

### Gotchas
1. `getTopCategories` does application-level grouping (not SQL GROUP BY) — fine for typical date ranges but may be slow over large date spans.
2. `TransactionList` fetches up to 500 sales from `/api/sales` — adjust limit if needed.

---

## What Phase 4 shipped

### API
- `GET /api/services?type=REPAIR|TOPUP|EXTENSION&status=PENDING|COMPLETED|CANCELLED` — list services. Perm: `services`.
- `POST /api/services` — create. Perm: `services`.
- `GET/PUT/DELETE /api/services/[id]` — get, update, delete + audit log.

### Server service
- `server/services/serviceService.ts` — `listServices`, `getService`, `createService`, `updateService`, `deleteService`.
- `details` JSON column cast via `Prisma.InputJsonObject` (required for Prisma 7 type safety).

### UI (`components/features/services/`)
- `ServiceForm.tsx` — modal form that renders different `details` fields per type (REPAIR: device/customer/phone/issue; TOPUP: carrier select + เบอร์; EXTENSION: device/period/commission). Status select appears only on edit.
- `ServicesView.tsx` — 3-tab layout (ซ่อม | เติมเงิน | ต่ออายุ), table with status badge + "เสร็จ" quick-action button (PENDING → COMPLETED), edit, delete.

### Validators added
- `serviceSchema`, `serviceUpdateSchema` in `lib/validators.ts`.

---

---

## What Phase 5 shipped (was already done)

All API routes, service, and UI components for installments were implemented in a prior session:
- `app/api/partners/route.ts`, `[id]/route.ts`, `[id]/transactions/route.ts`
- `server/services/partnerService.ts`
- `components/features/installments/` — InstallmentView, PartnerDetail, PartnerForm, TransactionForm

---

## What Phase 6 shipped

### API
- `GET /api/users` — list active users. Perm: `users`.
- `POST /api/users` — create user (bcrypt password). Returns 409 on duplicate username. Perm: `users`.
- `GET/PUT/DELETE /api/users/[id]` — get, update fields, deactivate (soft delete). DELETE blocks self-deletion. Perm: `users`.
- `PUT /api/users/[id]/password` — change password (bcrypt rehash). Perm: `users`.
- `GET /api/audit-logs` — paginated (50/page), filterable by `q`, `from`, `to`, `userId`, `action`. Perm: `audit`.

### Server service
- `server/services/userService.ts` — listUsers, getUser, createUser, updateUser, changeUserPassword, deactivateUser. All selects exclude `passwordHash`.

### Validators added
- `userCreateSchema`, `userUpdateSchema`, `changePasswordSchema` in `lib/validators.ts`.

### UI
- `components/features/users/PermissionSelector.tsx` — checkbox grid with "select all" toggle.
- `components/features/users/UserForm.tsx` — create/edit modal. On create: username+password fields; on edit: name/email/role/permissions only.
- `components/features/users/UsersView.tsx` — table with inline edit (pencil), change-password (lock), deactivate (trash). Includes inline `ChangePasswordModal`. Self-deactivation blocked.
- `components/features/audit/AuditLogView.tsx` — paginated table, search bar, date range filter, click row to expand JSON `changes` diff. Color-coded action column.

---

## What Phase 7 shipped

### API
- `GET /api/backup/export` — downloads JSON with categories, products, partners, partnerTransactions. Perm: `settings`.
- `POST /api/backup/import` — upserts categories (by name), products (by productId, qty **incremented**), partners (by id). Returns `{ stats }`. Perm: `settings`.
- `POST /api/reports/daily-close` — upserts DailyClose for date, creates Expense rows, calculates netProfit = grossProfit − expenses. Perm: `settings`.
- `GET /api/reports/daily-close?date=YYYY-MM-DD` — returns live sales summary + existing DailyClose if any.

### UI
- `components/features/settings/CategoryManager.tsx` — inline add/edit/delete list, calls existing `/api/categories` routes.
- `components/features/settings/BackupRestore.tsx` — Export button (opens tab) + file-input import with result stats display.
- `components/features/settings/DailyClose.tsx` — date picker (defaults today), live sales KPI cards, expense entry list, net profit summary, notes textarea, save button (upserts DailyClose).
- `components/features/settings/SettingsView.tsx` — orchestrates the three above + system info card.

### Icons added to `components/ui/Icons.tsx`
ChevronLeft, Pencil, Trash, Lock, Search, Download, Upload, Tag, Plus, Calendar, FileJson, UserPlus.

---

## What Phase 8 shipped

### Bug fix
- `server/services/salesService.ts` — added stock validation loop **before** the decrement loop inside `prisma.$transaction`. Each item with a `productId` is checked against current `qty`; throws a Thai-language error if insufficient stock. This prevents negative quantities.

### Receipt printing (browser `window.print()`)
- `components/features/pos/ReceiptPrint.tsx` — self-contained receipt layout (monospace font, 300px max-width). Renders: header, date/cashier/bill-id, itemized lines with qty × price + per-item discounts, subtotal/discount/total rows, payment method, received cash + change for CASH transactions, notes.
- `components/features/pos/CheckoutForm.tsx` — refactored to a two-stage flow (`'form' | 'receipt'`). After a successful sale: cart is cleared, sale JSON is captured into `ReceiptData`, component transitions to receipt stage. The receipt is rendered twice: once in a `<div id="printable-area">` offscreen (for `window.print()`), once visible as a modal preview. Buttons: "ปิด" (calls `onClose`) + "พิมพ์ใบเสร็จ" (calls `window.print()`).
- `components/features/pos/POSView.tsx` — `onCompleted` no longer closes the checkout modal. It only refreshes product stock and shows a success notification. The modal stays open so the user can print the receipt.

### Daily close print
- `components/features/settings/DailyClose.tsx` — added `DailyClosePrintLayout` (inline component, monospace format). A "พิมพ์" button appears after a daily close is saved; it renders `DailyClosePrintLayout` in a `<div id="printable-area">` offscreen and calls `window.print()`.

### Print CSS (`app/globals.css`)
- Added `@page { size: 80mm auto; margin: 8mm }` — matches standard 58/80mm thermal receipt paper.
- `#printable-area` gets `background: white; color: black` to override dark-mode during print.

---

## What Phase 9 shipped

- **`.gitignore`** — added `pnpm-debug.log*` (was missing).
- **`package.json`** — build script is now `prisma generate && next build` so Vercel regenerates the Prisma client automatically on every deploy.
- **`.env.example`** — rewritten with clearer comments, correct Supabase port notes (6543 pooled vs 5432 direct), `NEXT_PUBLIC_APP_URL`, and `openssl rand -base64 48` hint for secrets.
- **`vercel.json`** — region `sin1` (Singapore), install/build commands, security response headers on `/api/*`.
- **`app/api/health/route.ts`** — public liveness probe (`GET /api/health`). Runs `SELECT 1` and returns `{ status, db, ts }`. Returns 503 if DB unreachable. Added to `PUBLIC_PATHS` in middleware so no auth is required.
- **`middleware.ts`** — `/api/health` added to `PUBLIC_PATHS`.
- **`README.md`** — full rewrite: tech stack table, feature list, step-by-step local setup, Vercel deployment guide (env vars table, migration commands, health check), scripts table, full project structure tree, permissions table, architecture notes.

---

## Known gotchas / things deliberately not done yet

1. **Receipt printing / PDF** — implemented via `window.print()` in Phase 8. No external library needed. Print dialog opens the browser's native print UI; user selects their thermal printer.
2. **Stock can go negative** — `salesService.createSale` uses `decrement` with no minimum check. Add a select-then-validate inside the transaction or DB CHECK constraint if needed.
3. **Bulk import is JSON only** — no CSV parser yet. Sample shape lives in `components/features/stock/BulkImport.tsx`.
4. **No CategoryManager UI** — categories CRUD API exists but Settings page has no UI. Add when Phase 7 starts.
5. **No optimistic updates** — every mutation re-fetches the list.
6. **`useSearchParams()` in `LoginForm`** — wrap in `<Suspense>` if `next build` warns.
7. **Sales void permission is `report`** — staff can void others' sales. Tighten in `app/api/sales/[id]/route.ts` DELETE if needed.

---

## Useful repo grep targets

- Find permission checks: `grep 'requirePermission('`
- Find audit calls: `grep 'recordAudit('`
- Find Zod schemas: `lib/validators.ts`
- Find domain types: `types/domain.ts`
- Cart math: `store/cartStore.ts` and `server/services/salesService.ts:computeSaleTotals`

---

## Open prompts / decisions waiting on user

- **Reset password rule for staff** — currently no UI to change password. Need it before adding more users.
- **Multi-shop** — schema is single-tenant. If multiple shops are ever needed, every table needs a `shopId`. Easier to do before there's prod data.
- **Currency** — hard-coded THB. If non-Thai shops appear, abstract `formatBaht`.
