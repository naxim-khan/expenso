# Prisma Schema Explained

The Prisma schema lives in `expenso-backend/prisma/schema.prisma`. The generated Prisma client is emitted to `src/generated/prisma` with CommonJS module format.

## Models

### User

`User` stores identity and auth state:

- `id`: UUID primary key.
- `email`: unique login identifier.
- `name`: display name.
- `password`: bcrypt hash.
- `role`: `USER` or `ADMIN`, default `USER`.
- `refreshToken`: SHA-256 digest of active refresh token or null.
- `categories`, `transactions`: owned records.

### Category

`Category` stores user-owned category definitions:

- `name`: display value.
- `normalizedName`: lowercased trimmed/collapsed value for uniqueness.
- `type`: `INCOME` or `EXPENSE`.
- `isSystem`: true when copied from backend defaults.
- `version`: template version for future default-category evolution.
- `userId`: owner.

`User -> Category` uses cascade delete in the schema.

### Transaction

`Transaction` stores financial events:

- `title`, `amount`, `type`, optional `note`.
- `userId`: owner.
- `categoryId`: category classification.
- timestamps.

`User -> Transaction` cascades on user delete. `Category -> Transaction` is not configured with cascade in the current Prisma schema, and service logic blocks category deletion when transactions exist.

## Enums

- `TransactionType`: `INCOME`, `EXPENSE`.
- `CategoryType`: `INCOME`, `EXPENSE`.
- `Role`: `USER`, `ADMIN`.

Separate category and transaction type enums make the domain explicit even though they currently share values.

## Why Balance Is Not Stored

Balances are derived from transaction history. Storing a balance column would introduce reconciliation risk: every write, update, delete, and backfill would need perfect balance maintenance. Current dashboard/report modules compute balance from transactions, preserving the transaction table as the source of truth.

## Relation Design

User ownership is explicit on both categories and transactions. This lets every query include `userId` and prevents accidental cross-user leakage. Transactions also store `categoryId` so reporting can group by category without expensive inference.

## Schema Evolution

Migrations show the project evolved from baseline auth and core schema into default category metadata, normalized category names, dashboard indexes, and report indexes. Future schema changes should be introduced through Prisma migrations and documented in database docs.
