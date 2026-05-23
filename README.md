# Expenso Backend

Expenso Backend is a production-oriented NestJS API for a multi-user expense management product. It provides authentication, category management, transaction management, dashboard read models, report read models, cursor pagination, centralized response/error contracts, and PostgreSQL persistence through Prisma.

Full engineering documentation lives in [`./docs`](./docs/README.md).

## Architecture Overview

The backend is a modular monolith:

```text
Controller -> Service -> Repository -> Prisma -> PostgreSQL
```

Controllers handle HTTP binding only. Services orchestrate use cases and transaction boundaries. Repositories own Prisma query shape, user scoping, filtering, pagination, aggregation, and selected fields. Prisma is the only database access layer. PostgreSQL is the durable source of truth.

This architecture keeps production concerns separated: API contracts, business orchestration, query performance, and schema evolution can be reviewed independently.

## Tech Stack

- NestJS 11
- Prisma ORM 7 with `@prisma/adapter-pg`
- PostgreSQL
- Passport JWT and `@nestjs/jwt`
- bcrypt password hashing
- class-validator and class-transformer DTO validation
- Zod for optional shared/runtime schemas
- Helmet and CORS
- Jest and Supertest

## Setup

```bash
npm install
cp .env.example .env
```

Start local PostgreSQL with Docker:

```bash
docker run --name expenso-postgres \
  -e POSTGRES_USER=expenso \
  -e POSTGRES_PASSWORD=expenso \
  -e POSTGRES_DB=expenso_db \
  -p 5432:5432 \
  -d postgres:16
```

Use this local database URL:

```bash
DATABASE_URL="postgresql://expenso:expenso@localhost:5432/expenso_db"
```

Run migrations, generate Prisma client, and seed the admin user:

```bash
npx prisma migrate dev
npx prisma generate
npm run prisma:seed
```

Run the API:

```bash
npm run start:dev
```

The API listens on `http://localhost:3001` by default and uses `/api/v1`.

## Environment Variables

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/expenso_db"
FRONTEND_URL="http://localhost:3000"
JWT_ACCESS_SECRET="replace-with-access-token-secret"
JWT_REFRESH_SECRET="replace-with-refresh-token-secret"
ACCESS_TOKEN_EXPIRES="15m"
REFRESH_TOKEN_EXPIRES="7d"
ADMIN_NAME="Super Admin"
ADMIN_EMAIL="admin@expenso.local"
ADMIN_PASSWORD="replace-with-strong-admin-password"
```

Never commit real `.env` values.

## API Structure

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
GET  /api/v1/auth/admin-only

POST   /api/v1/categories
GET    /api/v1/categories
GET    /api/v1/categories/:id
PATCH  /api/v1/categories/:id
DELETE /api/v1/categories/:id

POST   /api/v1/transactions
GET    /api/v1/transactions
GET    /api/v1/transactions/:id
PATCH  /api/v1/transactions/:id
DELETE /api/v1/transactions/:id

GET /api/v1/dashboard/overview
GET /api/v1/dashboard/expense-by-category
GET /api/v1/dashboard/income-vs-expense
GET /api/v1/dashboard/cash-flow
GET /api/v1/dashboard/top-categories
GET /api/v1/dashboard/recent-transactions

GET /api/v1/reports/summary
GET /api/v1/reports/transactions
GET /api/v1/reports/spending-trends
GET /api/v1/reports/category-breakdown
GET /api/v1/reports/monthly
GET /api/v1/reports/cash-flow
GET /api/v1/reports/top-categories
GET /api/v1/reports/export-preview

GET /api/v1/health
```

Detailed endpoint docs are in [`../docs/api`](../docs/api).

## Auth Overview

Registration creates the user, default categories, token pair, and refresh-token digest in one Prisma transaction. Login verifies bcrypt passwords and returns JWT access/refresh tokens. Refresh verifies the refresh JWT, checks it against the stored SHA-256 digest, and rotates the stored token. Logout clears the stored refresh token. RBAC uses `@Roles` and `RolesGuard`.

## Response Envelope

Successful responses:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "meta": {}
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials"
  }
}
```

## Pagination Strategy

List and report-table endpoints use cursor pagination:

```text
GET /api/v1/transactions?limit=20&cursor=<id>&type=EXPENSE
```

Responses place pagination state in `meta`:

```json
{
  "limit": 20,
  "nextCursor": null,
  "hasNext": false
}
```

Cursor pagination was chosen over offset pagination because it scales better for growing transaction histories and supports deterministic indexed ordering.

## Dashboard And Reporting

Dashboard and reports are read-model modules. They do not call transactional CRUD services. Their repositories query PostgreSQL through Prisma aggregation, `groupBy`, selected relation fields, and parameterized raw SQL for date bucketing. Balances are not stored; they are computed from transaction history.

## Folder Structure

```text
src/
├── common/
├── config/
├── generated/prisma/
├── modules/
│   ├── auth/
│   ├── categories/
│   ├── dashboard/
│   ├── reports/
│   └── transactions/
├── prisma/
├── shared/schemas/
├── app.module.ts
├── health.controller.ts
└── main.ts
```

## Testing

```bash
npm run build
npm test -- --runInBand
npm run test:e2e
```

E2E tests use the configured database and delete table data before each test. Run them only against a disposable local/test database.

## Diagrams

Mermaid diagrams are in [`./docs/diagrams`](./docs/diagrams/):

- Request lifecycle
- Authentication flow
- Database relations
- Transaction management
- Dashboard and reports flow
- Cursor pagination
- Architecture layering
- Module dependencies
- Response lifecycle
- DFD level 1

## Scalability Notes

The first scaling path is disciplined query governance: keep filters indexed, keep aggregation in PostgreSQL, keep pagination cursor-based, and measure before introducing caches or materialized views. The modular monolith can scale horizontally because request state is not kept in memory.

Future scale work may include read replicas, materialized report views, full-text search indexes, queued export generation, multi-device session storage, and structured observability.

## Development Conventions

- Controllers stay thin.
- Services orchestrate.
- Repositories own complex Prisma queries.
- DTOs validate REST input.
- Zod is optional and does not replace DTOs.
- User-owned queries always include authenticated `userId`.
- API responses preserve the `/api/v1` envelope.
- Architecture, API, database, and diagram docs must be updated with related code changes.
