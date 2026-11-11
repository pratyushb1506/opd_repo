# OPD Queue — Architecture

Small hospital OPD front-desk system: register patients, enqueue visits, display and clear the waiting queue.

## System context

```
┌─────────────────┐     HTTP/JSON      ┌──────────────────────┐
│  Angular SPA    │ ───────────────► │  Spring Boot API     │
│  :4200          │ ◄─────────────── │  :8080               │
│  (front desk)   │     CORS allowed │                      │
└─────────────────┘                    └──────────┬───────────┘
                                                  │ JPA
                                                  ▼
                                       ┌──────────────────────┐
                                       │  H2 in-memory DB     │
                                       │  + mr_number_seq     │
                                       └──────────────────────┘
```

**Actors:** reception / front-desk staff (no auth in this slice).

**Core use cases:** register patient → (optional) add to queue → view ordered queue → complete visit.

---

## Backend architecture

### Style

Classic **layered Spring Boot** monolith (single deployable JAR):

| Layer | Package | Responsibility |
|--------|---------|----------------|
| API | `controller` | HTTP mapping, `@Valid`, status codes — no business rules |
| Application | `service` | Registration, MR allocation, queue rules, visit lifecycle |
| Persistence | `repository` + `entity` | Spring Data JPA / Hibernate |
| Contracts | `dto` | Request/response shapes returned to clients |
| Cross-cutting | `exception`, `config` | `@RestControllerAdvice`, CORS |

```
controller ──► service ──► repository ──► H2
                │
                ├── dto mapping (entity → DTO)
                └── MrNumberService (DB sequence)
```

### Domain model

```
Patient 1 ─── * Visit
  id, mrNumber (unique), firstName, lastName,
  mobile (unique), dateOfBirth, gender

Visit
  id, patient, priority (ROUTINE|URGENT),
  status (WAITING|COMPLETED), createdAt, completedAt?
```

**Invariant:** a patient may have at most one `WAITING` visit (enforced in service under a pessimistic patient lock).

### API surface

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/api/patients` | Creates patient; allocates `MR-{year}-{######}` |
| `GET` | `/api/patients?search=` | Partial name / mobile match |
| `POST` | `/api/visits` | Enqueue (`WAITING`) |
| `GET` | `/api/queue` | Waiting only; URGENT then oldest |
| `PATCH` | `/api/visits/{id}/complete` | `WAITING` → `COMPLETED` |

### Error model

Uniform body: `{"errors": {"fieldOrKey": "message"}}`.

| Situation | Status |
|-----------|--------|
| Bean Validation / bad JSON | `400` |
| Unknown patient / visit | `404` |
| Duplicate mobile, second WAITING, complete non-WAITING | `409` |
| Unexpected | `500` (generic message, logged server-side) |

Controllers never return JPA entities.

### Concurrency

- **MR numbers:** H2 sequence `mr_number_seq` + unique constraint on `mr_number`.
- **One waiting visit:** `SELECT … FOR UPDATE` style lock via `findByIdForUpdate` before insert check.
- **Duplicate mobile race:** unique constraint + `DataIntegrityViolationException` → `409`.

### Configuration

- Port `8080`, H2 mem DB, H2 console `/h2-console`.
- CORS: `http://localhost:4200` for `/api/**`.
- Schema init: `schema.sql` creates the MR sequence (`spring.sql.init.mode=always`).

### Tests (backend)

- `PatientValidationTest` — `@WebMvcTest` validation → `400` errors map.
- `QueueOrderIntegrationTest` — URGENT first, then oldest.
- `ConflictScenariosIntegrationTest` — mobile / waiting / complete conflicts.

---

## Frontend architecture

### Style

**Angular 17 standalone** SPA with feature pages and a single API façade.

| Piece | Location | Responsibility |
|--------|----------|----------------|
| Shell | `app.component` | Nav, waiting-count badge |
| Routes | `app.routes` | `/register`, `/queue` |
| API façade | `services/api.service` | **Only** place that uses `HttpClient` |
| Shared desk state | `services/desk-state.service` | Waiting count for nav badge |
| Models | `models/patient.model` | Typed request/response interfaces |
| Register | `pages/register` | 3-step desk flow + reactive form |
| Queue | `pages/queue` | Search, enqueue, live board |

```
Component ──► ApiService ──► HttpClient ──► Spring Boot
     │
     └── DeskStateService (waiting count)
```

### Register flow (UX architecture)

1. **Details** — reactive form (same rules as backend).
2. **Queue** — show issued MR; choose Routine/Urgent or skip.
3. **Done** — open board or register another.

Submit stays disabled while `form.invalid`.

### Queue board behaviour

- Debounced type-ahead search + explicit Search button.
- Priority choice chips; URGENT rows highlighted.
- Relative wait labels; silent poll every 20s; refresh after add/complete.

### Styling

Plain CSS (no UI library). Clinical teal palette, responsive layouts, `prefers-reduced-motion` respected.

### Tests (frontend)

- `ApiService` HTTP contract tests.
- Register validation / 409 mapping / step transitions.
- Queue debounce, 409 “already in queue”, complete refresh.

---

## Repository layout

```
opd-queue/
  README.md
  api-examples.http
  docs/
    ARCHITECTURE.md          ← this file
    adr/                     ← Architecture Decision Records
  backend/                   ← Spring Boot (Maven)
  frontend/                  ← Angular
```

## Related ADRs

See [`docs/adr/README.md`](adr/README.md) for the decision log.
