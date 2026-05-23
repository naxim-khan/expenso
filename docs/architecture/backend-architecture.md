# Backend Architecture

Expenso uses a layered NestJS modular monolith:

```text
Controller -> Service -> Repository -> Prisma -> PostgreSQL
```

This is not ceremony. Each layer protects a different production concern.

## Controllers

Controllers translate HTTP into application calls. They bind `@Body`, `@Query`, `@Param`, and authenticated request context, attach guards, and provide response messages. They do not perform business decisions, database access, financial calculations, or response wrapping.

Keeping controllers thin makes API behavior easy to inspect and keeps HTTP concerns from leaking into unit-testable application logic.

## DTOs

DTOs validate and transform request shape through the global `ValidationPipe` with `whitelist`, `transform`, and `forbidNonWhitelisted` enabled. They do not contain business logic because request validation and domain decisions change for different reasons.

Examples:

- `RegisterDto` validates email, name length, and password length.
- `CreateTransactionDto` validates title, positive amount, transaction type enum, optional note, and category UUID.
- Dashboard/report DTOs validate date filters, month/year ranges, grouping, sorting, and pagination limits.

## Services

Services orchestrate use cases. They combine DTO data, authenticated `userId`, domain helpers, repository calls, transaction scopes, and mappers.

Examples:

- `AuthService` coordinates email uniqueness, password hashing, registration defaults, login, refresh, logout, and current-user lookup through focused collaborators.
- `TransactionsService` opens a Prisma transaction for create/update/delete flows and validates category ownership/type before writes.
- `ReportsService` converts filter DTOs into query objects, validates range invariants, and delegates aggregation to `ReportsRepository`.

Services should not own complex Prisma query shape once filtering, pagination, joins, or aggregation become meaningful.

## Repositories

Repositories own database query details. This includes `select` lists, `where` construction, user scoping, cursor query helpers, `groupBy`, aggregate calls, and parameterized raw SQL where Prisma does not model the needed operation directly.

The repository layer exists because query shape is a production performance concern. It should be reviewed alongside schema indexes and endpoint filters.

## Prisma

Prisma is the only database access layer. `PrismaService` extends the generated client, configures the Prisma PostgreSQL adapter, and owns connection lifecycle.

Raw SQL exists only for date bucketing in dashboard/reports trend endpoints through Prisma tagged templates. Those queries are parameterized and still scoped by `userId`.

## PostgreSQL

PostgreSQL stores durable user, category, and transaction data. Indexes are aligned with user-scoped filters, sorting, cursor pagination, and reporting/dashboard aggregations.

## Why Modular Monolith First

The current domain has strong consistency needs around user onboarding, category ownership, and financial writes. A single process and database allow transaction boundaries to stay simple and reliable. Future extraction to events, queues, materialized views, or independent services should be driven by measured scale or ownership pressure, not by architecture fashion.

See [architecture layering](../diagrams/architecture-layering.mmd) and [module dependencies](../diagrams/module-dependency.mmd).
