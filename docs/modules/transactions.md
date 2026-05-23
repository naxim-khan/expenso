# Transactions Module

The transactions module owns user-scoped financial transaction CRUD.

## Responsibilities

- Create income and expense transactions.
- List transactions with cursor pagination.
- Filter by type, category, and date range.
- Read, update, and delete individual transactions.
- Validate category ownership and category type before writes.
- Run write operations in Prisma transactions.

## Domain Rules

A transaction belongs to one user and one category. Its `type` must match the category type. A user cannot create a transaction against another user's category.

The module does not update a stored balance because balances are computed from transaction history by dashboard/report read models.

## Transaction Boundaries

Create, update, and delete use `prisma.$transaction()`. Create and update validate category ownership/type inside the same transaction as the write. Delete first loads the transaction by `userId` and `id`, then deletes by `id` inside the transaction.

## Repository Role

`TransactionsRepository` owns selected transaction fields, category validation lookup, filtered list query, and transaction writes. It accepts the caller's transaction client so `TransactionsService` can own atomicity.

## Pagination And Filtering

List queries support `limit`, `cursor`, `sortBy=createdAt`, `sortOrder`, `type`, `categoryId`, `from`, and `to`. The repository uses shared cursor helpers and indexes aligned with `userId`, `createdAt`, `type`, and `categoryId`.
