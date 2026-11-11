# 0002. MR number via database sequence

- Status: Accepted
- Date: 2026-11-11

## Context

Two receptionists may register patients at the same instant. MR numbers must be unique and increasing in the form `MR-2026-000001`. Computing `max(mr)+1` in application code races under concurrency.

## Decision

Allocate MR numbers with an H2 sequence (`mr_number_seq`) inside the registration transaction:

`MR-{currentYear}-{6-digit zero-padded sequence value}`

Keep a unique constraint on `patients.mr_number` as a safety net. Concurrent unique violations map to HTTP `409`.

## Consequences

- Clash-free under concurrent registrations without application-level locks for MR generation.
- Sequence gaps are possible if a transaction rolls back after `NEXT VALUE` (acceptable for MR allocation).
- Production would keep the same idea (PostgreSQL sequence / identity) behind the same service API.
