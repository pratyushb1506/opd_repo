# Architecture Decision Records (ADR)

Lightweight log of significant technical choices for OPD Queue.

| ID | Title | Status |
|----|--------|--------|
| [0001](0001-layered-backend-and-dto-boundary.md) | Layered backend and DTO boundary | Accepted |
| [0002](0002-mr-number-via-database-sequence.md) | MR number via database sequence | Accepted |
| [0003](0003-angular-api-service-facade.md) | Single Angular ApiService for HTTP | Accepted |
| [0004](0004-h2-in-memory-for-assignment.md) | H2 in-memory for this assignment slice | Accepted |
| [0005](0005-queue-ordering-and-waiting-invariant.md) | Queue ordering and one-WAITING invariant | Accepted |
| [0006](0006-register-then-enqueue-desk-flow.md) | Register → enqueue interactive desk flow | Accepted |

## How to add an ADR

1. Copy the template below into `docs/adr/NNNN-short-title.md`.
2. Add a row to the table above.
3. Keep each ADR short (context → decision → consequences).

### Template

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded | Deprecated
- Date: YYYY-MM-DD

## Context
What problem or constraint forced a choice?

## Decision
What did we choose?

## Consequences
What becomes easier / harder? What follow-ups exist?
```
