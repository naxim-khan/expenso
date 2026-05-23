# Testing Workflow

## Unit Tests

Run:

```bash
npm test -- --runInBand
```

Watch mode:

```bash
npm run test:watch
```

Coverage:

```bash
npm run test:cov
```

## E2E Tests

Run:

```bash
npm run test:e2e
```

E2E uses `test/jest-e2e.json` with `maxWorkers: 1`. Tests boot the real `AppModule`, call `configureApp`, and use Supertest against the HTTP server.

## Database Setup For E2E

Use a disposable database:

```bash
export DATABASE_URL="postgresql://expenso:expenso@localhost:5432/expenso_test"
npx prisma migrate dev
npm run test:e2e
```

The current e2e tests clear transaction, category, and user rows before each test.

## Recommended Pre-PR Verification

```bash
npm run build
npm test -- --runInBand
npm run test:e2e
```

## What To Test For New Features

- Auth requirement and unauthorized response.
- DTO validation and `VALIDATION_ERROR`.
- Success envelope and response message.
- User-scoped data isolation.
- Pagination metadata where lists exist.
- Repository query behavior for filters and sorting.
- Transaction rollback behavior for multi-step writes.
- Error codes for domain failures.
