# Repository Pattern

Repositories are used where database query shape is significant enough to deserve its own owner. They are not generic CRUD wrappers; they exist to isolate Prisma query details from orchestration logic.

See [repository-pattern.mmd](../diagrams/repository-pattern.mmd).

## Current Repositories

- `CategoriesRepository` owns category selects, default category creation, duplicate-name lookup, category lists, user-scoped reads/updates/deletes, and transaction-count checks.
- `TransactionsRepository` owns transaction selects, category ownership/type lookups, transaction lists, and transaction writes inside caller-provided transaction clients.
- `DashboardRepository` owns aggregates, category totals, trend raw SQL, recent transaction selects, and dashboard query filtering.
- `ReportsRepository` owns report aggregates, report transaction table queries, date-bucket raw SQL, category totals, count queries, and report filters.

## Why Prisma Queries Live There

Prisma queries are part of the production contract. They determine selected fields, index usage, user scoping, joins, aggregation strategy, and pagination behavior. Putting that logic in repositories makes it reviewable beside database indexes and keeps services focused on use-case flow.

## Service Responsibilities

Services should:

- Convert DTOs into query objects.
- Enforce domain invariants that require coordination.
- Open transaction scopes where multiple operations must commit together.
- Call repositories and mappers.
- Throw `AppException` for domain failures.

Services should not:

- Build complex Prisma `where` objects inline.
- Own repeated select lists.
- Perform chart/report aggregation loops over large datasets.
- Hand-build response envelopes.

## Repository Responsibilities

Repositories should:

- Scope queries by `userId`.
- Select only required fields.
- Use shared cursor helpers for paginated queries.
- Keep aggregation at the database level.
- Use parameterized Prisma raw SQL only when required, such as date bucketing.
- Accept transaction clients for write flows that need atomicity.

## Tradeoff

Repository abstractions can become unnecessary indirection for simple one-off queries. Expenso uses repositories where filters, pagination, aggregation, joins, or transaction clients already justify them. Future modules should not create repositories blindly, but once a module uses a repository for an entity, Prisma access for that entity should remain consistent there.
