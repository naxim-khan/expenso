# Authorization And RBAC

Authorization has two layers:

- Authentication with `JwtAuthGuard` proves the caller has a valid access token.
- Role authorization with `RolesGuard` checks route-level role requirements when a controller method uses `@Roles`.

## Current RBAC Surface

The current schema defines `Role.USER` and `Role.ADMIN`. New users default to `USER`. The admin seed script can create or update an admin account when `SEED_ADMIN` is not disabled.

The only current role-restricted endpoint is:

```text
GET /api/v1/auth/admin-only
```

It is a small RBAC verification endpoint, not an admin product module.

## User-Scoped Authorization

Most authorization is data ownership rather than role checks. Categories, transactions, dashboard, and reports all scope queries by the authenticated `userId`.

This design prevents cross-user leakage by construction:

- Category reads use `where: { id, userId }`.
- Transaction reads use `where: { id, userId }`.
- Transaction writes validate category ownership before writing.
- Dashboard/report aggregations include `userId` in all queries and raw SQL.

## Why Client User IDs Are Not Accepted

API clients cannot choose which user to query. Accepting `userId` in filters would make every endpoint depend on repeated authorization checks and would increase the blast radius of a missed guard. The authenticated JWT payload is the source of user identity.

## Future Authorization Strategy

If more admin APIs are introduced, define explicit role requirements per route and keep user-scoped data access in repositories. Avoid broad "admin bypass" behavior inside repositories unless a separate admin read model is designed and documented.
