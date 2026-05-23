# Request Lifecycle

Every runtime request flows through shared infrastructure before and after module code.

```text
Client
-> Helmet/CORS/global prefix
-> Guards
-> ValidationPipe
-> Controller
-> Service
-> Repository
-> Prisma
-> PostgreSQL
-> Response interceptor or exception filter
-> Client
```

See [request-flow.mmd](../diagrams/request-flow.mmd).

## Lifecycle Details

`configureApp` sets the global prefix `/api/v1`. It enables Helmet, CORS with `FRONTEND_URL`, DTO validation, the global HTTP exception filter, and the API response interceptor.

For protected routes, `JwtAuthGuard` validates a bearer access token through Passport JWT. When roles are required, `RolesGuard` reads metadata from `@Roles` and compares it with `request.user.role`.

DTO validation occurs through Nest's `ValidationPipe`. The current configuration removes unknown fields, transforms typed query/body values, and rejects non-whitelisted properties. This gives controllers already-validated payloads.

Controllers pass authenticated `userId` and DTOs to services. Services enforce workflow invariants and call repositories. Repositories build Prisma queries that include user scoping and only select fields required by the endpoint.

Successful return values are wrapped by `ApiResponseInterceptor`. Cursor-paginated values are detected by `isCursorPaginationResult`, placing pagination details in `meta`. Non-paginated values receive an empty `{}` meta object.

Errors are normalized by `HttpExceptionFilter`. `AppException` preserves explicit application error codes. Validation errors become `VALIDATION_ERROR`. Unknown exceptions become `INTERNAL_SERVER_ERROR`.

## Why Global Systems Exist

Global validation prevents each controller from deciding its own security posture. Global response wrapping prevents contract drift between modules. The global exception filter keeps sensitive internal failures from leaking and gives API consumers a stable error format.

## Production Implications

- A route is not production-ready unless its DTO validates all external inputs.
- Protected routes must derive authorization from `request.user`, not from client-provided user IDs.
- Services should return domain data, not hand-built envelopes.
- Repositories must keep query fields and indexes aligned before new filters are exposed.
