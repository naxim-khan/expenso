# Response Envelope

All successful API responses are normalized by `ApiResponseInterceptor`.

```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "meta": {}
}
```

Errors are normalized by `HttpExceptionFilter`.

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials"
  }
}
```

See [response-lifecycle.mmd](../diagrams/response-lifecycle.mmd).

## Why The Envelope Exists

API consumers should not parse a different response shape per module. A stable envelope gives frontend clients, SDKs, tests, and monitoring tools one predictable contract for success, errors, messages, data, and metadata.

The response envelope also prevents controllers from hand-building response objects. Controllers return application data; the interceptor owns transport formatting.

## Messages

Controllers use `@ResponseMessage` to set operation-specific messages. When no message exists, the interceptor uses `Request successful`.

Examples:

- `User registered successfully`
- `Transactions retrieved successfully`
- `Financial summary report retrieved successfully`

## Pagination Metadata

When a service returns `{ data, meta }` matching `CursorPaginationResult`, the interceptor unwraps the data array into envelope `data` and moves pagination metadata to envelope `meta`.

This keeps all paginated endpoints consistent without each service knowing the HTTP envelope format.

## Error Codes

Application errors should use `AppException` with an `ErrorCodes` value. Validation errors from the global `ValidationPipe` become `VALIDATION_ERROR`. Unknown exceptions become `INTERNAL_SERVER_ERROR`.

Current application error codes include auth failures, duplicate categories, missing categories/transactions, category-in-use protection, and transaction category validation failures.

## Contract Stability

The `/api/v1` envelope shape is stable. Do not add per-endpoint alternate envelopes, return raw arrays, or leak raw Nest/Prisma errors. Breaking envelope changes require a future API version.
