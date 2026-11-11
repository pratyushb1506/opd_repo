# OPD Queue

Small hospital outpatient (OPD) front-desk app: register a patient, add them to the waiting queue, view the queue, and mark visits complete.

**Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · **ADRs:** [docs/adr/README.md](docs/adr/README.md)

## Run the backend

```bash
cd backend
mvn spring-boot:run
```

- API: `http://localhost:8080`
- H2 console: `http://localhost:8080/h2-console`  
  JDBC URL `jdbc:h2:mem:opdqueue`, user `sa`, password blank

Tests:

```bash
cd backend
mvn clean test
```

## Run the frontend

```bash
cd frontend
npm install
ng serve
```

- App: `http://localhost:4200`

Tests:

```bash
cd frontend
npm test -- --watch=false --browsers=ChromeHeadless
```

HTTP examples for the API live in [`api-examples.http`](api-examples.http).

## API summary

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/patients` | Register patient; returns DTO with generated `MR-YYYY-######` |
| `GET` | `/api/patients?search=` | Case-insensitive search by name or mobile |
| `POST` | `/api/visits` | Add patient to queue (`WAITING`) with `ROUTINE` / `URGENT` |
| `GET` | `/api/queue` | Waiting visits: URGENT first, then oldest |
| `PATCH` | `/api/visits/{id}/complete` | Mark visit `COMPLETED` |

Validation failures → `400` with `{"errors":{"field":"message"}}`. Conflicts (duplicate mobile, already waiting, complete non-waiting) → `409`. Missing resources → `404`.

## Design notes (interview answers)

**a) Concurrent MR numbers never clash**  
MR numbers come from an H2 database sequence (`NEXT VALUE FOR …`) inside the registration transaction, formatted as `MR-{year}-{6-digit}`. The `patient.mr_number` column also has a unique constraint as a safety net, so two simultaneous registrations cannot receive or persist the same value.

**b) One DB, many hospital units**  
Add `hospitalUnitId` on every table. Take the unit from the authenticated user’s token (never from the request body). Enforce it on every repository query (filter/`WHERE` or Hibernate `@Filter` / DB row-level security). Integration tests should prove cross-unit reads/writes return `404` or `403`.

**c) Two changes before production**  
1) Add authentication/authorization (and audit logging of who registered/completed whom).  
2) Replace H2 with PostgreSQL plus Flyway migrations; also plan HTTPS, rate limiting, pagination, and encrypting patient PII at rest.
