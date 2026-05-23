# Auth API

Base path: `/api/v1/auth`

## Common Response Shape

Success responses are wrapped in `{ success, message, data, meta }`. Auth errors use `{ success: false, error: { code, message } }`.

## POST /register

Creates a user, default categories, token pair, and stored refresh-token digest in one transaction.

Auth: public.

Request:

```json
{
  "name": "Test User",
  "email": "user@example.com",
  "password": "password123"
}
```

Validation:

- `name`: string, minimum length 2.
- `email`: valid email.
- `password`: string, minimum length 8.

Response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user-id",
      "name": "Test User",
      "email": "user@example.com",
      "role": "USER",
      "createdAt": "2026-05-23T00:00:00.000Z",
      "updatedAt": "2026-05-23T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt",
      "refreshToken": "jwt"
    }
  },
  "meta": {}
}
```

Errors:

- `EMAIL_ALREADY_EXISTS` with HTTP 409.
- `VALIDATION_ERROR` with HTTP 400.

## POST /login

Authenticates a user with email/password and returns a token pair.

Auth: public.

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Validation:

- `email`: valid email.
- `password`: string, minimum length 8.

Response message: `User logged in successfully`.

Errors:

- `INVALID_CREDENTIALS` with HTTP 401.
- `VALIDATION_ERROR` with HTTP 400.

## POST /refresh

Verifies a refresh token, checks it against the stored digest, rotates the stored token, and returns a new token pair.

Auth: public refresh-token payload.

Request:

```json
{
  "refreshToken": "jwt"
}
```

Validation:

- `refreshToken`: valid JWT string.

Response message: `Token refreshed successfully`.

Errors:

- `UNAUTHORIZED_ACCESS` with HTTP 401 when the token is invalid, expired, missing from storage, or no longer matches the stored digest.

## POST /logout

Invalidates the current user's stored refresh token.

Auth: bearer access token required.

Response:

```json
{
  "success": true,
  "message": "User logged out successfully",
  "data": {
    "loggedOut": true
  },
  "meta": {}
}
```

## GET /me

Returns the current public user.

Auth: bearer access token required.

Response message: `Current user retrieved successfully`.

Sensitive fields such as `password` and `refreshToken` are not selected.

## GET /admin-only

Verifies admin RBAC.

Auth: bearer access token with `ADMIN` role required.

Response:

```json
{
  "success": true,
  "message": "Admin access granted",
  "data": {
    "allowed": true
  },
  "meta": {}
}
```

Errors:

- `UNAUTHORIZED_ACCESS` with HTTP 401 when no valid access token is provided.
- `FORBIDDEN_ACCESS` with HTTP 403 for non-admin users.
