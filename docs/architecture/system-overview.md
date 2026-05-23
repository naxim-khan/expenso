# System Overview

Expenso Backend is a NestJS 11 API for multi-user expense management. It exposes versioned REST endpoints under `/api/v1`, persists data in PostgreSQL through Prisma 7, and keeps all financial records scoped to the authenticated user.

The current production boundary is a modular monolith. That choice keeps cross-module behavior explicit and testable while avoiding premature distributed-system complexity. Auth, categories, transactions, dashboard, and reports are separated into Nest modules with clear ownership, but they run in one process and one database transaction boundary.

## Runtime Shape

- `main.ts` creates the Nest app and calls `configureApp`.
- `configureApp` sets the `/api/v1` prefix, Helmet, CORS, global DTO validation, global exception handling, and the global response envelope interceptor.
- `AppModule` imports `ConfigModule`, `PrismaModule`, and the feature modules.
- `PrismaService` owns the Prisma 7 PostgreSQL adapter lifecycle and fails startup if `DATABASE_URL` is missing.

## Module Map

- `auth` owns registration, login, refresh-token rotation, logout, current-user lookup, JWT strategy, password hashing, and RBAC guards.
- `categories` owns user-scoped financial categories, default category templates, name normalization, duplicate prevention, and category pagination.
- `transactions` owns financial transaction CRUD, category ownership/type validation, transaction-safe writes, and transaction pagination.
- `dashboard` is a read-model module for UI dashboard aggregates and charts.
- `reports` is a read-model module for report tables, summaries, trends, cash flow, category breakdowns, and export previews.
- `prisma` exposes one global Prisma client.
- `common` contains reusable response, exception, pagination, decorator, and security constants.

## Architectural Reasoning

The backend favors explicit module boundaries over framework magic. Controllers do HTTP work only. Services coordinate flows and enforce domain decisions. Repositories own Prisma query shape when filtering, pagination, aggregation, joins, or transaction-scoped data access becomes material. DTOs validate request shape but do not contain business logic.

This structure improves production maintainability because API contracts, orchestration rules, query performance, and database schema concerns can evolve independently. Dashboard and reports are deliberately read-model layers because their job is to answer aggregate questions efficiently, not to reuse transactional write services.

## Data Ownership

The database stores users, categories, and transactions. It does not store account balances. Balance, savings rate, averages, highest values, percentages, and cash-flow totals are computed from transaction records by repository aggregation and mapper logic. This avoids reconciliation drift between stored balances and transaction history.

## Key Contracts

- Every protected query includes authenticated `userId`.
- Every successful API response is wrapped in `{ success, message, data, meta }`.
- Every error response is wrapped in `{ success: false, error: { code, message } }`.
- Cursor pagination uses `limit`, optional `cursor`, deterministic ordering, and `meta.nextCursor`.
- `/api/v1` response contracts are treated as stable; breaking shape changes require a future API version.
