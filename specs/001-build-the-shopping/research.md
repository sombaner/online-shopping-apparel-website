# Phase 0 Research – Foundational Apparel E‑Commerce Platform

## Decision Log Format
| ID | Topic | Decision | Rationale | Alternatives Considered | Follow-up / Owner |
|----|-------|----------|-----------|--------------------------|--------------------|
| R-01 | DAL Strategy (SQLite now, Azure SQL later) | Introduce thin repository interfaces + lightweight query builder (likely Knex) but start with better-sqlite3 for dev; abstract queries behind repositories. | Eases migration to Azure SQL by swapping driver & migrations; better-sqlite3 fast for local prototyping. | Raw SQL only (harder migration); Full ORM (Prisma/TypeORM) adds complexity & footprint early. | Validate Knex vs direct by spike. |
| R-02 | Password Policy | Min length 12, require 3/4 classes (upper, lower, digit, symbol), lockout after 5 failed attempts within 15 min, exponential backoff. | Security baseline consistent with industry; reduces brute-force risk. | 8 char simpler (weak), NIST minimal complexity (less defense). | Document enforcement test cases. |
| R-03 | Email Verification Resend | Cooldown 5 minutes; max 5 resend attempts / 24h per email. | Limits abuse/spam while supporting legitimate retries. | Unlimited (abuse risk); 24h lock after 1 fail (frustrating). | Implement rate limiter store. |
| R-04 | Structured Logging | JSON lines: {ts, level, traceId, spanId, userId, route, latencyMs, event, domain, errorCode}. | Supports observability principle; consistent ingestion. | Free-form text (hard to parse); verbose multi-line. | Draft logging util spec. |
| R-05 | Metrics & Tracing | Expose internal metrics endpoint (Prom-style) later; Phase 1 minimal counters + latency histograms in memory; future OpenTelemetry instrumentation. | Fast initial delivery; future-ready. | Implement full OTEL now (overhead); no metrics (visibility gap). | Add TODO for OTEL integration milestone. |
| R-06 | Performance Budgets | p95: catalog list <800ms, product detail <600ms, checkout submit <700ms; target tighten to <300ms Phase 2. | Provides measurable goals w/o premature micro-optimization. | Immediate aggressive budgets (risk slip) | Add monitoring stub simulation. |
| R-07 | Accessibility Audit | Integrate axe-core script in CI for key pages (home, product, cart, checkout). Quarterly manual review. | Automated baseline + scheduled deeper review aligns principle 7. | Manual only (miss regressions); full-time tool (overkill early). | Add CI job placeholder. |
| R-08 | Notification Retry Policy | Exponential backoff: attempts at 0m, 5m, 15m, 30m (4 attempts) then mark failed. | Balances delivery vs noise; finite attempts. | Infinite retry (noise); single attempt (fragile). | Configure scheduler mock. |
| R-09 | Rate Limiting | Login: 5/min + 50/day; Password reset: 3/hour; Review posting: 5/hour; Support tickets: 3/hour. Use token bucket in memory (pluggable store). | Deters abuse; simple config for Phase 1. | None (risk); Very strict (UX pain). | Add middleware spec. |
| R-10 | Inventory Concurrency | Optimistic: decrement on order finalize; re-check quantity in transaction; if fail → error & refresh cart. | Simple, low contention early; avoids locks. | Pessimistic locking (need DB features); Event reservation (overkill). | Write race test scenario. |
| R-11 | Review Moderation SLA | 24h target; escalate >48h pending. | Encourages quality & trust. | Immediate auto-publish (risk); indefinite pending (stale). | Add dashboard metric. |
| R-12 | Audit Log Retention | 13 months rolling retention (aligns NFR). Purge job monthly. | Meets compliance-like visibility; bounded storage. | Infinite (cost); 3 months (short). | Implement retention task. |
| R-13 | PII Retention & Deletion | Provide user account deletion (soft-delete + 30d purge). Exports in JSON on request. | Privacy principle & future compliance readiness. | No deletion (non-compliant); immediate hard delete (audit loss). | Model soft-delete flags. |
| R-14 | Stripe Integration Scope | Phase 1 stub (simulate success). Phase 2 integrate Stripe Checkout (hosted). | Defers PCI scope; quick iteration. | Direct card form (PCI burden early). | Plan integration epic. |
| R-15 | DAL Migration Path | Use migration scripts (Knex migrations) from the start even on SQLite. | Smooth future Azure SQL adoption. | Ad-hoc schema SQL (hard to port). | Initialize migration folder. |
| R-16 | Accessibility Focus Areas | Keyboard nav, color contrast, form labels, ARIA for dynamic content. | High ROI foundational improvements. | Full screen reader audits now (time). | Add acceptance tests. |
| R-17 | Error Envelope Standard | { error: { code, message, correlationId } } across all APIs (2xx vs 4xx/5xx separation). | Consistency & observability correlation. | Ad-hoc error bodies. | Document codes list. |
| R-18 | Testing Strategy | Vitest units; Supertest contracts; Playwright E2E critical path (browse→checkout→track). | Layered test coverage per constitution principle. | Only unit tests (insufficient); Only E2E (slow). | Setup config scaffolds. |
| R-19 | State Management | Start with local component state + small custom composables; evaluate Pinia only if complexity > threshold (≥3 cross-cutting states). | Avoid premature dependency. | Pinia from start (extra weight); Global event bus (messy). | Monitor complexity metric. |
| R-20 | Build Tooling | Vite for dev/build; no heavy CSS framework; custom utility classes & CSS variables. | Fast iteration & performance. | Webpack (heavier config); Large UI kit dependency. | Add style guide stub. |

## Open Items (None Blocking for Plan Completion)
- Formal correlation ID generation spec (tie to logging & error envelope)
- Automated privacy export implementation details

## Deferred (Post-Phase 1) Items
- Social login integration
- Real payment gateway
- Full metrics endpoint & OTEL exporter
- Advanced reporting engine optimization

## All Clarifications Resolved?
YES – previously flagged spec uncertainties converted into concrete decisions above.

## Exit Confirmation
Phase 0 complete; proceed to Phase 1 design.
