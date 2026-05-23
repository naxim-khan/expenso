# Performance Strategy

Performance work in Expenso starts at query shape and index alignment.

## Avoiding N+1

Repositories use explicit `select` clauses and bounded relation loading. Recent transaction endpoints select the category fields they need in one query. Category total endpoints group transactions first, then fetch all needed category names in one user-scoped query instead of loading one category per row.

## Select Usage

Auth user queries avoid returning password unless login needs it. Public user lookups select only public fields. Category and transaction repositories define reusable selected shapes for API responses.

This protects latency and reduces accidental exposure of sensitive fields.

## Aggregation Strategy

Dashboard and report totals use database aggregate functions and `groupBy`. Period trends use PostgreSQL `date_trunc` through Prisma tagged raw SQL. This keeps heavy aggregation in PostgreSQL instead of moving full transaction histories into Node.js memory.

## Cursor Pagination

Cursor pagination fetches `limit + 1` rows and avoids large offsets. This makes list endpoints viable as transaction history grows.

## Index Strategy

Indexes are designed around actual access paths:

- `userId + createdAt` for user-scoped chronological lists.
- `userId + type` for income/expense filters.
- `userId + categoryId` for category filters.
- `userId + createdAt + type` for dashboard/report date/type combinations.
- `userId + categoryId + createdAt` for category reports over time.
- `userId + amount` and `userId + title` for report table sorting.

## Avoiding In-Memory Reporting

Reports should not fetch all transactions and reduce them in JavaScript. Mappers may compute percentages or running balances after the repository has already reduced raw rows to aggregate periods/categories.

## Performance Review Checklist

- Does every query include `userId`?
- Does the endpoint expose a filter or sort field without an index?
- Does a paginated query use shared cursor helpers?
- Does the repository select only needed fields?
- Does chart/report logic use DB aggregation?
- Does raw SQL use Prisma parameterization?
- Does the query avoid per-row lookups?
