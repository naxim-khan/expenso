# API Versioning

The backend sets a global prefix:

```text
/api/v1
```

This is configured once in `configureApp` rather than repeated in every controller.

## Why Versioning Exists

Versioning protects API consumers from silent breaking changes. A frontend, mobile app, SDK, or external consumer should be able to depend on stable `/api/v1` response contracts while the backend evolves.

## Current Stability Rules

The following are contract-stable in `/api/v1`:

- Success envelope shape.
- Error envelope shape.
- Pagination metadata shape.
- Route names and HTTP methods.
- Field names in documented response bodies.
- Auth token response shape.

## Breaking Changes

Breaking changes should require a new API version, not a silent `/api/v1` mutation. Examples:

- Removing or renaming response fields.
- Changing pagination metadata.
- Replacing request filter names.
- Changing auth token transport or response shape without compatibility.
- Changing report calculation semantics in a way clients cannot distinguish.

## Non-Breaking Changes

Normally safe changes include:

- Adding optional response fields.
- Adding new endpoints.
- Adding optional filters with documented defaults.
- Tightening internal query performance without changing the response.
- Adding new error codes for new failure modes.

## Documentation Requirement

Every new endpoint or response contract change must update `docs/api`, module docs, and diagrams if request or architecture flow changes.
