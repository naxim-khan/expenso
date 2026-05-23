# Dashboard Module

The dashboard module provides authenticated UI read models for financial overview and chart widgets.

## Responsibilities

- Financial overview totals and derived values.
- Expense-by-category chart data.
- Income-vs-expense trends.
- Cash-flow running balance.
- Top categories.
- Recent transactions with category data and cursor pagination.

## Architecture

`DashboardController` handles routes and query DTOs. `DashboardService` builds query objects, coordinates repository calls, and delegates output shaping. `DashboardRepository` owns aggregate and date-bucket queries. `DashboardMapper` computes response-level derived fields from aggregated rows.

## Why It Does Not Use Transaction Services

Dashboard endpoints answer aggregate read questions. Calling transactional CRUD services would mix read-model concerns with write workflow concerns and make dashboard performance harder to reason about. The repository queries PostgreSQL directly through Prisma with user-scoped filters.

## Query Strategy

Totals use Prisma aggregate calls. Category charts use transaction `groupBy` and a single category-name lookup. Period trends and cash flow use parameterized `date_trunc` raw SQL. Recent transactions use cursor pagination and selected category fields.

## Filters

Filters include `startDate`, `endDate`, `month`, `year`, `type`, and `categoryId`. Trend endpoints also support `groupBy=day|week|month`. Explicit date ranges take precedence over month/year filters.
