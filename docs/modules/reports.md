# Reports Module

The reports module provides authenticated production reporting read models.

## Responsibilities

- Financial summary reports.
- Filtered, sorted, cursor-paginated transaction report tables.
- Spending trends.
- Category breakdowns.
- Monthly financial reports.
- Cash-flow reports.
- Top categories.
- Export preview metadata.

## Architecture

`ReportsController` exposes report routes. `ReportsService` normalizes filters, validates date and amount invariants, and delegates to `ReportsRepository` and `ReportsMapper`. `ReportsRepository` owns all Prisma report query shapes. `ReportsMapper` converts aggregate rows into stable report responses.

## Reporting Reasoning

Reports are separated from transaction CRUD because reporting has different scaling, query, and contract concerns. Reports need sorting, filters, aggregation, export metadata, and chart-ready structures. They should not reuse transactional services that are optimized for writes.

## Query Strategy

Summary reports use Prisma `groupBy` over `type`. Period reports use PostgreSQL `date_trunc` through Prisma tagged raw SQL. Category reports group by `categoryId` and fetch category names in one bounded lookup. Transaction tables use shared cursor pagination and selected relation fields.

## Validation And Guardrails

`startDate` and `endDate` override `month` and `year`. `startDate` must not be later than `endDate`. Transaction report `minAmount` must not exceed `maxAmount`. Search is trimmed and capped by DTO validation.

## Export Preview

The current export endpoint returns metadata and summary data only. It does not generate a file. File generation should be designed separately with queueing/storage if needed.
