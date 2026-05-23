# Testing Strategy

The backend uses Jest for unit tests and Supertest for e2e tests.

## Commands

```bash
npm test -- --runInBand
npm run test:e2e
npm run test:cov
npm run build
```

## Unit Tests

Unit tests focus on service behavior, collaborators, validation utilities, token/password services, Prisma service construction, and shared schemas.

Current unit coverage includes:

- Auth service flows and focused auth collaborators.
- Refresh-token hashing/rotation compatibility.
- Token service behavior.
- Password hashing.
- Category service duplicate checks, name normalization, pagination, not-found errors, and delete protection.
- Transaction service transaction boundaries, category validation, pagination, update, and delete behavior.
- Dashboard service aggregation orchestration.
- Reports service summary mapping, date priority, pagination, defaults, and amount-range validation.
- Shared auth Zod schemas.

## E2E Tests

E2E tests boot `AppModule`, call `configureApp`, and exercise the real HTTP stack with global prefix, validation, guards, response envelope, exception filter, Prisma, and PostgreSQL.

Current e2e coverage includes:

- Auth register, login, refresh rotation, logout invalidation, `/me`, and admin RBAC.
- Category CRUD, cursor pagination, duplicate-name behavior, default categories, and cross-user isolation.
- Transaction CRUD, validation, cursor pagination, category type validation, category delete protection, and cross-user isolation.
- Dashboard auth, user-scoped aggregations, charts, trends, cash flow, top categories, and recent transaction pagination.
- Reports auth, summary, filtered/sorted transaction reports, pagination, charts, monthly reports, cash flow, top categories, export preview, and validation failures.

## Database Assumptions

E2E tests use the configured `DATABASE_URL` and clear `transaction`, `category`, and `user` tables before each test. Run them against a disposable local/test database, not shared production data.

## Testing Requirements For New Work

- New endpoints need controller/e2e coverage for auth, validation, envelope, and error shape.
- New service branches need unit tests around orchestration and domain errors.
- New repository query paths need e2e or integration coverage proving user scoping and filter behavior.
- New pagination behavior must prove `limit`, `nextCursor`, and `hasNext`.
- Financial writes must test rollback-sensitive validation before persistence.
- Cross-user isolation is mandatory for every user-owned record.
