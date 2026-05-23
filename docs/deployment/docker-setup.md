# Docker And Local PostgreSQL Setup

There is currently no committed Dockerfile or Docker Compose file in `expenso-backend`. The supported local Docker path is to run PostgreSQL as an external container and run the NestJS app on the host.

## Start Local PostgreSQL

```bash
docker run --name expenso-postgres \
  -e POSTGRES_USER=expenso \
  -e POSTGRES_PASSWORD=expenso \
  -e POSTGRES_DB=expenso_db \
  -p 5432:5432 \
  -d postgres:16
```

Set `.env`:

```bash
DATABASE_URL="postgresql://expenso:expenso@localhost:5432/expenso_db"
FRONTEND_URL="http://localhost:3000"
JWT_ACCESS_SECRET="local-access-secret-change-me"
JWT_REFRESH_SECRET="local-refresh-secret-change-me"
ACCESS_TOKEN_EXPIRES="15m"
REFRESH_TOKEN_EXPIRES="7d"
ADMIN_NAME="Super Admin"
ADMIN_EMAIL="admin@expenso.local"
ADMIN_PASSWORD="Admin@12345"
```

Run migrations and generate Prisma client:

```bash
npx prisma migrate dev
npx prisma generate
```

Seed admin:

```bash
npm run prisma:seed
```

Run API:

```bash
npm run start:dev
```

## Stop Local PostgreSQL

```bash
docker stop expenso-postgres
docker start expenso-postgres
```

To delete the container and local data:

```bash
docker rm -f expenso-postgres
```

## Future Backend Containerization

When adding a backend Dockerfile, document:

- Node version.
- Install/build/prisma generate steps.
- Runtime command.
- Environment variable injection.
- Health check.
- Non-root user.
- Migration execution policy.

Do not document a committed Docker image workflow until the repository actually contains one.
