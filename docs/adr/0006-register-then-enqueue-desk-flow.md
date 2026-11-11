# 0006. Register → enqueue interactive desk flow

- Status: Accepted
- Date: 2026-11-11

## Context

A flat “register then navigate to queue” UX forces extra clicks for the common path (register and seat the patient immediately). The assignment still only needs registration + queue pages.

## Decision

Keep two routes (`/register`, `/queue`) but make registration a **three-step flow** on one page:

1. Capture demographics (reactive form).
2. Show issued MR; optionally add to queue with Routine/Urgent (or skip).
3. Done — open queue board or register another.

The queue page remains the live board (search existing patients, complete visits).

## Consequences

- Matches real front-desk rhythm without new routes or backend endpoints.
- Slightly more frontend state (`step`, `queuedSuccessfully`); covered by unit tests.
- Pure assignment minimum (register-only page) remains available by skipping step 2.
