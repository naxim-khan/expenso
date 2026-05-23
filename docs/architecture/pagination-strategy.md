# Pagination Strategy

Expenso uses cursor pagination for list APIs. Offset pagination is intentionally avoided.

See [pagination-flow.mmd](../diagrams/pagination-flow.mmd).

## Current Contract

Paginated requests use:

```text
limit=20&cursor=<last-seen-id>
```

Paginated responses use the standard response envelope and place pagination state in `meta`:

```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [],
  "meta": {
    "limit": 20,
    "nextCursor": "transaction-id",
    "hasNext": true
  }
}
```

`limit` defaults to 20 and is capped at 100 by `normalizeLimit`.

## Implementation

`buildPrismaCursorQuery` returns:

- `take: normalizedLimit + 1`
- optional `cursor: { id: cursor }`
- `skip: 1` when a cursor is provided
- deterministic `orderBy` with the requested sort field plus `id` as the tiebreaker

`buildCursorPagination` trims the extra row and returns `nextCursor` from the last returned item when another page exists.

## Why Cursor Pagination

Cursor pagination scales better than offset pagination for growing financial histories. Offset pagination gets slower as offsets grow because the database still has to walk skipped rows. Cursor pagination lets PostgreSQL continue from an indexed position and avoids duplicate/skipped rows when new records are inserted between page requests.

## Deterministic Ordering

Every cursor endpoint must use stable ordering. The helper appends `id` as a tiebreaker so rows with equal `createdAt`, `amount`, `title`, or `name` do not create ambiguous page boundaries.

Current sort fields:

- Categories: `createdAt`, `name`.
- Transactions: `createdAt`.
- Reports transaction table: `createdAt`, `amount`, `title`.
- Dashboard recent transactions: `createdAt`.

## Index Alignment

Pagination fields must match database indexes:

- `(userId, createdAt)` supports user-scoped lists and recent activity.
- `(userId, type)` supports type filters.
- `(userId, categoryId)` and `(userId, categoryId, createdAt)` support category-filtered lists and reports.
- `(userId, amount)` supports report transaction sorting/filtering by amount.
- `(userId, title)` supports report transaction sorting by title.

## Tradeoff

The current cursor is an entity `id` while sorting can be by fields such as `amount` or `title`. This is compatible with Prisma's cursor API and deterministic `orderBy`, but future high-volume reporting may benefit from compound cursors that encode sort value plus `id` for stronger index continuation on non-time sorts.
