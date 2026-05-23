# Categories API

Base path: `/api/v1/categories`

Auth: all routes require a bearer access token.

## POST /

Creates a user-scoped category.

Request:

```json
{
  "name": "Groceries",
  "type": "EXPENSE"
}
```

Validation:

- `name`: string, minimum length 2.
- `type`: `INCOME` or `EXPENSE`.

Response message: `Category created successfully`.

Example response:

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "category-id",
    "name": "Groceries",
    "type": "EXPENSE",
    "isSystem": false,
    "version": 1,
    "userId": "user-id",
    "createdAt": "2026-05-23T00:00:00.000Z",
    "updatedAt": "2026-05-23T00:00:00.000Z"
  },
  "meta": {}
}
```

Errors:

- `CATEGORY_ALREADY_EXISTS` with HTTP 409 when the normalized name already exists for the user.
- `VALIDATION_ERROR` with HTTP 400.

## GET /

Lists the current user's categories with cursor pagination.

Query parameters:

- `limit`: integer 1-100, defaults to 20.
- `cursor`: category id from a previous `nextCursor`.
- `sortBy`: `createdAt` or `name`, defaults to `createdAt`.
- `sortOrder`: `asc` or `desc`, defaults to `desc`.
- `type`: optional `INCOME` or `EXPENSE`.

Example:

```text
GET /api/v1/categories?limit=20&type=EXPENSE&sortBy=name&sortOrder=asc
```

Response message: `Categories retrieved successfully`.

Pagination response:

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "category-id",
      "name": "Food",
      "type": "EXPENSE",
      "isSystem": true,
      "version": 1,
      "userId": "user-id",
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

Returns one category owned by the current user.

Response message: `Category retrieved successfully`.

Errors:

- `CATEGORY_NOT_FOUND` with HTTP 404 when the category does not exist or belongs to another user.

## PATCH /:id

Updates category name and/or type.

Request:

```json
{
  "name": "Dining",
  "type": "EXPENSE"
}
```

Validation:

- `name`: optional string, minimum length 2.
- `type`: optional `INCOME` or `EXPENSE`.

Response message: `Category updated successfully`.

Errors:

- `CATEGORY_NOT_FOUND` with HTTP 404.
- `CATEGORY_ALREADY_EXISTS` with HTTP 409.
- `VALIDATION_ERROR` with HTTP 400.

## DELETE /:id

Deletes a category only when it has no transactions.

Response message: `Category deleted successfully`.

Errors:

- `CATEGORY_NOT_FOUND` with HTTP 404.
- `CATEGORY_IN_USE` with HTTP 409 when transactions reference the category.

## Route Reasoning

The route is resource-oriented because categories are user-owned CRUD records. No `userId` appears in routes or filters because ownership is derived from the bearer token.
