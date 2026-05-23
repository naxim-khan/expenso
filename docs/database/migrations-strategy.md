# Migrations Strategy

Prisma migrations live in `expenso-backend/prisma/migrations`.

## Current Migration History

- `20260523074200_baseline`: baseline existing schema.
- `20260523074300_add_auth_fields`: user role, refresh token, and updated timestamp.
- `20260523100300_core_modules_schema`: category/transaction schema improvements and core indexes.
- `20260523102334_default_category_fields`: `isSystem` and `version`.
- `20260523103200_normalized_category_names`: normalized category names and unique index migration.
- `20260523114050_dashboard_indexes`: dashboard composite transaction indexes.
- `20260523165000_reports_indexes`: report amount/title indexes.

## Local Commands

```bash
npx prisma migrate dev
npx prisma generate
npm run db:reset
```

`npm run db:reset` runs `npx prisma migrate reset --force && npx prisma generate`. It is destructive and should only be used against disposable local/test databases.

## Seed Workflow

```bash
npm run prisma:seed
npm run seed:admin
```

The seed script builds the project and runs `prisma/seed.ts`. It can create/update an admin user using `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SEED_ADMIN`. It does not create per-user default categories; those belong to registration onboarding.

## Production Migration Rules

- Never hand-edit applied migrations in a shared environment.
- Review migrations for data backfill safety before deployment.
- Add indexes before exposing high-traffic filters/sorts.
- Avoid destructive column changes without a staged migration plan.
- Keep generated Prisma client updated after schema changes.
- Update docs when schema, indexes, or transaction boundaries change.

## Backfill Pattern

The normalized category-name migration shows the expected pattern:

1. Add nullable column.
2. Backfill existing rows.
3. Set `NOT NULL`.
4. Replace old index with new unique index.

This staged approach avoids breaking existing data during schema evolution.
