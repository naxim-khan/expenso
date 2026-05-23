# Scalability Considerations

## Horizontal Application Scaling

The API is mostly stateless between requests. Access tokens carry identity, and refresh-token validity is checked against PostgreSQL. Multiple API instances can run behind a load balancer as long as they share the same database and secrets.

## Database Scaling

PostgreSQL is the main scaling dependency. Use query plans and latency measurements before adding caches or new infrastructure. Current indexes support the implemented filters and report/dashboard paths.

Potential future database work:

- Read replicas for reporting endpoints.
- Materialized views for expensive recurring reports.
- Date partitioning for very large transaction tables.
- Full-text or trigram indexes for report search.
- Compound cursor designs for non-time sorted report tables.

## Background Work

The export-preview endpoint does not generate files. If CSV/PDF exports are added, use a background queue and durable object storage instead of long-running request handlers.

## Auth Scaling

The current refresh-token model stores one active refresh-token digest per user. If multi-device sessions become a requirement, introduce a session table with device/session IDs, expiry, revocation, and indexes.

## Operational Scaling

Before scaling traffic, add:

- Structured request logs.
- Error tracking.
- DB query latency metrics.
- Rate limiting for auth endpoints.
- Health/readiness probes.
- Migration deployment procedure.
- Backup and restore process.
