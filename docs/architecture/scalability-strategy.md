# Scalability Strategy

Expenso is designed as a modular monolith first. That is the correct current scaling posture because the core consistency model is simple, the module boundaries are clear, and the product does not yet need distributed ownership.

## Current Scalability Foundations

- Stateless HTTP API with JWT access tokens.
- PostgreSQL as the durable system of record.
- Prisma repositories with selected fields and index-aligned filters.
- Cursor pagination instead of offset pagination.
- Database-level aggregation for dashboard and reports.
- User-scoped query predicates on every protected financial access path.
- Stable `/api/v1` contracts that allow clients to upgrade predictably.

## Database Scaling

The first scaling path is query governance, not service extraction:

1. Validate endpoint filters and sort fields.
2. Confirm repository query shape.
3. Confirm or add supporting indexes.
4. Measure query plans and latency.
5. Add caching/materialization only where data proves it is needed.

Current indexes support common user/date/type/category/report paths. Future high-volume reporting may need materialized views, partitioning by date, or compound cursor indexes for non-time sorts.

## Application Scaling

The API can scale horizontally because request state is not stored in process memory. Refresh-token validity is stored in the database, so multiple API instances can verify refresh state consistently.

If background work is introduced, use a queue rather than doing long-running tasks in request handlers. Export generation is the clearest future candidate.

## Reporting Scaling

Dashboard and reports currently compute from transaction data with DB aggregation. That is correct for early production because it preserves truth and avoids stale summary tables. If report latency grows, introduce materialized views or cached aggregate tables with explicit invalidation and documentation.

## Module Evolution

Microservices should be considered only after there is evidence of independent scaling, data ownership, deployment cadence, or team ownership pressure. Until then, keep module boundaries strict inside the monolith.

## Risk Areas To Watch

- Raw trend queries over very large transaction tables.
- Report transaction sorting by non-time fields at high cardinality.
- Search using `contains` on title/note without full-text indexing.
- Refresh-token storage in the `User` row, which allows one active refresh token per user.
- Hard deletes for financial records if audit requirements appear.
