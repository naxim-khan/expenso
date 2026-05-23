# Reports Architecture

Reports are production read-model endpoints for financial summaries, tabular report data, chart-ready breakdowns, and export-preview metadata.

See [reports-flow.mmd](../diagrams/reports-flow.mmd).

## Endpoints

- `GET /api/v1/reports/summary`
- `GET /api/v1/reports/transactions`
- `GET /api/v1/reports/spending-trends`
- `GET /api/v1/reports/category-breakdown`
- `GET /api/v1/reports/monthly`
- `GET /api/v1/reports/cash-flow`
- `GET /api/v1/reports/top-categories`
- `GET /api/v1/reports/export-preview`

All endpoints require JWT authentication.

## Flow

`ReportsController` binds query DTOs and authenticated user context. `ReportsService` normalizes filters, validates cross-field rules, creates repository query objects, and calls `ReportsMapper`. `ReportsRepository` owns Prisma query shapes for aggregation, transaction table filtering, period totals, category totals, and counts.

## Why Reports Are Separate From Dashboard

Dashboard endpoints optimize for UI summary widgets. Reports expose deeper analytical APIs, including sorted/paginated transaction tables, amount ranges, search, export previews, and multiple report shapes. Keeping them separate avoids one large "analytics" service and lets each module evolve its contract independently.

## Filtering And Sorting

Reports support indexed filters:

- Date filters with `startDate`/`endDate`, or `month`/`year`.
- `type=INCOME|EXPENSE`.
- `categoryId`.
- Transaction report `minAmount`, `maxAmount`, and `search`.
- Transaction report sorting by `createdAt`, `amount`, or `title`.

`startDate` and `endDate` override `month` and `year`. `minAmount` cannot be greater than `maxAmount`.

## Aggregation Strategy

Summary uses Prisma `groupBy` by transaction type with `_sum`, `_avg`, `_max`, and `_count`. Category reports use grouped transaction totals plus one user-scoped category lookup. Period reports use parameterized raw SQL with `date_trunc`.

The backend owns financial calculations such as balances, averages, highest values, savings rate, percentages, and running cash-flow balances. API consumers receive stable computed values rather than rebuilding financial logic on the client.

## Export Preview

`export-preview` returns summary, normalized filters, generation timestamp, and transaction count. It does not generate CSV or PDF files. Actual export generation should be introduced behind an explicit design so it can handle long-running jobs, storage, authorization, and contract stability.
