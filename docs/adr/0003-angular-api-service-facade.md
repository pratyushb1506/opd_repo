# 0003. Single Angular ApiService for HTTP

- Status: Accepted
- Date: 2026-11-11

## Context

The assignment requires that components do not call `HttpClient` directly. Splitting into many services early would over-fragment a two-page app.

## Decision

Expose one root `ApiService` that owns all backend calls (`patients`, `visits`, `queue`). Components and pages inject only `ApiService` (plus `DeskStateService` for UI badge state). Typed interfaces live in `models/patient.model.ts`.

## Consequences

- Clear boundary for the interview: “all HTTP is here.”
- Easy to stub in unit tests with one spy object.
- If the API grows, this façade can be split into `PatientService` / `VisitService` without changing the HTTP-only rule.
