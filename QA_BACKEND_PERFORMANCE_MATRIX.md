# QA Backend Performance Matrix

## Scope

This matrix is aligned to the real API routes in `cafecito-api` and to the current POS flow.

## Scenarios

| ID | Scenario | Endpoint(s) | Mode | Priority | Target |
| --- | --- | --- | --- | --- | --- |
| PERF-001 | Health check | `GET /health` | Smoke | High | Confirm service and DB readiness. |
| PERF-002 | Root route | `GET /` | Smoke | Medium | Confirm base route remains fast. |
| PERF-003 | Catalog read | `GET /api/products`, `GET /api/categories` | Mixed load | High | Validate catalog reads stay under 1s. |
| PERF-004 | Auth login | `POST /api/auth/login` | Mixed load | High | Validate login latency under concurrency. |
| PERF-005 | Auth refresh | `POST /api/auth/refresh` | Mixed load | Medium | Validate refresh flow under load. |
| PERF-006 | Client search | `GET /api/clients/search` | Mixed load | Medium | Validate authenticated reads under load. |
| PERF-007 | Orders list | `GET /api/orders` | Mixed load | Medium | Validate authenticated list latency. |
| PERF-008 | Order preview | `POST /api/orders/preview` | Mixed load | High | Validate POS quote calculation under load. |
| PERF-009 | POS chain | `POST /api/total-cash/open`, `POST /api/orders/preview`, `POST /api/orders`, `POST /api/total-cash/close` | Flow smoke | High | Validate the critical cashier flow end to end. |

## Acceptance Targets

- `p95 < 1000ms` for nominal and peak-expected runs.
- `max < 1000ms` for smoke and nominal runs.
- Error rate below `1%` for nominal and peak-expected runs.
- Stress runs may exceed the target while identifying the failure point, but the failure point must be documented.

## Required Inputs

- `PERF_BASE_URL`
- `PERF_EMPLOYEE_ID`
- `PERF_PASSWORD`
- `PERF_PRODUCT_ID`
- `PERF_CLIENT_ID`
- `PERF_CASH_PIN`
