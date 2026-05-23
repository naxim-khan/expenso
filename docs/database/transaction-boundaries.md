# Database Transaction Boundaries

Database transactions are used when multiple steps must succeed or fail as one unit.

## Registration Boundary

`AuthRegistrationService.registerWithDefaults` opens a Prisma transaction that creates the user, creates default categories, generates tokens, and stores the refresh-token digest.

This prevents partially onboarded users.

## Transaction Write Boundary

`TransactionsService` wraps create, update, and delete operations.

Create validates category ownership/type and then inserts the transaction in the same transaction.

Update loads the existing transaction, derives the next category/type, validates the category, and updates in the same transaction.

Delete loads by user ownership and deletes in the same transaction.

## Why Financial Operations Need Transactions

Financial writes often require validating current state before writing. If validation and write are split across independent queries without a transaction, a concurrent change can invalidate the assumption between steps.

Even though this project does not store balances, transaction safety still matters for ownership, category/type consistency, and onboarding completeness.

## Read Models

Dashboard and reports do not wrap read aggregation in transactions. They execute committed reads and compute from durable transaction rows. This keeps read latency lower and avoids unnecessary database transaction overhead.

## Future Rules

New financial writes must document:

- Which records are read.
- Which records are written.
- Which invariants must hold.
- Whether the invariant requires a single Prisma transaction.
- What should happen on rollback.
