# QA Backend Performance Progress

## Working Rules

- Update this file after every meaningful change.
- Log what changed, why it changed, and how it was verified.
- Keep the work sequential: finish one phase, then continue to the next.
- Do not change application code unless the current phase requires it.

## Current Status

- Active phase: Local performance phases completed
- Phase 1 goal: formalize scope, thresholds, and execution model.
- Phase 2 goal: run the first automated performance baseline.
- Remote QA/Staging remains blocked until a public `PERF_BASE_URL` exists.


## Log

| Date | Action | Result | Note |
| --- | --- | --- | --- |
| 2026-06-17 | Created formal performance test plan | Done | `QA_BACKEND_PERFORMANCE_TEST_PLAN.md` now defines scope, thresholds, scenarios, and environments. |
| 2026-06-17 | Reviewed API routes and payloads | Done | Confirmed real endpoints and request shapes from `src/routes/*.js` and the existing test suites. |
| 2026-06-17 | Created performance matrix | Done | Added endpoint-by-endpoint coverage matrix for review and traceability. |
| 2026-06-17 | Created performance runner scaffold | Done | Added a reusable Node runner for smoke and mixed-load scenarios with timeout and percentile reporting. |
| 2026-06-17 | Verified runner syntax | Done | `node --check QA_BACKEND_PERFORMANCE_RUNNER.mjs` passed with no output. |
| 2026-06-17 | Mixed nominal finding | Done | Mixed auth/public nominal tripped auth rate limits; scenarios were split so the public baseline stays representative. |
| 2026-06-17 | Reworked runner pacing | Done | Split public, auth, and flow scenarios to avoid auth rate-limit noise in nominal runs. |
| 2026-06-17 | Public nominal baseline | Done | `PERF_SCENARIO=nominal` on `http://localhost:3001` passed with `p95 29.95ms`, `max 129.29ms`, `errorRate 0`. |
| 2026-06-17 | Auth baseline | Done | `PERF_SCENARIO=auth` on `http://localhost:3001` passed with `p95 86.55ms`, `max 86.55ms`, `errorRate 0`. |
| 2026-06-17 | POS flow smoke | Done | `PERF_SCENARIO=flow-smoke` passed end to end with open cash, preview, create order, and close cash. |
| 2026-06-18 | Stress local run | Done | `PERF_SCENARIO=stress` on `http://localhost:3001` passed with `p95 114.79ms`, `max 322.37ms`, `errorRate 0`. |
| 2026-06-18 | Soak local run | Done | `PERF_SCENARIO=soak` on `http://localhost:3001` passed with `p95 22.08ms`, `max 94.65ms`, `errorRate 0`. |
| 2026-06-18 | QA/Staging blocker confirmed | Done | No published QA/Staging `PERF_BASE_URL` is available, so remote environment runs remain blocked. |
| 2026-06-18 | Executive summary added | Done | Added final high-level findings and local SLA conclusion to the performance plan. |
| 2026-06-18 | Evidence package created | Done | Added `QA_BACKEND_PERFORMANCE_EVIDENCE.md` with results, findings, risks, and recommendations. |

## Next Step

- Wait for a published QA/Staging base URL or keep using local runs for regression baselines.
