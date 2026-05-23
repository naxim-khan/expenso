# Production Checklist

## Build And Runtime

- `npm run build` passes.
- `npm run start:prod` starts `node dist/main`.
- `DATABASE_URL` points at production PostgreSQL.
- JWT secrets are strong and distinct.
- `FRONTEND_URL` is the production frontend origin.
- Prisma migrations are applied before serving traffic.
- Prisma client is generated after schema changes.

## Security

- Real `.env` values are not committed.
- Passwords use bcrypt.
- Refresh tokens are stored as SHA-256 digests.
- Protected routes use `JwtAuthGuard`.
- User-owned records are queried by authenticated `userId`.
- Errors use the global exception filter.
- CORS is restricted to the intended frontend origin.

## Database

- Indexes are present for exposed filters and sorts.
- Migration plan is reviewed for destructive changes.
- Backups and restore drills exist outside the application repo.
- E2E tests run against disposable databases only.

## API Contracts

- `/api/v1` response envelope is preserved.
- Pagination metadata shape is unchanged.
- New endpoints have API docs.
- Breaking response changes are versioned.

## Testing

```bash
npm test -- --runInBand
npm run test:e2e
npm run build
```

Run e2e against a test database because tests delete table data.

## Observability To Add Before Serious Production Traffic

The current codebase does not include structured logging, tracing, metrics, or rate limiting. Before high-traffic production use, add request logging, database latency measurement, auth failure monitoring, health checks that do not expose sensitive counts publicly, and rate limits for auth endpoints.
