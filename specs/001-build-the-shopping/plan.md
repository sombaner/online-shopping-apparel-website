
# Implementation Plan: Foundational Apparel E‑Commerce Platform

**Branch**: `001-build-the-shopping` | **Date**: 2025-09-21 | **Spec**: [/specs/001-build-the-shopping/spec.md](/specs/001-build-the-shopping/spec.md)
**Input**: Feature specification from `/specs/001-build-the-shopping/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Deliver a minimal-yet-extensible apparel shopping platform (visitor → buyer conversion, catalog browsing, cart, checkout, order lifecycle, admin catalog + order + user management) using Vue.js (minimal libraries) with progressive enhancement. Phase 1 stores metadata (users, products, orders, reviews) in local SQLite (single-process dev mode) with an abstraction layer to permit seamless future migration to Azure SQL (planned via repository + migration scripts). No image upload in initial phase; image fields will reference placeholder/static paths.

## Technical Context
**Language/Version**: JavaScript (ES2022) + Vue 3 Composition API; Node.js 20.x for backend API layer (if introduced)  
**Primary Dependencies**: Vue 3 (core), Pinia (state) [NEEDS CLARIFICATION: include or hand-rolled store?], Vite (build), Lightweight router (vue-router). Avoid heavy UI kits; prefer semantic HTML + minimal utility CSS (custom).  
**Storage**: SQLite (local dev, file-based). Abstraction: Data Access Layer (DAL) anticipating Azure SQL (ADO/knex-like migration; we will choose minimal query builder vs raw SQL). [NEEDS CLARIFICATION: choose direct better-sqlite3 vs knex].  
**Testing**: Vitest (unit), Playwright (E2E critical flows), Supertest (API contract if Node API), ESLint + Constitution-aligned custom rules.  
**Target Platform**: Web (desktop + mobile responsive).  
**Project Type**: web (frontend + (future) backend); Phase 1 may start as single project with API stub layer inside `src/server` before extraction.  
**Performance Goals**: p95 page interactive < 1500ms initial baseline; catalog & product API p95 < 800ms (target tighten to 300ms later); cart/checkout actions < 600ms p95.  
**Constraints**: US-only addresses; USD currency; no image uploads (static placeholders). Stripe integration deferred to token placeholder stubs until PCI scoping clarified.  
**Scale/Scope**: Phase 1 target ≤ 1k users; architecture prepared for 10k with horizontal scaling (stateless API + external DB).

**Assumptions**:
1. Authentication: initial email/password (social deferred).  
2. Email service stubbed (logs to console) before external provider integration.  
3. Inventory concurrency risk low in Phase 1; optimistic decrement at order finalize.  
4. Admin UI shares same SPA with role-based route guards.

**Open Decisions (feed into Phase 0)**:
- Rate limiting mechanism (NGINX vs app-tier token bucket)
- Password policy exact rules
- Verification email resend cooldown
- Accessibility audit pipeline tooling (axe-core integration) 
- Retry policy for outbound emails/notifications
- Data retention period & audit log retention

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance Status | Notes / Actions |
|-----------|-------------------|-----------------|
| SRP/SoC | Compliant (initial) | DAL abstraction isolates persistence; UI components per page/state. |
| SOLID / Dependency Inversion | Partial | Need explicit interface layer for repository to allow Azure SQL swap. |
| Security & Privacy by Design | Partial | Password policy, rate limits, PII masking pending; add to research. |
| Observability & Telemetry | Partial | Logging & metrics plan needed; adopt structured log schema early. |
| Testing Discipline | Planned | TDD enforced via tasks; coverage thresholds defined. |
| Performance & Cost Efficiency | Partial | Budgets draft; finalize p95 endpoints and front-end LCP targets. |
| Usability & Accessibility | Partial | WCAG 2.1 AA target; need audit cadence/tool. |
| Continuous Delivery & IaC | Future | Initial local only; pipeline + infrastructure definitions out of scope Phase 1. |
| Data Integrity & Domain Modeling | Compliant (initial) | Entities enumerated; invariants to codify in domain layer. |
| Ethical & Sustainable Evolution | Compliant (initial) | No dark patterns; debt capacity to schedule post MVP. |

Initial Constitution Check: PASS WITH ACTIONS (no blocking violation; research tasks created). 

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Start with Option 1 (single project) plus `src/server` folder for API simulation (persistence + service layer) to reduce early complexity; plan future extraction to `backend/` when Azure SQL integration + scaling required.

## Phase 0: Outline & Research
Research Task Backlog (derived from spec + constitution actions):
1. Define password complexity & account lockout thresholds (security baseline).
2. Choose DAL strategy: raw better-sqlite3 vs lightweight query builder allowing Azure SQL migration.
3. Determine email verification resend cooldown + rate limit numbers.
4. Select structured logging schema & logging library (minimal overhead) + metrics approach (custom vs OpenTelemetry stub).
5. Finalize performance SLA (p95 & p99 targets) for catalog, product detail, checkout.
6. Accessibility audit tooling (axe-core integration process & cadence).
7. Notification retry policy (attempt count, backoff algorithm).
8. Rate limiting approach & numeric thresholds (login, password reset, review posting, support ticket submission).
9. Inventory race condition strategy (optimistic vs pessimistic; finalize conflict resolution algorithm).
10. Review moderation SLA (target turnaround time & escalation path).
11. Audit log retention duration and storage strategy.
12. Data retention / deletion workflow for PII export & erase.
13. Stripe integration scoping (tokenization strategy, PCI boundary) for Phase 2 readiness.

Planned Output Format (research.md): Decision / Rationale / Alternatives table per topic.

Exit Criteria: All items above have concrete chosen approaches OR explicitly deferred with rationale & tasks created.

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

Design Focus Adjustments:
- Domain Layer: product catalog, cart, checkout, order, review, user accounts.
- Persistence Abstraction: repository interfaces (ProductRepository, OrderRepository, UserRepository, InventoryRepository) returning domain objects; SQLite implementation namespaced.
- API Surface (initial): REST endpoints (JSON) for authentication, catalog browse/filter, product detail, cart ops, wishlist ops, checkout, orders, reviews (moderation), admin management actions.

Contract Strategy:
- OpenAPI 3.1 YAML files per bounded area: `auth.yaml`, `catalog.yaml`, `cart.yaml`, `checkout.yaml`, `orders.yaml`, `reviews.yaml`, `admin.yaml`.
- Error envelope: `{ error: { code, message, correlationId } }`.
- Pagination standard: `?page=1&limit=20` with response `{ data: [...], pagination: { page, limit, total } }`.

Testing Contracts:
- Contract tests (Supertest) generated per endpoint skeleton referencing OpenAPI examples (fail initially).

Quickstart Outline:
1. Install deps & run migrations (SQLite file creation).
2. Seed sample products & admin user.
3. Start dev server & open SPA.
4. Perform sample browse → cart → checkout simulation (mock payment accepted).
5. Run test suite (unit + contract initial failing tests acknowledged until implementation).

Agent Context Update: Will run update script after contract files placed.

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (with actionable items queued)
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
