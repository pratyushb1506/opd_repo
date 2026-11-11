# 0001. Layered backend and DTO boundary

- Status: Accepted
- Date: 2026-11-11

## Context

The assignment requires a small Spring Boot API that must stay easy to explain in a follow-up call. Controllers must not leak JPA entities, and business rules (duplicate mobile, one waiting visit, completion rules) must live in one place.

## Decision

Use a classic layered package layout:

- `controller` — HTTP only (`@Valid`, status codes)
- `service` — all business rules and DTO mapping
- `repository` / `entity` — persistence
- `dto` — API contracts
- `exception` / `config` — global errors and CORS

Entities are never returned from controllers; services map to DTOs.

## Consequences

- Easy interview narrative: “controller thin, service owns rules.”
- Extra mapping code (acceptable at this size).
- Future auth / multi-unit filters can sit in service/repository without changing controllers much.
