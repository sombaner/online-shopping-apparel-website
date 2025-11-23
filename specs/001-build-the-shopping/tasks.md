# Tasks: Foundational Apparel E‑Commerce Platform

**Input**: Design documents in `/specs/001-build-the-shopping/` (plan.md, research.md, data-model.md, contracts/, quickstart.md)
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/ (currently only `catalog.yaml` exists)

## Execution Flow (reference)
```
1. Load plan & artifacts → derive entities, contracts, decisions
2. Generate tasks (Setup → Tests (fail first) → Core Models → Services → Endpoints → Integration → Polish)
3. Mark independent-file tasks [P]
4. Ensure tests precede implementation (TDD gate)
5. Provide dependency graph + parallel examples
6. Validate coverage of entities, contracts, decisions
```

## Format
`[ ] T### [P?] Description (exact path)`
`[P]` means task can run in parallel (different file, no dependency link).

Assumptions:
- Language: JavaScript (ES2022) (TypeScript can be added later via separate refactor epic)
- Single project structure per plan (root `src/` + `tests/`), with API under `src/server/`
- Repositories pattern for DAL; SQLite first, Azure SQL later

---
## Phase 3.1: Setup & Tooling
 - [X] T001 Initialize Node.js project (package.json) with scripts: dev, build, test, lint
 - [X] T002 Add core dependencies (vue, vue-router, vite, better-sqlite3, dotenv, zod, express, supertest, vitest, playwright, cross-env)
 - [X] T003 Add dev dependencies (eslint, eslint-plugin-import, eslint-plugin-vue, prettier, vite-node, nodemon, axe-core, @playwright/test)
 - [X] T004 [P] Configure ESLint + Prettier (.eslintrc.cjs, .prettierrc) per constitution
 - [X] T005 [P] Create `./.nvmrc` & `.editorconfig`
 - [X] T006 [P] Create base project structure (`src/`, `src/server/`, `src/server/repositories/`, `src/server/services/`, `src/server/api/`, `src/server/middleware/`, `src/server/lib/`, `src/server/config/`, `src/client/`)
- [ ] T007 Environment config: `.env.example` with vars (DATABASE_URL, PORT, LOG_LEVEL, RATE_LIMIT_WINDOW_MS)
- [ ] T008 Logging utility scaffold (`src/server/lib/logger.js`) with JSON schema (R-04)
- [ ] T009 Correlation ID middleware (`src/server/middleware/correlationId.js`) generating `traceId`
- [ ] T010 Error envelope helper (`src/server/lib/errors.js`) implementing standard { error: { code, message, correlationId } }
- [ ] T011 Rate limiter middleware skeleton (`src/server/middleware/rateLimiter.js`) implementing R-09 numeric thresholds (config-driven)
- [ ] T012 Password policy validator (`src/server/lib/passwordPolicy.js`) per R-02
- [ ] T013 Knex migration setup (even if using better-sqlite3 runtime) `migrations/` + config (R-15)
- [ ] T014 Seed script scaffold (`scripts/seed.js`) inserting admin user, sample categories/products
- [ ] T015 Accessibility test script placeholder (`scripts/axe-scan.js`) referencing axe-core (R-07)
- [ ] T016 Notification retry scheduler stub (`src/server/services/notificationRetryScheduler.js`) (R-08)
- [ ] T017 Audit log retention job stub (`src/server/services/auditRetentionJob.js`) (R-12)
- [ ] T018 Data purge (soft-delete → hard delete) job stub (`src/server/services/accountDeletionJob.js`) (R-13)

## Phase 3.2: Tests First (Write & Watch Them Fail) ⚠️
Contract Files To Create First (tests reference them): `auth.yaml`, `users.yaml`, `cart.yaml`, `checkout.yaml`, `orders.yaml`, `reviews.yaml`, `admin.yaml` (in `specs/001-build-the-shopping/contracts/`).

### 3.2.1 Contract Test Skeletons
- [ ] T019 [P] Create contract file `auth.yaml` & contract tests `tests/contract/auth.contract.test.js` (login, register, verify email, resend verification – includes rate limit assertions)
- [ ] T020 [P] Create contract file `users.yaml` & contract tests `tests/contract/users.contract.test.js` (get profile, update profile)
- [ ] T021 [P] Create contract file `cart.yaml` & contract tests `tests/contract/cart.contract.test.js` (add item, update qty, remove item, get cart)
- [ ] T022 [P] Create contract file `checkout.yaml` & contract tests `tests/contract/checkout.contract.test.js` (initiate checkout, submit order)
- [ ] T023 [P] Create contract file `orders.yaml` & contract tests `tests/contract/orders.contract.test.js` (list orders, get order detail)
- [ ] T024 [P] Create contract file `reviews.yaml` & contract tests `tests/contract/reviews.contract.test.js` (create review, list approved, moderation endpoint)
- [ ] T025 [P] Create contract file `admin.yaml` & contract tests `tests/contract/admin.contract.test.js` (create product, update status, list users)
- [ ] T026 [P] Expand existing `catalog.yaml` tests `tests/contract/catalog.contract.test.js` (list with pagination, product detail variants)

### 3.2.2 Integration / Scenario Tests (User Stories)
- [ ] T027 [P] Integration: visitor browse → search → view product (`tests/integration/browse_flow.test.js`)
- [ ] T028 [P] Integration: register → email verify (simulated token) (`tests/integration/registration_flow.test.js`)
- [ ] T029 [P] Integration: login → protected profile retrieval (`tests/integration/auth_flow.test.js`)
- [ ] T030 [P] Integration: wishlist create/add/remove (`tests/integration/wishlist_flow.test.js`)
- [ ] T031 [P] Integration: cart add/update/remove with inventory decrement check (`tests/integration/cart_flow.test.js`)
- [ ] T032 [P] Integration: checkout order success (payment stub) (`tests/integration/checkout_flow.test.js`)
- [ ] T033 [P] Integration: review submission eligibility (must have order) (`tests/integration/review_eligibility.test.js`)
- [ ] T034 [P] Integration: admin create product & deactivate product (`tests/integration/admin_catalog_flow.test.js`)
- [ ] T035 [P] Integration: audit log generation sanity (create product triggers log) (`tests/integration/audit_log_flow.test.js`)
- [ ] T036 [P] Integration: rate limiting login attempts (`tests/integration/rate_limit_login.test.js`)

### 3.2.3 Unit Test Foundations
- [ ] T037 [P] Unit: password policy rules (`tests/unit/passwordPolicy.test.js`)
- [ ] T038 [P] Unit: error envelope helper (`tests/unit/errors.test.js`)
- [ ] T039 [P] Unit: rate limiter token bucket logic (`tests/unit/rateLimiter.test.js`)
- [ ] T040 [P] Unit: repository base abstract contract (`tests/unit/repositoryBase.test.js`)

## Phase 3.3: Core Domain Models (One file each) – After Tests Written
- [ ] T041 [P] users model (`src/server/models/user.js`)
- [ ] T042 [P] roles model (`src/server/models/role.js`)
- [ ] T043 [P] permissions model (`src/server/models/permission.js`)
- [ ] T044 [P] addresses model (`src/server/models/address.js`)
- [ ] T045 [P] categories model (`src/server/models/category.js`)
- [ ] T046 [P] products model (`src/server/models/product.js`)
- [ ] T047 [P] product_images model (`src/server/models/productImage.js`)
- [ ] T048 [P] inventory_items model (`src/server/models/inventoryItem.js`)
- [ ] T049 [P] wishlists model (`src/server/models/wishlist.js`)
- [ ] T050 [P] wishlist_items model (`src/server/models/wishlistItem.js`)
- [ ] T051 [P] carts model (`src/server/models/cart.js`)
- [ ] T052 [P] cart_items model (`src/server/models/cartItem.js`)
- [ ] T053 [P] orders model (`src/server/models/order.js`)
- [ ] T054 [P] order_lines model (`src/server/models/orderLine.js`)
- [ ] T055 [P] shipments model (`src/server/models/shipment.js`)
- [ ] T056 [P] payments model (`src/server/models/payment.js`)
- [ ] T057 [P] reviews model (`src/server/models/review.js`)
- [ ] T058 [P] cms_pages model (`src/server/models/cmsPage.js`)
- [ ] T059 [P] support_tickets model (`src/server/models/supportTicket.js`)
- [ ] T060 [P] notifications model (`src/server/models/notification.js`)
- [ ] T061 [P] audit_logs model (`src/server/models/auditLog.js`)

## Phase 3.4: Repository Implementations & DAL
- [ ] T062 Base repository abstraction (`src/server/repositories/baseRepository.js`)
- [ ] T063 [P] UserRepository (`src/server/repositories/userRepository.js`)
- [ ] T064 [P] ProductRepository (`src/server/repositories/productRepository.js`)
- [ ] T065 [P] InventoryRepository (`src/server/repositories/inventoryRepository.js`)
- [ ] T066 [P] CartRepository (`src/server/repositories/cartRepository.js`)
- [ ] T067 [P] OrderRepository (`src/server/repositories/orderRepository.js`)
- [ ] T068 [P] ReviewRepository (`src/server/repositories/reviewRepository.js`)
- [ ] T069 [P] WishlistRepository (`src/server/repositories/wishlistRepository.js`)
- [ ] T070 [P] AuditLogRepository (`src/server/repositories/auditLogRepository.js`)
- [ ] T071 [P] NotificationRepository (`src/server/repositories/notificationRepository.js`)
- [ ] T072 Transaction helper & optimistic inventory decrement (`src/server/repositories/transactionHelpers.js`) (R-10)

## Phase 3.5: Services (Business Logic)
- [ ] T073 AuthService (register, login, verify email, resend verification) (`src/server/services/authService.js`)
- [ ] T074 UserService (profile read/update, lockout logic) (`src/server/services/userService.js`)
- [ ] T075 ProductService (list/search, detail with variants aggregation) (`src/server/services/productService.js`)
- [ ] T076 InventoryService (availability, decrement) (`src/server/services/inventoryService.js`)
- [ ] T077 CartService (add/update/remove, price snapshot) (`src/server/services/cartService.js`)
- [ ] T078 WishlistService (add/remove/list) (`src/server/services/wishlistService.js`)
- [ ] T079 CheckoutService (build order draft, compute totals) (`src/server/services/checkoutService.js`)
- [ ] T080 OrderService (persist, list, detail) (`src/server/services/orderService.js`)
- [ ] T081 ReviewService (create pending, list approved, moderation) (`src/server/services/reviewService.js`)
- [ ] T082 AdminCatalogService (create/update product, activate/deactivate) (`src/server/services/adminCatalogService.js`)
- [ ] T083 NotificationService (enqueue + retry policy integration) (`src/server/services/notificationService.js`)
- [ ] T084 AuditLogService (append actions) (`src/server/services/auditLogService.js`)

## Phase 3.6: API Endpoints (Express Routers)
- [ ] T085 Auth routes (`src/server/api/authRoutes.js`)
- [ ] T086 User routes (`src/server/api/userRoutes.js`)
- [ ] T087 Catalog routes (extend existing) (`src/server/api/catalogRoutes.js`)
- [ ] T088 Cart routes (`src/server/api/cartRoutes.js`)
- [ ] T089 Checkout routes (`src/server/api/checkoutRoutes.js`)
- [ ] T090 Order routes (`src/server/api/orderRoutes.js`)
- [ ] T091 Review routes (`src/server/api/reviewRoutes.js`)
- [ ] T092 Admin catalog & user management routes (`src/server/api/adminRoutes.js`)
- [ ] T093 Middleware wiring (rateLimiter, correlationId, error handler) (`src/server/api/middleware.js`)
- [ ] T094 Server bootstrap file (`src/server/index.js`)

## Phase 3.7: UI (Minimal SPA Skeleton)
- [ ] T095 Create Vite + Vue entry (`src/client/main.js` + `index.html`)
- [ ] T096 [P] Router setup & route guards (`src/client/router.js`)
- [ ] T097 [P] State composables (auth, cart, product catalog) (`src/client/composables/`)
- [ ] T098 Layout & shared components (`src/client/components/layout/`)
- [ ] T099 Pages: Home (catalog list) (`src/client/pages/Home.vue`)
- [ ] T100 [P] Page: Product Detail (`src/client/pages/ProductDetail.vue`)
- [ ] T101 [P] Page: Register/Login (`src/client/pages/Auth.vue`)
- [ ] T102 [P] Page: Cart (`src/client/pages/Cart.vue`)
- [ ] T103 [P] Page: Checkout (`src/client/pages/Checkout.vue`)
- [ ] T104 [P] Page: Orders/Order Detail (`src/client/pages/Orders.vue`)
- [ ] T105 [P] Page: Wishlist (`src/client/pages/Wishlist.vue`)
- [ ] T106 [P] Page: Admin Catalog (`src/client/pages/AdminCatalog.vue`)
- [ ] T107 [P] Page: Admin Users (`src/client/pages/AdminUsers.vue`)

## Phase 3.8: Integration & Cross-Cutting
- [ ] T108 Security headers & CORS config (`src/server/middleware/securityHeaders.js`)
- [ ] T109 JWT or session token issuance & verification (`src/server/lib/authTokens.js`)
- [ ] T110 Email verification token generation & console sender stub (`src/server/services/emailService.js`)
- [ ] T111 Rate limit configuration mapping (central registry) (`src/server/config/rateLimits.js`)
- [ ] T112 Performance measurement middleware (latency capture) (`src/server/middleware/metrics.js`) (pre-OTEL)
- [ ] T113 Accessibility automated test run integration (CI script placeholder) (`.github/workflows/accessibility.yml`)
- [ ] T114 Review moderation SLA metric stub (logs pending >24h) (`src/server/services/reviewSlaMonitor.js`) (R-11)
- [ ] T115 Account deletion soft-delete flow (`src/server/services/accountDeletionService.js`)
- [ ] T116 PII export stub service (`src/server/services/piiExportService.js`)

## Phase 3.9: Polish & Validation
- [ ] T117 Unit tests: services (AuthService, CartService, CheckoutService critical paths) (`tests/unit/services/*.test.js`)
- [ ] T118 Contract test refinements (error cases, 4xx/5xx) (`tests/contract/*`)
- [ ] T119 Performance test harness (simulate p95 endpoints) (`tests/perf/perf.test.js`)
- [ ] T120 Accessibility script executes against built pages (`scripts/axe-scan.js` finalize)
- [ ] T121 Logging fields completeness check test (`tests/unit/loggingSchema.test.js`)
- [ ] T122 Review unauthorized & eligibility negative tests (`tests/integration/review_negative.test.js`)
- [ ] T123 Add README section summarizing architecture & tasks completion (`README.md`)
- [ ] T124 Update quickstart with any changed commands (`specs/001-build-the-shopping/quickstart.md`)
- [ ] T125 Dead code & duplication scan + cleanup
- [ ] T126 Final test coverage ≥80% overall, ≥90% core domain (report gate)

## Dependencies
```
T001 → T002 → (T003–T018 can proceed where not dependent)
All tests (T019–T040) must be written & failing before starting T041+
Models (T041–T061) before repositories/services relying on them
Repositories (T062–T072) before services (T073–T084)
Services before API routes (T085–T094)
Server bootstrap (T094) after middleware & routes defined
UI tasks (T095–T107) can run in parallel with backend services once API contracts exist
Integration & cross-cutting (T108–T116) after core services & routes
Polish (T117–T126) last; T126 depends on completion of all prior implementation tasks
```

## Parallel Execution Examples
```
# After T002:
Run in parallel: T004, T005, T006, T007, T008 (distinct files)

# Contract tests wave:
Run T019–T026 simultaneously (each adds its own contract & test file set)

# Integration story tests:
Run T027–T036 in parallel (distinct test files)

# Model creation burst:
Run T041–T061 in parallel (one file per model)

# Repository layer parallel set:
Run T063–T071 once T062 committed

# UI pages:
Run T100–T107 after base layout (T098–T099) & router (T096)
```

## Validation Checklist
- [ ] All contracts have test tasks (auth, users, cart, checkout, orders, reviews, admin, catalog)
- [ ] Every entity in data-model.md has a model task
- [ ] All tests precede implementation tasks (IDs < model/service/endpoint IDs)
- [ ] [P] tasks do not share file paths
- [ ] Error envelope & logging utilities defined before API routes
- [ ] Rate limiting & password policy tasks present (R-02, R-09)
- [ ] Retention, retry, SLA monitoring tasks present (R-08, R-11, R-12, R-13)
- [ ] Accessibility & performance tasks included (R-06, R-07)
- [ ] Migration & seeding tasks included (R-15)

## Notes
- Keep commits atomic (one task per commit ideally)
- Do not implement endpoint logic before corresponding failing tests exist
- Adjust scope if future contract refinements occur—add new tasks rather than mutating existing completed ones

---
Generated under Constitution v1.0.0 guidelines (TDD, observability, security, accessibility) on 2025-09-21.
