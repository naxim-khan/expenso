# Auth Module

The auth module owns identity, session token lifecycle, and role checks. It is implemented in `src/modules/auth`.

## Responsibilities

- Register users.
- Bootstrap default categories during registration.
- Login with bcrypt password verification.
- Generate access and refresh JWTs.
- Store refresh-token digests and rotate them.
- Invalidate refresh tokens on logout.
- Return current public user data.
- Enforce JWT authentication and admin-only RBAC.

## Internal Components

- `AuthController` exposes HTTP routes.
- `AuthService` orchestrates auth use cases.
- `AuthRegistrationService` owns transaction-safe onboarding.
- `AuthUserService` owns user lookups/creation.
- `PasswordService` owns bcrypt hashing and comparison.
- `TokenService` owns JWT generation and refresh verification.
- `RefreshTokenService` owns SHA-256 refresh-token digest storage, validation, rotation, and invalidation.
- `AuthMapper` maps users to public response shape.
- `JwtStrategy`, `JwtAuthGuard`, `RolesGuard`, and `@Roles` own request authentication and RBAC.

## Registration Reasoning

Registration creates a user and default categories in one database transaction. The default category templates are backend-owned and copied into the user's account with `isSystem: true` and `version: 1`. This gives every new user a usable financial taxonomy without sharing mutable category rows across users.

## Refresh Token Reasoning

Only a digest of the active refresh token is stored. This limits damage if the database is leaked and supports rotation/logout invalidation. The current model stores one active refresh token per user.

## Security Notes

Public user responses do not include `password` or `refreshToken`. Access tokens are signed with `JWT_ACCESS_SECRET`; refresh tokens are signed with `JWT_REFRESH_SECRET`. Production clients should prefer HTTP-only secure cookies for refresh-token transport.
