# Reports API

Base path: `/api/v1/reports`

Auth: all routes require a bearer access token.

## Shared Report Filters

Supported by report filter DTOs:

- `startDate`: ISO date string.
- `endDate`: ISO date string.
- `month`: integer 1-12.
- `year`: integer 1970-9999.
- `type`: `INCOME` or `EXPENSE`.
- `categoryId`: UUID.
- `sortBy`: `createdAt`, `amount`, or `title` where applicable.
- `sortOrder`: `asc` or `desc`.

`startDate` and `endDate` take priority over `month` and `year`.

## GET /summary

Returns financial summary aggregates.

Example:

```text
GET /api/v1/reports/summary?startDate=2026-05-01&endDate=2026-05-31
```

Response data:

```json
{
  "totalIncome": 1000,
  "totalExpense": 150,
  "netBalance": 850,
  "savingsRate": 85,
  "totalTransactions": 3,
  "averageIncome": 1000,
  "averageExpense": 75,
  "highestExpense": 100,
  "highestIncome": 1000
}
```

## GET /transactions

Returns a filtered, sorted, cursor-paginated transaction report table.

Additional query parameters:

- `limit`: integer 1-100.
- `cursor`: transaction id.
- `minAmount`: number, minimum 0.
- `maxAmount`: number, minimum 0.
- `search`: string, max length 100, searches title and note.

Example:

```text
GET /api/v1/reports/transactions?limit=2&type=EXPENSE&sortBy=amount&sortOrder=asc&minAmount=50&maxAmount=100&search=n
```

Response data item:

```json
{
  "id": "transaction-id",
  "title": "Dinner",
  "amount": 50,
  "type": "EXPENSE",
  "note": null,
  "createdAt": "2026-05-07T10:00:00.000Z",
  "category": {
    "id": "category-id",
    "name": "Food",
    "type": "EXPENSE"
  }
}
```

Pagination metadata follows the shared cursor contract.

Errors:

- `VALIDATION_ERROR` when `minAmount` is greater than `maxAmount` or date order is invalid.

## GET /spending-trends

Returns period income, expense, and balance.

Additional query:

- `groupBy`: `day`, `week`, or `month`; defaults to `month`.

Data item:

```json
{
  "period": "2026-05",
  "income": 1000,
  "expense": 150,
  "balance": 850
}
```

## GET /category-breakdown

Returns category totals and percentages.

Additional query:

- `type`: defaults to `EXPENSE`.
- `limit`: integer 1-20.

Data item:

```json
{
  "categoryId": "category-id",
  "categoryName": "Food",
  "total": 150,
  "transactionCount": 2,
  "percentage": 33.33
}
```

## GET /monthly

Returns monthly financial report buckets.

Data item:

```json
{
  "month": "2026-05",
  "income": 1000,
  "expense": 150,
  "balance": 850,
  "savingsRate": 85
}
```

## GET /cash-flow

Returns period totals with running balance.

Additional query:

- `groupBy`: `day`, `week`, or `month`; defaults to `month`.

Data item:

```json
{
  "period": "2026-05",
  "income": 1000,
  "expense": 150,
  "runningBalance": 1050
}
```

## GET /top-categories

Returns top category totals.

Additional query:

- `type`: defaults to `EXPENSE`.
- `limit`: integer 1-20, defaults to 10 in service logic for this endpoint.

Data item:

```json
{
  "categoryId": "category-id",
  "categoryName": "Rent",
  "total": 300,
  "transactionCount": 1
}
```

## GET /export-preview

Returns export metadata and summary. It does not generate a file.

Example:

```text
GET /api/v1/reports/export-preview?year=2026&type=EXPENSE
```

Response data:

```json
{
  "summary": {
    "totalIncome": 0,
    "totalExpense": 450,
    "netBalance": -450,
    "savingsRate": 0,
    "totalTransactions": 3,
    "averageIncome": 0,
    "averageExpense": 150,
    "highestExpense": 300,
    "highestIncome": 0
  },
  "filters": {
    "year": 2026,
    "type": "EXPENSE"
  },
  "generatedAt": "2026-05-23T00:00:00.000Z",
  "transactionCount": 3
}
```

## Route Reasoning

Reports are read-model APIs. Their route names describe report products, while filtering/sorting remains query-based so clients can compose views without new routes for every combination.
