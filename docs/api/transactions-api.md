# Transactions API

Base path: `/api/v1/transactions`

Auth: all routes require a bearer access token.

## POST /

Creates a user-scoped transaction after validating category ownership and type.

Request:

```json
{
  "title": "Lunch",
  "amount": 25,
  "type": "EXPENSE",
  "note": "Team lunch",
  "categoryId": "category-uuid"
}
```

Validation:

- `title`: string, minimum length 2.
- `amount`: number, minimum 0.01.
- `type`: `INCOME` or `EXPENSE`.
- `note`: optional string.
- `categoryId`: UUID.

Response message: `Transaction created successfully`.

Errors:

- `TRANSACTION_CATEGORY_INVALID` with HTTP 400 when the category does not belong to the user or its type does not match the transaction type.
- `VALIDATION_ERROR` with HTTP 400.

## GET /

Lists the current user's transactions with cursor pagination and filters.

Query parameters:

- `limit`: integer 1-100, defaults to 20.
- `cursor`: transaction id from previous `nextCursor`.
- `sortBy`: `createdAt`.
- `sortOrder`: `asc` or `desc`, defaults to `desc`.
- `type`: optional `INCOME` or `EXPENSE`.
- `categoryId`: optional UUID.
- `from`: optional ISO date string.
- `to`: optional ISO date string.

Example:

```text
GET /api/v1/transactions?limit=20&type=EXPENSE&categoryId=category-uuid&from=2026-05-01&to=2026-05-31
```

Response:

```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [
    {
      "id": "transaction-id",
      "title": "Lunch",
      "amount": 25,
      "type": "EXPENSE",
      "note": "Team lunch",
      "userId": "user-id",
      "categoryId": "category-id",
      "createdAt": "2026-05-23T00:00:00.000Z",
      "updatedAt": "2026-05-23T00:00:00.000Z"
    }
  ],
  "meta": {
    "limit": 20,
    "nextCursor": null,
    "hasNext": false
  }
}
```

## GET /:id

Returns one transaction owned by the current user.

Response message: `Transaction retrieved successfully`.

Errors:

- `TRANSACTION_NOT_FOUND` with HTTP 404 when missing or owned by another user.

## PATCH /:id

Updates a transaction. If `type` or `categoryId` changes, the next category/type pair is validated inside the same transaction as the update.

Request:

```json
{
  "amount": 50,
  "note": "Updated"
}
```

Validation:

- `title`: optional string, minimum length 2.
- `amount`: optional number, minimum 0.01.
- `type`: optional `INCOME` or `EXPENSE`.
- `note`: optional string.
- `categoryId`: optional UUID.

Response message: `Transaction updated successfully`.

Errors:

- `TRANSACTION_NOT_FOUND` with HTTP 404.
- `TRANSACTION_CATEGORY_INVALID` with HTTP 400.

## DELETE /:id

Deletes one transaction owned by the current user.

Response message: `Transaction deleted successfully`.

Errors:

- `TRANSACTION_NOT_FOUND` with HTTP 404.

## Route Reasoning

Transactions are the financial source of truth, so writes validate category ownership/type and run in transaction boundaries. List filters mirror index-backed query paths and avoid accepting client-supplied `userId`.
