# Environment Variables

The backend reads configuration through `@nestjs/config` and Prisma config.

## Required Runtime Variables

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/expenso_db"
FRONTEND_URL="http://localhost:3000"
JWT_ACCESS_SECRET="replace-with-access-token-secret"
JWT_REFRESH_SECRET="replace-with-refresh-token-secret"
ACCESS_TOKEN_EXPIRES="15m"
REFRESH_TOKEN_EXPIRES="7d"
```

## Seed Variables

```bash
SEED_ADMIN="true"
ADMIN_NAME="Super Admin"
ADMIN_EMAIL="admin@expenso.local"
ADMIN_PASSWORD="replace-with-strong-admin-password"
```

`SEED_ADMIN` defaults to `true` in `prisma/seed.ts` when omitted.

## Production Guidance

- Use long random secrets for JWT variables.
- Keep access and refresh secrets different.
- Do not commit real `.env` files.
- Use a managed secret store in production.
- Set `FRONTEND_URL` to the exact browser origin allowed to call the API.
- Use a dedicated database user with least required privileges.

## Startup Failure Behavior

`PrismaService` throws an internal application exception if `DATABASE_URL` is missing. `TokenService` and `JwtStrategy` also fail when required JWT configuration is absent. This is intentional: production should fail fast on invalid auth/database configuration.
