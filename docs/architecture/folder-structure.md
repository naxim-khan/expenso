# Folder Structure

The real backend lives in `expenso-backend`. `NestJs-example-code` is reference material and is not part of the production backend.

```text
expenso-backend/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── common/
│   │   ├── constants/
│   │   ├── decorators/
│   │   ├── exceptions/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── responses/
│   │   └── utils/
│   ├── config/
│   ├── generated/prisma/
│   ├── modules/
│   │   ├── auth/
│   │   ├── categories/
│   │   ├── dashboard/
│   │   ├── reports/
│   │   └── transactions/
│   ├── prisma/
│   ├── shared/schemas/
│   ├── app.module.ts
│   ├── health.controller.ts
│   └── main.ts
└── test/
```

## Why This Layout Exists

`src/modules` holds product capabilities. This keeps API controllers, DTOs, services, repositories, mappers, interfaces, constants, and domain helpers close to the module they serve.

`src/common` holds cross-cutting application infrastructure. The response interceptor, exception filter, shared pagination helpers, error codes, and response-message decorator are used across modules and should not be reimplemented per feature.

`src/prisma` contains application-level Prisma integration. The generated Prisma client is emitted to `src/generated/prisma` by the Prisma generator, while schema and migrations remain in top-level `prisma`.

`src/shared/schemas` contains optional Zod schemas. The current auth schemas mirror request payloads for shared/runtime use, but REST validation still happens through DTO classes and the global `ValidationPipe`.

## Module Internal Pattern

Production modules follow this shape when the responsibility exists:

```text
module-name/
├── dto/
├── interfaces/
├── mappers/
├── repositories/
├── constants/
├── domain/
├── module-name.controller.ts
├── module-name.service.ts
└── module-name.module.ts
```

Not every module needs every folder. For example, categories use `domain` for name normalization and `constants` for default templates. Dashboard and reports use `mappers` and `repositories` because they convert aggregate rows into API-facing read models.

## Ownership Rules

- Controllers are route adapters.
- DTOs validate request shape.
- Services orchestrate workflow and domain decisions.
- Repositories own complex Prisma queries and aggregation shapes.
- Mappers convert repository results into stable API data.
- Prisma schema and migrations are the only database schema source of truth.
