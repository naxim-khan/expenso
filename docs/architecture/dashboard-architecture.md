# Dashboard Architecture

The dashboard module is a read-model layer for UI-facing aggregate views. It is not a transactional workflow and does not call `TransactionsService`.

See [dashboard-flow.mmd](../diagrams/dashboard-flow.mmd).

## Endpoints

- `GET /api/v1/dashboard/overview`
- `GET /api/v1/dashboard/expense-by-category`
- `GET /api/v1/dashboard/income-vs-expense`
- `GET /api/v1/dashboard/cash-flow`
- `GET /api/v1/dashboard/top-categories`
- `GET /api/v1/dashboard/recent-transactions`

All endpoints require JWT authentication.

## Flow

Controller receives filters and authenticated user context. `DashboardService` converts DTOs into query objects, coordinates repository calls, and delegates response shaping to `DashboardMapper`. `DashboardRepository` performs Prisma aggregate, count, groupBy, raw date-bucket, and recent transaction queries.

## Filters

Dashboard filters include:

- `startDate`, `endDate`
- `month`, `year`
- `type`
- `categoryId`
- `groupBy=day|week|month` for trend endpoints
- `limit` for top categories and recent transactions
- `cursor` for recent transactions

Explicit `startDate` and `endDate` take priority over `month` and `year`.

## Why Dashboard Is A Read Model

Dashboard views ask aggregate questions such as totals, savings rate, highest category, grouped periods, and recent activity. Those are query/read concerns, not transaction use cases. Keeping them in a read-model module avoids coupling UI reporting to transactional CRUD services and makes query optimization visible.

## Performance Design

Dashboard totals use database aggregate calls. Category charts use `groupBy` plus a bounded category lookup. Trend and cash-flow endpoints use parameterized raw SQL with PostgreSQL `date_trunc` because date bucketing is a database concern and Prisma `groupBy` does not express it ergonomically.

The module avoids loading all transactions into memory to compute charts. Percentages and running balances are mapper-level calculations over already-aggregated rows.

## Current Tradeoffs

Dashboard category totals perform one grouped transaction query plus one category lookup for grouped IDs. This avoids N+1 category queries while keeping category names user-scoped. At much larger scale, expensive dashboard queries may move to cached summaries or materialized views after performance evidence justifies it.
