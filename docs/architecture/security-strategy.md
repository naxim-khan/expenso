# Security Strategy

Security is implemented through framework-level defaults, explicit authentication, stable error handling, strict validation, and user-scoped repository queries.

## HTTP Hardening

`configureApp` enables Helmet and CORS. CORS allows the configured `FRONTEND_URL` and credentials.

## Validation

The global `ValidationPipe` uses:

- `whitelist: true`
- `transform: true`
- `forbidNonWhitelisted: true`

This rejects unexpected client fields, transforms query values into DTO types, and makes DTO classes the primary API validation layer.

## JWT Authentication

Protected routes use bearer access tokens. `JwtStrategy` verifies tokens with `JWT_ACCESS_SECRET`, rejects expired tokens, and exposes only `userId`, `email`, and `role` to request context.

## Refresh Token Rotation

Refresh tokens are JWTs signed with `JWT_REFRESH_SECRET`. The database stores a SHA-256 digest of the active refresh token. Refresh and login rotate the stored token; logout nulls it.

The current transport sends refresh tokens in request bodies. Production browser clients should move this to HTTP-only secure cookies.

## Passwords

Passwords are hashed with bcrypt and 12 salt rounds. Public user responses do not select password or refresh-token fields.

## RBAC

Role checks are explicit through `@Roles` and `RolesGuard`. Admin access is currently demonstrated by `/auth/admin-only`.

## User Isolation

Financial data access is always scoped by authenticated `userId`. This is the primary tenant isolation model:

- Category duplicate checks use `(userId, normalizedName)`.
- Category and transaction reads include `userId`.
- Transaction writes validate category ownership/type before write.
- Dashboard and report aggregations include `userId`, including raw SQL.

## Error Handling

`AppException` and the global exception filter provide stable error codes without leaking raw internal errors. Unknown exceptions are returned as `INTERNAL_SERVER_ERROR`.

## Security Review Checklist

- Does the route require `JwtAuthGuard` when it accesses user data?
- Does the query derive `userId` from JWT context?
- Does the DTO validate every client input?
- Are unknown fields rejected?
- Are sensitive fields excluded from selects?
- Are refresh tokens stored as digests?
- Are raw SQL fragments parameterized through Prisma?
