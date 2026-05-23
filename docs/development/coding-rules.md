# Coding Rules

## Controller Rules

- Controllers handle HTTP only.
- Controllers should not call Prisma.
- Controllers should not build response envelopes.
- Controllers pass `request.user.userId` to services for protected user-owned resources.

## Service Rules

- Services orchestrate use cases.
- Services own transaction boundaries where workflow correctness requires atomicity.
- Services throw `AppException` for domain errors.
- Services should not own complex Prisma query shapes.

## Repository Rules

- Repositories own Prisma query details when filters, joins, pagination, aggregation, or transaction clients are involved.
- Every user-owned query must include `userId`.
- Use explicit `select` fields.
- Use shared cursor helpers for pagination.
- Use parameterized Prisma raw SQL only when Prisma query APIs do not express the needed database operation.

## DTO Rules

- DTOs are required for REST inputs.
- DTOs validate shape and basic field constraints only.
- DTOs do not contain business logic or database lookups.
- Zod is optional for shared/runtime/external payload validation; it does not replace DTOs.

## Financial Rules

- Do not store balances in the database.
- Compute balances from transactions.
- Validate category ownership and type before transaction writes.
- Use Prisma transactions for multi-step financial writes.
- Do not delete categories with transactions.

## API Rules

- Preserve `/api/v1`.
- Preserve success and error envelopes.
- Preserve pagination `meta`.
- Add tests and docs for new endpoints.
