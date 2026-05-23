# Project Conventions

## Naming

- Modules use plural resource names where they expose resource collections, such as `categories`, `transactions`, and `reports`.
- DTOs end with `Dto`.
- Repositories end with `Repository`.
- Mappers end with `Mapper`.
- Guards end with `Guard`.

## API

- All API routes live under `/api/v1`.
- Resource CRUD uses REST verbs.
- Read-model routes use descriptive names such as `/dashboard/overview` and `/reports/category-breakdown`.
- Clients do not pass `userId`; user identity comes from JWT context.

## Validation

- REST inputs use class-validator DTOs.
- Query number fields use `class-transformer` `@Type(() => Number)`.
- Enums use Prisma-generated enum types.
- Unknown fields are rejected globally.

## Errors

- Domain errors use `AppException`.
- Error codes come from `ErrorCodes`.
- Do not throw raw Prisma or generic errors from intended domain branches.

## Pagination

- Use `limit` and `cursor`.
- Cap list limits at 100 unless a stricter DTO cap exists.
- Return `meta.limit`, `meta.nextCursor`, and `meta.hasNext`.
- Use `buildPrismaCursorQuery` and `buildCursorPagination`.

## Documentation

- New modules require `docs/modules` documentation.
- New endpoints require `docs/api` examples.
- New indexes or schema changes require database docs.
- Architecture changes require architecture docs and diagrams when flow changes.
