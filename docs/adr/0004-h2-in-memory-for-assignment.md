# 0004. H2 in-memory for this assignment slice

- Status: Accepted
- Date: 2026-11-11

## Context

The brief specifies H2 in-memory for a short assignment (≈1.5–2 hours). Production durability, migrations, and multi-instance safety are out of scope for the runnable demo.

## Decision

Use H2 (`jdbc:h2:mem:opdqueue`) with Hibernate `ddl-auto=update` and `schema.sql` for the MR sequence. Enable the H2 console for local inspection. Document PostgreSQL + Flyway as a pre-production change in the README.

## Consequences

- Zero local DB install; fast tests and demos.
- Data resets when the process stops.
- Schema evolution is informal; must be replaced before production (see README answer **c**).
