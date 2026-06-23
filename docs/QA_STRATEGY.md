# QA Strategy

Ultima revision: 2026-06-22.

## Estado Actual Verificado

| Paquete | Comando | Resultado observado |
| --- | --- | --- |
| API | `npm run test:coverage` desde `cafecito-api/` | 17 suites passed, 158 tests passed; coverage thresholds verdes, branch coverage global 66.39% |
| Frontend unit/component | `npm test -- --watchAll=false` desde `cafecito-app/` | 5 suites passed, 9 tests passed |
| Frontend E2E mockeado | `npm run cypress:run` desde `cafecito-app/` | 4 specs passed, 4 tests passed |
| Frontend E2E real local | `npm run seed:e2e`, API/frontend vivos, `npm run cypress:run:real` | 2 specs passed, 2 tests passed contra backend/Mongo local; hay un spec nuevo de stock insuficiente agregado, pendiente de revalidar tras reiniciar la API con la nueva cadena Mongo |

## Backend

Stack de pruebas:
- Jest 30.
- Supertest.
- MongoMemoryReplSet, porque la creación de órdenes usa transacciones MongoDB.
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
- Hay logs debug en controladores de caja.
- El runtime local con Mongo viva debe reiniciarse después de cambios de conexión para revalidar E2E reales de órdenes.

## Frontend

Stack de pruebas:
- Create React App / Jest.
- `src/App.test.js`.
- `src/components/molecules/ClientSelector/ClientSelector.test.jsx`.
- `src/components/organisms/OrderPanel/OrderPanel.test.jsx`.
- `src/context/OrderContext.test.jsx`.
- `src/context/SessionContext.test.jsx`.
- Cypress con specs POS mockeados en `cypress/e2e/` y specs backend-real en `cypress/e2e-real/`.

Comando no interactivo:
- `npm test -- --watchAll=false`
- `npm run cypress:open`
- `npm run cypress:run`
- `npm run cypress:run:real`
- `npm run e2e`

Gaps frontend:
- Sin tests para servicios HTTP/token refresh.
- Cypress real de stock insuficiente ya tiene spec, pero falta revalidar el runtime local tras reiniciar la API.
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
2. Agregar tests frontend unit/integration para servicios HTTP/token refresh.
3. Revalidar Cypress backend-real tras reiniciar la API local con la nueva configuración Mongo.
4. Separar tests que documentan bugs de tests de comportamiento esperado.
5. Evitar que tests modifiquen logs versionados.
6. Ejecutar performance local despues de cambios en auth, catalogo u ordenes.

## Quality Gates Propuestos

| Cambio | Verificacion minima |
| --- | --- |
| Backend auth/security | `npm test -- tests/auth.test.js tests/authorization.test.js tests/ethical-hacking.test.js` |
| Backend ordenes | `npm test -- tests/orders.test.js tests/regression/pos-flow.test.js` |
| Backend caja | `npm test -- tests/cash.test.js tests/regression/pos-flow.test.js` |
| Frontend POS | `npm test -- --watchAll=false`, `npm run cypress:run` cuando el frontend esté levantado, y tests de contexts/checkout |
| Release local | API `npm test`, frontend `npm test -- --watchAll=false`, build frontend si aplica |
