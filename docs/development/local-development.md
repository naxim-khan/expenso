# Local Development

Work from `expenso-backend`.

## Install

```bash
cd expenso-backend
npm install
cp .env.example .env
```

Fill `.env` with local database and JWT values.

## Start PostgreSQL With Docker

```bash
docker run --name expenso-postgres \
  -e POSTGRES_USER=expenso \
  -e POSTGRES_PASSWORD=expenso \
  -e POSTGRES_DB=expenso_db \
  -p 5432:5432 \
  -d postgres:16
```

Use:

```bash
DATABASE_URL="postgresql://expenso:expenso@localhost:5432/expenso_db"
```

## Database Setup

```bash
npx prisma migrate dev
npx prisma generate
npm run prisma:seed
```

Open Prisma Studio:

```bash
npx prisma studio
```

Reset a disposable local database:

```bash
npm run db:reset
```

## Run API

```bash
npm run start:dev
```

The API listens on `http://localhost:3001` by default and routes are under `/api/v1`.

Health check:

```bash
curl http://localhost:3001/api/v1/health
```

## Useful Commands

```bash
npm run build
npm run format
npm run lint
npm test -- --runInBand
npm run test:watch
npm run test:cov
npm run test:e2e
npm run test:debug
npm run prisma:seed
npm run seed:admin
```

## E2E Test Warning

E2E tests delete transactions, categories, and users before each test. Always point `DATABASE_URL` at a disposable test/local database before running:

```bash
npm run test:e2e
```
