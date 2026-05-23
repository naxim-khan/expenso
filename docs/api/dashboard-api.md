# Dashboard API

Base path: `/api/v1/dashboard`

Auth: all routes require a bearer access token.

## Shared Filters

Most dashboard endpoints accept:

- `startDate`: ISO date string.
- `endDate`: ISO date string.
- `month`: integer 1-12.
- `year`: integer 1970-9999.
- `type`: `INCOME` or `EXPENSE`.
- `categoryId`: UUID.

`startDate` and `endDate` take priority over `month` and `year`.

## GET /overview

Returns totals and high-level derived financial values.

Example:

```text
GET /api/v1/dashboard/overview?startDate=2026-05-01&endDate=2026-05-31
```

Response:

```json
{
  "success": true,
  "message": "Dashboard overview retrieved successfully",
  "data": {
    "totalIncome": 1000,
    "totalExpense": 150,
    "netBalance": 850,
    "savingsRate": 85,
    "transactionCount": 3,
    "averageExpense": 75,
    "highestExpenseCategory": {
      "categoryId": "category-id",
      "categoryName": "Food",
      "total": 150
    },
    "highestIncomeCategory": {
      "categoryId": "category-id",
      "categoryName": "Salary",
      "total": 1000
    }
  },
  "meta": {}
}
```

## GET /expense-by-category

Returns expense category totals and percentages.

Response message: `Expense by category retrieved successfully`.

Data item shape:

```json
{
  "categoryId": "category-id",
  "categoryName": "Food",
  "total": 150,
  "percentage": 100
}
```

## GET /income-vs-expense

Returns period buckets with income and expense totals.

Additional query:

- `groupBy`: `day`, `week`, or `month`; defaults to `month`.

Example:

```text
GET /api/v1/dashboard/income-vs-expense?groupBy=month&year=2026
```

Data item shape:

```json
{
  "period": "2026-05",
  "income": 1000,
  "expense": 150
}
```

## GET /cash-flow

Returns period buckets with running balance.

Additional query:

- `groupBy`: `day`, `week`, or `month`; defaults to `month`.

Data item shape:

```json
{
  "period": "2026-05",
  "income": 1000,
  "expense": 150,
  "balance": 850
}
```

## GET /top-categories

Returns category totals sorted by amount.

Additional query:

- `limit`: integer 1-20, defaults to 5.
- `type`: `INCOME` or `EXPENSE`, defaults to `EXPENSE`.

Data item shape:

```json
{
  "categoryId": "category-id",
  "categoryName": "Rent",
  "total": 300,
  "transactionCount": 1
}
```

## GET /recent-transactions

Returns recent transactions with category data and cursor pagination.

Additional query:

- `limit`: integer 1-100.
- `cursor`: transaction id.

Response message: `Recent transactions retrieved successfully`.

Data item shape:

```json
{
  "id": "transaction-id",
  "title": "Lunch",
  "amount": 100,
  "type": "EXPENSE",
  "createdAt": "2026-05-06T10:00:00.000Z",
  "category": {
    "id": "category-id",
    "name": "Food",
    "type": "EXPENSE"
  }
}
```

## Route Reasoning

Dashboard routes are named around UI read models rather than raw tables. They expose backend-owned calculations so clients do not duplicate financial logic.
