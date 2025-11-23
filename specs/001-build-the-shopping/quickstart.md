# Quickstart – Foundational Apparel E‑Commerce Platform

## Prerequisites
- Node.js 20+
- SQLite3 installed (or platform-provided lib)

## Steps
1. Install dependencies: (placeholder – dependencies to be defined after package.json creation)
2. Run migrations (creates SQLite file `dev.sqlite`).
3. Seed database with sample categories, products, admin user.
4. Start dev server (API + Vite): `npm run dev`.
5. Open browser at http://localhost:5173.
6. Browse catalog, add product to cart, register account, verify email (console log token), perform checkout (payment stub).
7. View order in account → order history.
8. Run tests: `npm test` (unit + contract stubs expected failing until implementation).

## Sample Flow Validation (Manual)
- Visitor searches "shirt" → receives product list (HTTP 200, pagination fields present).
- Registers new buyer → receives verification token in console → verifies → status updated.
- Adds item to cart → quantity increments → total recalculated.
- Proceeds to checkout → enters addresses → places order (stub payment) → receives order id.
- Admin login (seeded credentials) → views dashboard counts.

## Environment Variables (Planned)
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | SQLite connection string | file:./dev.sqlite |
| NODE_ENV | Runtime env | development |
| PORT | HTTP port | 3000 |
| LOG_LEVEL | Logging verbosity | info |
| RATE_LIMIT_WINDOW_MS | For basic limiter | 60000 |

## Next Steps
- Implement endpoints from contracts.
- Replace payment stub with Stripe Checkout (Phase 2).
- Add automated accessibility CI audit.
