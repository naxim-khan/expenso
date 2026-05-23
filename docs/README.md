# Expenso Backend Documentation

This documentation set describes the current Expense Management Backend as implemented in `expenso-backend`. It is written for maintainers, reviewers, onboarding engineers, API consumers, and future scaling work.

The backend is a NestJS modular monolith backed by PostgreSQL through Prisma. The system uses JWT authentication, refresh-token rotation, user-scoped financial data, cursor pagination, global response envelopes, centralized exception handling, repository-owned query logic, and read-model modules for dashboard and reporting.

## Documentation Map

- [System Overview](architecture/system-overview.md) explains the product boundary, runtime shape, and module map.
- [Backend Architecture](architecture/backend-architecture.md) explains controller, service, repository, Prisma, and database responsibilities.
- [Request Lifecycle](architecture/request-lifecycle.md) follows a request through middleware, validation, guards, interceptors, and module code.
- [Authentication Flow](architecture/authentication-flow.md) covers register, login, refresh, logout, JWT verification, and RBAC.
- [Pagination Strategy](architecture/pagination-strategy.md) explains the cursor contract and index requirements.
- [Response Envelope](architecture/response-envelope.md) explains stable success and error shapes.
- [Repository Pattern](architecture/repository-pattern.md) explains why Prisma query ownership sits in repositories for complex modules.
- [Dashboard Architecture](architecture/dashboard-architecture.md) and [Reports Architecture](architecture/reports-architecture.md) explain read-model aggregation design.
- [Database Documentation](database/prisma-schema-explained.md) explains schema, indexes, migrations, and transaction boundaries.
- [Deployment Documentation](deployment/production-checklist.md) documents environment variables, local Postgres, production readiness, and scaling.
- [Development Documentation](development/local-development.md) documents local setup, tests, seeds, conventions, and Cursor rules.

## Diagrams

Mermaid diagrams live in `docs/diagrams`:

- [Request flow](diagrams/request-flow.mmd)
- [Auth flow](diagrams/auth-flow.mmd)
- [Database relations](diagrams/db-relations.mmd)
- [Transaction flow](diagrams/transaction-flow.mmd)
- [Dashboard flow](diagrams/dashboard-flow.mmd)
- [Reports flow](diagrams/reports-flow.mmd)
- [Pagination flow](diagrams/pagination-flow.mmd)
- [Architecture layering](diagrams/architecture-layering.mmd)
- [Module dependency](diagrams/module-dependency.mmd)
- [Repository pattern](diagrams/repository-pattern.mmd)
- [Response lifecycle](diagrams/response-lifecycle.mmd)
- [DFD level 1](diagrams/dfd-level-1.mmd)

## Core Runtime Contract

All application routes are mounted under `/api/v1`. Successful responses use the global envelope:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "meta": {}
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed"
  }
}
```

Cursor-paginated endpoints place pagination state in `meta`:

```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [],
  "meta": {
    "limit": 20,
    "nextCursor": null,
    "hasNext": false
  }
}
```

## Current API Surface

- Auth: register, login, refresh, logout, current user, admin-only RBAC probe.
- Categories: authenticated category CRUD with default categories, name normalization, duplicate prevention, deletion protection, user scoping, and cursor pagination.
- Transactions: authenticated transaction CRUD with category ownership/type validation, transaction-safe writes, user scoping, filtering, and cursor pagination.
- Dashboard: authenticated read-model endpoints for overview, category charts, trends, cash flow, top categories, and recent transactions.
- Reports: authenticated read-model endpoints for financial summary, report transaction tables, trends, category breakdown, monthly reports, cash flow, top categories, and export preview.
- Health: database connectivity smoke check at `/api/v1/health`.

## Important Non-Goals

The documentation does not claim features that are not implemented. There is currently no committed backend Dockerfile or Docker Compose file in `expenso-backend`; deployment docs therefore describe supported local Postgres commands and production expectations rather than pretending those files exist. There is no stored balance table; balances are computed from transactions by dashboard and report read models.
