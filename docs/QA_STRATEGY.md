# QA Strategy

Ultima revision: 2026-06-18.

## Estado Actual Verificado

| Paquete | Comando | Resultado observado |
| --- | --- | --- |
| API | `npm test` desde `cafecito-api/` | 17 suites passed, 123 tests passed |
| Frontend | `npm test -- --watchAll=false` desde `cafecito-app/` | 1 suite passed, 1 test passed |

## Backend

Stack de pruebas:
- Jest 30.
- Supertest.
- MongoMemoryServer.
- `jest.config.js` con `testEnvironment: node`, setup en `tests/setup/setup.js` y thresholds de coverage.

Comandos:
- `npm test`
- `npm test -- tests/auth.test.js`
- `npm run test:watch`
- `npm run test:coverage`

Cobertura funcional actual:
- Auth.
- Authorization.
- Users.
- Categories.
- Products.
- Clients.
- Orders.
- Cash.
- Security/ethical hacking.
- Regression POS flow.
- Unit tests de middlewares, validators, helpers, factories y rate limit.

Riesgos QA backend:
- Algunos tests documentan comportamiento actual de duplicados como error handler actual; no necesariamente comportamiento ideal.
- `logs/error.log` puede modificarse durante tests por side effects del error handler.
- Hay warnings Mongoose por `{ new: true }` deprecado.
- Hay logs debug en controladores de caja.

## Frontend

Stack de pruebas:
- Create React App / Jest.
- `src/App.test.js`.
- Cypress con smoke POS inicial en `cypress/e2e/pos-smoke.cy.js`.

Comando no interactivo:
- `npm test -- --watchAll=false`
- `npm run cypress:open`
- `npm run cypress:run`
- `npm run e2e`

Gaps frontend:
- Sin tests para `OrderContext`.
- Sin tests para `SessionContext`.
- Sin tests para servicios HTTP/token refresh.
- Sin test unit/integration de checkout preview-create.
- Cypress ya tiene un smoke POS mockeado; falta ampliar a backend real, cierre de caja, barista y cliente.
- Los E2E no deben usar flujos de e-commerce como registro, envio, dashboard o checkout por pasos; deben cubrir el POS real.

## Performance

Documentos fuente:
- `docs/qa/QA_BACKEND_PERFORMANCE_TEST_PLAN.md`
- `docs/qa/QA_BACKEND_PERFORMANCE_MATRIX.md`
- `docs/qa/QA_BACKEND_PERFORMANCE_EVIDENCE.md`

Estado:
- Corridas locales completadas con SLA local menor a 1 segundo.
- QA/Staging bloqueado por falta de `PERF_BASE_URL` publica.

## Estrategia Recomendada

1. Mantener API suite completa como gate antes de cambios backend relevantes.
2. Agregar tests frontend unit/integration para contexts y checkout.
3. Ampliar Cypress desde el smoke POS actual hacia casos E2E con backend real y flujos críticos restantes.
4. Separar tests que documentan bugs de tests de comportamiento esperado.
5. Evitar que tests modifiquen logs versionados.
6. Ejecutar performance local despues de cambios en auth, catalogo u ordenes.

## Quality Gates Propuestos

| Cambio | Verificacion minima |
| --- | --- |
| Backend auth/security | `npm test -- tests/auth.test.js tests/authorization.test.js tests/ethical-hacking.test.js` |
| Backend ordenes | `npm test -- tests/orders.test.js tests/regression/pos-flow.test.js` |
| Backend caja | `npm test -- tests/cash.test.js tests/regression/pos-flow.test.js` |
| Frontend POS | `npm test -- --watchAll=false`, `npm run cypress:run` cuando el frontend esté levantado, y futuros tests de contexts/checkout |
| Release local | API `npm test`, frontend `npm test -- --watchAll=false`, build frontend si aplica |
