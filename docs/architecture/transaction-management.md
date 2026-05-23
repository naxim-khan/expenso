# Transaction Management

Financial systems need explicit transaction boundaries for multi-step writes.
Expenso uses Prisma `$transaction()` where correctness depends on multiple
database operations committing or rolling back together.

See [transaction-flow.mmd](../diagrams/transaction-flow.mmd).

## Current Transaction Boundaries

Registration:

```text
create user -> create default categories -> generate tokens -> store refresh token -> commit
```

Transaction create:

```text
validate category ownership/type -> create transaction -> commit
```

Transaction update:

```text
load existing transaction -> derive next category/type -> validate category -> update transaction -> commit
```

Transaction delete:

```text
load existing transaction -> delete transaction -> commit
```

## Why These Boundaries Exist

Registration should never leave a user without default categories. Transaction writes should never create or update a transaction against another user's category or against a category with the wrong financial type.

Bundling validation and write into one transaction protects against races where a category could change or disappear between validation and persistence.

## What Is Not Wrapped

Read-only dashboard and report endpoints are not wrapped in transactions. They are aggregate read models and can tolerate normal committed-read behavior. Wrapping them would add overhead without improving correctness.

Single independent reads are also not wrapped unless they participate in a larger invariant.

## Repository Transaction Clients

Repositories accept narrowed Prisma clients for write flows. This lets services own the transaction boundary while repositories still own query shape.

## Future Financial Safety

If transfer-like operations, budgets, ledger entries, or audit records are added,
define one transaction boundary around all required writes before implementation.
Avoid service-to-service write chains that each open independent transactions.
