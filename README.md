# WSMS — Web Based Stationery Management System

A tool for tracking stationery requests across an institution (college, organization, etc.),
replacing ad-hoc email/Excel tracking. It supports two roles — **Regular User** (requestor) and
**Manager** (approver, who can also request) — with role-based eligibility, an approval workflow,
automatic email notifications, and a management cost report.

**Stack:** Spring Boot 3.5 (REST API) + React 18 (Vite) · H2 in-memory DB · JWT auth · real SMTP.

---

## Modules (per spec WSMS_013)

| # | Module | What it does |
|---|--------|--------------|
| 1 | Login / Registration | Register, login, change password (JWT, BCrypt) |
| 2 | Availability / Eligibility | Role-based item availability; role-based max purchase value + remaining |
| 3 | Request / Cancellation | Apply with dates & superior email; withdraw (pending) or cancel (approved) |
| 4 | Managers Action | View all requests; approve/reject; confirm cancellations |
| 5 | Help | In-app usage guide |
| 6 | e-Mail | Notifies requestor + superior on submit / approve / reject / cancel / password change |
| 7 | Report | Per-item cost, % of total, head count, cumulative total |

---

## Project layout

```
FSAD/
├── backend/     Spring Boot REST API (Maven)
├── frontend/    React + Vite SPA
└── README.md
```

---

## Prerequisites

- **Java 21+** (tested on SapMachine JDK 25) and **Maven 3.9+**
- **Node 18+** and **npm**

---

## Run it

### 1. Backend (port 8080)

```bash
cd backend
mvn spring-boot:run
```

- H2 console: http://localhost:8080/h2-console (JDBC URL `jdbc:h2:mem:wsmsdb`, user `sa`, no password)
- Seeded demo accounts:
  - **Manager** — `manager` / `manager123` (Head of Department, Computer Science)
  - **User** — `user` / `user123` (Lecturer, Computer Science; superior = the manager)
- Seeded lookups: 2 roles, 3 departments, 6 designations (Lecturer → Principal, each with an
  eligibility cap), 3 categories, and 7 stationery items (5 open to all staff, 2 manager-only),
  plus one pending multi-item sample request.

> The in-memory DB resets on every restart. The schema is **10 normalized tables** — see the
> ER Diagram artefact in [docs/](docs/).

### 2. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend on `:8080`.

> This project includes a `frontend/.npmrc` pinning the public npm registry
> (`https://registry.npmjs.org/`) so `npm install` works outside a private registry.

---

## Email (real SMTP)

Email is **real SMTP** but **optional**: if `MAIL_USERNAME` is blank, sends are skipped and
logged (`[EMAIL skipped] ...`) so the workflow still succeeds offline. To actually send mail,
set these environment variables before starting the backend:

```bash
export MAIL_HOST=smtp.gmail.com
export MAIL_PORT=587
export MAIL_USERNAME=you@example.com
export MAIL_PASSWORD=your-app-password     # Gmail: use an App Password, not your login
export MAIL_FROM=you@example.com
mvn spring-boot:run
```

For a quick local test without a real provider, run a dev SMTP catcher (e.g. MailHog on
`localhost:1025`) and set `MAIL_HOST=localhost MAIL_PORT=1025 MAIL_USERNAME=dev`.

---

## Configuration

All settings live in [`backend/src/main/resources/application.properties`](backend/src/main/resources/application.properties)
and can be overridden by environment variables:

| Property | Env var | Default | Meaning |
|----------|---------|---------|---------|
| `wsms.jwt.secret` | `JWT_SECRET` | dev secret | HS256 signing key (≥32 bytes) |
| `wsms.jwt.expiration-ms` | — | 86400000 | Token lifetime (24h) |
| `wsms.eligibility.user-max` | — | 5000 | Regular user purchase cap |
| `wsms.eligibility.manager-max` | — | 20000 | Manager purchase cap |
| `spring.mail.*` | `MAIL_*` | see above | SMTP settings |

---

## API reference

All endpoints are under `/api`. Authenticated requests need `Authorization: Bearer <token>`.

| Method & path | Role | Purpose |
|---------------|------|---------|
| `GET /api/meta` | public | Lookup lists for registration (departments, designations, roles, categories, superiors) |
| `POST /api/auth/register` | public | Register `{ username, email, password, departmentId, designationId, manager, superiorId? }` |
| `POST /api/auth/login` | public | Login → `{ token, username, email, role, designation, department, maxPurchaseValue }` |
| `POST /api/auth/change-password` | auth | Change own password |
| `GET /api/items` | auth | Stationery availability (role-filtered, with category) |
| `GET /api/eligibility` | auth | `{ role, designation, maxPurchaseValue, committedValue, remainingValue }` |
| `POST /api/requests` | auth | Apply: `{ fromDate, toDate, lines: [{ itemId, quantity }, …] }` |
| `GET /api/requests/my` | auth | Own requests (with line items) + statuses |
| `POST /api/requests/{id}/withdraw` | auth | Withdraw a `SUBMITTED` request |
| `POST /api/requests/{id}/cancel` | auth | Request cancellation of an `APPROVED` request |
| `GET /api/manager/requests?pending=true` | MANAGER | All / only-actionable requests |
| `POST /api/manager/requests/{id}/approve` | MANAGER | Approve (decrements each line's stock) |
| `POST /api/manager/requests/{id}/reject` | MANAGER | Reject |
| `POST /api/manager/requests/{id}/confirm-cancel` | MANAGER | Confirm a cancellation (restocks) |
| `GET /api/manager/report` | MANAGER | Cost report (aggregated over line items) |

### Request lifecycle

```
SUBMITTED ──approve──▶ APPROVED ──cancel──▶ CANCEL_REQUESTED ──confirm-cancel──▶ CANCELLED
    │                     ▲                                                    (stock restored)
    ├──reject──▶ REJECTED │ (stock decremented on approval)
    └──withdraw──▶ WITHDRAWN
```

---

## Tests

```bash
cd backend
mvn test
```

Covers eligibility checks, stock changes, status-transition rules, report aggregation, and a
full Spring context boot. A quick manual end-to-end script lives in the PR notes; see the API
table above to reproduce with `curl`.
