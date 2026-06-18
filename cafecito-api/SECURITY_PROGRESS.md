# API Security Progress

## Proposito

Registro de progreso para las interacciones de seguridad sobre `cafecito-api`. Mantener este archivo actualizado cuando se investiguen riesgos, se creen pruebas, se apliquen remediaciones o se ejecuten verificaciones.

## Reglas De Trabajo

- No modificar `cafecito-api/AGENTS.md` ni `cafecito-app/AGENTS.md` salvo pedido explicito.
- Ejecutar comandos de API desde `cafecito-api/`.
- Preferir pruebas automatizadas con Jest/Supertest/MongoMemoryServer.
- Documentar hallazgo, evidencia, estado y siguiente accion.
- Marcar los riesgos bajos como opcionales salvo que el usuario los suba de prioridad.

## Estado Actual

### Completado

- Bloqueo de self-register admin: `POST /api/auth/register` fuerza `role = 'vendedor'`.
- Proteccion de `GET /api/auth/check-role/:employeeId` con token.
- Proteccion de `POST /api/auth/verify-pin` con token.
- Validacion de `client` en `POST /api/orders/preview`.
- `previewOrder` ya no expone `stack` y delega errores con `next(err)`.
- `authMiddleware` valida usuario existente y activo.
- `login` y `refresh` rechazan usuarios inactivos.
- Endurecimiento anti NoSQL injection en validadores sensibles.
- Rate limiting suave en `login`, `verify-pin` y `refresh`.
- `helmet()` y `express.json({ limit: '100kb' })` en `server.js`.
- Pruebas de seguridad, regresion y cobertura completadas.
- `npm audit --omit=dev` ya no reporta vulnerabilidades de produccion.

### Pendiente

- `SEC-TOKEN-004`: revocacion real de refresh tokens al logout.
- `SEC-ERR-002`: uniformar mensajes de duplicados unicos si se decide hacerlo.
- `SEC-AUTH-005` y `SEC-AUTH-006`: pruebas especificas de brute force con expectativa de 429 o bloqueo.
- `SEC-CASH-001`: prueba de token antiguo en caja.
- `SEC-CLIENT-001`, `SEC-SEARCH-001` y `SEC-CAT-001`: casos de matriz que siguen pidiendo decision o test dedicado.
- `SEC-LOW-*`: fuzzing, timing tests, SAST y revision de dependencias dev-only.
- `js-yaml` en tooling de test sigue reportado por `npm audit`; no afecta produccion.

## 2026-06-17 - Contexto E Instrucciones Del Repo

Estado: completado.

Trabajo realizado:
- Se reviso contexto raiz y de paquetes para crear/actualizar `AGENTS.md` raiz.
- Se respetaron `cafecito-api/AGENTS.md` y `cafecito-app/AGENTS.md`; solo se leyeron para contexto.
- Se actualizo `AGENTS.md` raiz con detalles de paquetes, comandos, API, frontend e instruction files existentes.

Archivos relacionados:
- `AGENTS.md`

Notas:
- El usuario aclaro que prefiere informacion mas explicada, no compactada.
- El usuario aclaro que se pueden leer los agents internos, pero no modificarlos.

## 2026-06-17 - Revision De Seguridad Inicial API

Estado: completado.

Trabajo realizado:
- Se revisaron rutas, middlewares, controladores, validadores y modelos de `cafecito-api`.
- Se identificaron riesgos criticos y altos en autenticacion, autorizacion, errores y validacion.
- Se creo una suite de pruebas controladas de hacking etico.

Hallazgos confirmados:
- `POST /api/auth/register` permite registrar usuario publico con `role: "admin"`.
- El usuario auto-registrado como admin puede iniciar sesion y acceder a rutas admin como `GET /api/users`.
- `GET /api/auth/check-role/:employeeId` permite enumerar roles sin autenticacion.
- `POST /api/auth/verify-pin` permite distinguir usuario inexistente vs PIN incorrecto.
- `POST /api/orders/preview` puede devolver `stack` y paths internos si recibe `client` invalido.
- `npm audit --omit=dev` reporta 1 vulnerabilidad moderada en `qs`.

Archivos creados:
- `cafecito-api/tests/ethical-hacking.test.js`

Comandos ejecutados:
- `npm test -- tests/ethical-hacking.test.js`
- `npm test`
- `npm audit --omit=dev`

Resultados:
- `npm test -- tests/ethical-hacking.test.js`: 3 tests pasando, confirma comportamiento vulnerable actual.
- `npm test`: 16 suites pasando, 118 tests pasando.
- `npm audit --omit=dev`: 1 vulnerabilidad moderada en `qs`.

Pendiente recomendado:
- Aplicar remediaciones criticas empezando por self-register admin.
- Convertir las pruebas de comportamiento vulnerable en pruebas de seguridad esperada una vez corregido el codigo.
- Resolver o evaluar `npm audit fix` para `qs`.

## 2026-06-17 - Plan Y Matriz De Seguridad API

Estado: completado.

Trabajo realizado:
- Se creo un plan formal de pruebas de seguridad para `cafecito-api`.
- Se creo una matriz de pruebas con prioridad, estrategia de ataque, resultado esperado, estado y prueba sugerida.
- Se separaron riesgos criticos/altos de riesgos medios y opcionales/baja prioridad.

Archivos creados:
- `cafecito-api/SECURITY_TEST_PLAN.md`
- `cafecito-api/SECURITY_TEST_MATRIX.md`
- `cafecito-api/SECURITY_PROGRESS.md`

Siguiente accion recomendada:
- Fase 1 de remediacion: bloquear self-register admin, proteger/eliminar `check-role`, endurecer `verify-pin`, quitar stack traces de `previewOrder` y validar `client` en `/api/orders/preview`.

## 2026-06-17 - Fase 1 Iniciada: Registro Publico Sin Admin

Estado: completado para `SEC-AUTH-001` y `SEC-AUTH-002`.

Decision aplicada:
- El registro publico ignora cualquier `role` enviado por el cliente y fuerza `role = 'vendedor'`.

Cambios realizados:
- `src/controllers/authController.js`: `register` ya no toma `role` desde `req.body`; define `const role = 'vendedor'` antes de crear/responder el usuario.
- `tests/ethical-hacking.test.js`: el caso de self-register admin ahora espera comportamiento seguro: registro como `vendedor` y `403` al acceder a `GET /api/users`.
- `SECURITY_TEST_MATRIX.md`: `SEC-AUTH-001` y `SEC-AUTH-002` marcados como `Passed`.

Verificacion ejecutada:
- `npm test -- tests/ethical-hacking.test.js tests/auth.test.js tests/authorization.test.js`
- `npm test -- tests/coverage-extras.test.js tests/auth.test.js tests/ethical-hacking.test.js`
- `npm test`

Resultado:
- 3 suites pasando.
- 49 tests pasando.
- 4 suites pasando.
- 57 tests pasando.
- Full API suite: 16 suites pasando, 118 tests pasando.

Recomendacion sobre `orderController.previewOrder`:
- No mantener respuestas `res.status(500).json({ message: err.message, stack: err.stack })` en la API.
- Motivo: filtra paths internos, detalles de Mongoose y stack traces; ademas, responder y luego llamar `next(err)` deja al `errorHandler` sin capacidad de formatear la respuesta porque los headers ya fueron enviados.
- Recomendacion concreta: validar `client` en la ruta con `bodyMongoIdValidation('client', 'Client ID', true)` y en el catch usar solo `next(err)` para que `errorHandler` controle logging y respuesta.

Impacto pendiente en frontend:
- `cafecito-app/src/components/CashSession/CashSession.jsx` llama `checkEmployeeRole()` antes de login.
- Como `GET /api/auth/check-role/:employeeId` ahora requiere `Authorization`, ese flujo necesita un ajuste de UX o de autenticacion previa para seguir funcionando.

Pendiente siguiente en Fase 1:
- `SEC-AUTH-003`: proteger/eliminar `GET /api/auth/check-role/:employeeId`. Estado: completado.
- `SEC-AUTH-004`: endurecer `POST /api/auth/verify-pin` con autenticacion previa. Estado: completado.
- `SEC-ERR-001`: remover stack trace de `previewOrder`. Estado: completado.
- `SEC-ORDER-003`: validar `client` en `POST /api/orders/preview`. Estado: completado.

## 2026-06-17 - Fase 2 Iniciada: Usuario Activo Y Anti NoSQL Injection

Estado: completado.

Trabajo realizado:
- `src/middlewares/authMiddleware.js`: ahora valida que el usuario exista y siga activo en cada request autenticada.
- `src/controllers/authController.js`: `login` rechaza usuarios inactivos; `refresh` rechaza refresh tokens de usuarios inactivos.
- `src/middlewares/validators.js`: validadores sensibles ahora exigen tipo cadena antes de permitir `trim`, `matches`, `isMongoId` o `isURL`.
- `src/routes/authRoutes.js`: `GET /api/auth/check-role/:employeeId` usa validacion de `param` y sigue protegido.
- `tests/unit/authMiddlewares.test.js`: se agrego cobertura para token de usuario inactivo.
- `tests/auth.test.js`: se agrego cobertura para login y refresh con usuario inactivo.
- `tests/ethical-hacking.test.js`: se agregaron pruebas de NoSQL injection para login, `check-role` y `verify-pin`.

Verificacion ejecutada:
- `npm test -- tests/unit/authMiddlewares.test.js tests/auth.test.js tests/ethical-hacking.test.js tests/coverage-extras.test.js tests/authorization.test.js`
- `npm test`

Resultado:
- Suite focalizada: 5 suites pasando, 67 tests pasando.
- Full API suite: 16 suites pasando, 122 tests pasando.

Pendiente despues de Fase 2:
- `SEC-TOKEN-004`: revocacion real de refresh tokens al cerrar sesion.
- `SEC-ERR-002`: endurecer mensajes de duplicados unicos si se quiere uniformidad total.
- `SEC-HARD-*`: Helmet, rate limit y body size limits.

## 2026-06-17 - Fase 1 Complemento: Token Y Client En Preview

Estado: completado.

Trabajo realizado:
- `cafecito-app/src/services/auth.js`: `checkEmployeeRole()` ahora acepta y envía token en `Authorization`.
- `checkEmployeeRole()` devuelve `'error'` cuando falta token o falla la consulta, para que `CashSession` mantenga un fallback seguro.
- `cafecito-app/src/components/CashSession/CashSession.jsx`: el token actual de localStorage se pasa a `checkEmployeeRole()`.
- `cafecito-api/src/routes/orderRoutes.js`: `POST /api/orders/preview` ahora valida `client` con `bodyMongoIdValidation('client', 'Client ID', true)`.
- `cafecito-api/src/controllers/orderController.js`: `previewOrder` quedó con `next(err)` solamente en el catch.

Verificacion ejecutada:
- `npm test -- tests/auth.test.js tests/ethical-hacking.test.js tests/orders.test.js tests/coverage-extras.test.js`

Resultado:
- 4 suites pasando.
- 23 tests pasando.

Efecto en la app:
- El flujo de caja ahora manda token al consultar rol.
- `CashSession` ya no depende de una consulta pública a `check-role`.
- `previewOrder` ya no expone stacks y rechaza `client` invalido en validacion.

## Backlog De Remediacion

### Critico

- Bloquear self-register admin en `POST /api/auth/register`. Estado: completado.
- Impedir acceso admin usando usuarios auto-registrados. Estado: completado.

### Alto

- Proteger o eliminar `GET /api/auth/check-role/:employeeId`. Estado: completado.
- Endurecer `POST /api/auth/verify-pin` con autenticacion previa. Estado: completado.
- Quitar respuesta con `stack` en `previewOrder`. Estado: completado.
- Validar `client` en `POST /api/orders/preview`. Estado: completado.
- Verificar usuario existente y activo en `authMiddleware` y refresh. Estado: completado.
- Agregar pruebas anti NoSQL injection. Estado: completado.

### Medio

- Agregar Helmet. Estado: completado.
- Agregar rate limiting para auth. Estado: completado.
- Establecer limite explicito de body JSON. Estado: completado.
- Resolver `npm audit --omit=dev` para produccion. Estado: completado.
- Quitar logs debug de controladores sensibles.

## 2026-06-17 - Fase 4 Iniciada: Helmet Y Body Limit

Estado: completado.

Trabajo realizado:
- `server.js`: se agrego `helmet()` para headers de seguridad basicos.
- `server.js`: `express.json()` quedo con limite explicito de `100kb`.
- `helmet` se agrego a las dependencias del paquete `cafecito-api`.

Nota operativa:
- Si en el futuro un request legitimo del POS necesita mas tamaño, el body limit se puede subir de forma controlada.
- Este cambio no toca el flujo de negocio; solo rechaza payloads JSON excesivamente grandes.

Verificacion realizada:
- `npm test`
- Suite completa pasando despues de aplicar `helmet` y el body limit.

## 2026-06-17 - Fase 3 Iniciada: Rate Limiting Suave En Auth

Estado: completado.

Trabajo realizado:
- `src/middlewares/rateLimit.js`: se agrego un rate limiter simple en memoria.
- `src/routes/authRoutes.js`: `login`, `refresh` y `verify-pin` ahora tienen rate limiting suave.
- `register` no se limita por ahora porque no forma parte del flujo del POS y lo usas para alta manual de usuarios administrativos.
- `tests/unit/rateLimit.test.js`: se agrego cobertura directa del middleware.

Verificacion ejecutada:
- `npm test -- tests/unit/rateLimit.test.js tests/unit/authMiddlewares.test.js tests/auth.test.js tests/ethical-hacking.test.js tests/coverage-extras.test.js tests/authorization.test.js`
- `npm test`

Resultado:
- Suite focalizada: 6 suites pasando, 68 tests pasando.
- Full API suite: 16 suites pasando, 122 tests pasando.

Efecto:
- Se limita el brute force sobre login, PIN y refresh sin tocar rutas operativas del POS.
- `register` queda fuera del rate limit para no interferir con tu alta manual de usuarios.

### Opcional / Bajo

- Fuzzing amplio.
- Timing tests de auth.
- SAST con Semgrep/CodeQL.
- Revision de dependencias dev-only.
