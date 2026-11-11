# 0005. Queue ordering and one-WAITING invariant

- Status: Accepted
- Date: 2026-11-11

## Context

Staff need a deterministic board: urgent patients first, then longest wait. A patient must not appear twice as waiting.

## Decision

1. **Ordering** — single JPQL query: status `WAITING`, order by `URGENT` before `ROUTINE`, then `createdAt ASC`. Join-fetch patient for DTO projection.
2. **Invariant** — before insert, pessimistically lock the patient row and reject if a `WAITING` visit already exists (`409`).
3. **Complete** — only `WAITING` → `COMPLETED` with `completedAt`; otherwise `409`.

## Consequences

- Ordering is database-owned (no sort in the UI).
- Locking prevents duplicate waiting visits under concurrent “Add to queue”.
- Partial unique index (Postgres) could reinforce the invariant later; H2 + lock is enough for this slice.
