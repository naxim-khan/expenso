# Authentication Flow

Authentication is implemented in `src/modules/auth`. It uses bcrypt for passwords, JWT access tokens for route authorization, refresh JWTs for session continuation, and SHA-256 digests for stored refresh tokens.

See [auth-flow.mmd](../diagrams/auth-flow.mmd).

## Registration

`POST /api/v1/auth/register` validates `name`, `email`, and `password`. `AuthService` checks email uniqueness, hashes the password with bcrypt, then delegates to `AuthRegistrationService`.

Registration runs inside one Prisma transaction:

```text
create user -> create default categories -> generate token pair -> store refresh token digest -> commit
```

This transaction boundary matters because a user without default categories would be partially onboarded and difficult to repair safely. If user creation, category bootstrap, token creation, or required refresh-token persistence fails, the whole registration rolls back.

## Login

`POST /api/v1/auth/login` finds the user by email with password selected, verifies the password with bcrypt, maps the user to a public shape, and generates access/refresh tokens. Refresh-token persistence is rotated in a caught background write so the latency-critical login path does not wait on non-critical persistence work.

The stored refresh token is a SHA-256 digest. Random JWT refresh tokens do not require slow password hashing; SHA-256 with timing-safe comparison avoids storing bearer tokens in plaintext while keeping refresh checks fast.

## Refresh

`POST /api/v1/auth/refresh` verifies the refresh JWT with `JWT_REFRESH_SECRET`, checks the stored digest with `RefreshTokenService`, loads the public user, returns a new token pair, and rotates the stored refresh-token digest.

The implementation still accepts refresh tokens in the request body. A production browser transport upgrade should move refresh tokens to HTTP-only, secure cookies without changing the logical rotation model.

## JWT Verification

Protected routes use `JwtAuthGuard`. The `JwtStrategy` extracts bearer tokens from the `Authorization` header, verifies them with `JWT_ACCESS_SECRET`, rejects expired tokens, and attaches `{ userId, email, role }` to request context.

## Logout

`POST /api/v1/auth/logout` requires a valid access token and nulls the stored refresh token for the current user. This invalidates future refresh attempts even if an old refresh token still has unexpired JWT claims.

## RBAC

`GET /api/v1/auth/admin-only` demonstrates role-based access. `@Roles(Role.ADMIN)` stores required metadata and `RolesGuard` permits `ADMIN` users. Non-admin authenticated users receive `FORBIDDEN_ACCESS`.

## Security Reasoning

- Password hashes use bcrypt with 12 salt rounds.
- Access and refresh token secrets are separate environment variables.
- JWT payloads contain `userId`, `email`, and `role`, not passwords or refresh token values.
- Protected module queries use authenticated `userId` instead of accepting user IDs from clients.
- Refresh-token persistence supports rotation and logout invalidation.
