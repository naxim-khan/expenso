# Cursor Rules Explained

Project-specific Cursor guidance lives in `.cursor/rules/nestjs-production-architecture.mdc`.

## Purpose

The rule encodes the backend architecture so future AI-assisted work does not drift into inconsistent patterns. It is scoped to `expenso-backend/**/*` and explains how to work with controllers, services, repositories, DTOs, Prisma, validation, pagination, response envelopes, dashboard/report read models, category defaults, and auth responsibilities.

## Important Rules

- `expenso-backend` is the real backend.
- `NestJs-example-code` is reference code only.
- Controllers remain HTTP-only.
- Services orchestrate and own transaction boundaries.
- Repositories own complex Prisma query shapes.
- DTOs are mandatory for REST inputs.
- Cursor pagination is required for list endpoints.
- Dashboard and reports are read models.
- All protected data access is user-scoped.
- Response contracts under `/api/v1` are stable.
- Documentation must be updated for architecture, endpoint, database, repository, response, and diagram changes.

## Why This Matters

Documentation and rules are part of production maintainability. The rule file acts as a guardrail during edits, while `docs/` explains the reasoning and contracts for humans. When code changes, both must remain aligned.
