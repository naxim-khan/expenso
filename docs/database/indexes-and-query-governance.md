# Indexes And Query Governance

Indexes must match real API access paths. Expenso uses user-scoped indexes because almost every protected query begins with authenticated `userId`.

## Current Indexes

Categories:

- `@@unique([userId, normalizedName])`: duplicate-name protection per user.
- `@@index([userId, createdAt])`: category lists and cursor pagination.
- `@@index([userId, type])`: category type filters.

Transactions:

- `@@index([userId, createdAt])`: chronological transaction lists and recent transactions.
- `@@index([userId, type])`: income/expense filters.
- `@@index([userId, categoryId])`: category filters.
- `@@index([userId, createdAt, type])`: date/type dashboard and reports.
- `@@index([userId, categoryId, createdAt])`: category/date reporting.
- `@@index([userId, amount])`: report table amount sorting/filtering.
- `@@index([userId, title])`: report table title sorting.
- `@@index([categoryId])`: relation lookup support.

## Why These Indexes Align

Filters:

- Dashboard/report filters include date, type, and category.
- Transaction list filters include type, category, and date.
- Category list filters include type.

Sorting:

- Category lists sort by `createdAt` or `name`.
- Transaction lists sort by `createdAt`.
- Report transaction tables sort by `createdAt`, `amount`, or `title`.

Pagination:

- Cursor pagination needs deterministic ordering and efficient continuation through indexed user-scoped data.

Aggregation:

- Dashboard and report aggregates filter by `userId`, date ranges, type, and category before grouping.

## Query Governance Workflow

Before adding an API filter, sort, or report:

1. Document the route and query parameters.
2. Write the repository query shape.
3. Confirm every predicate and sort path has an index strategy.
4. Add a Prisma migration when needed.
5. Add tests for filtering, sorting, pagination, and user isolation.
6. Update this document and the relevant API/module docs.

## Search Caveat

Report transaction search currently uses case-insensitive `contains` on `title` and `note`. The `(userId, title)` index helps title ordering but does not fully optimize arbitrary substring search. If search volume grows, add PostgreSQL full-text or trigram indexes behind a documented design.
