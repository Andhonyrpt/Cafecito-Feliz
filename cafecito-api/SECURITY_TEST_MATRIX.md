# API Security Test Matrix

## Uso

- Ejecutar esta matriz desde `cafecito-api/` con Jest/Supertest.
- Priorizar primero `Critical` y `High`.
- Mantener los casos `Low` como opcionales salvo que cambie el contexto de riesgo.
- Cada caso debe tener un test automatizado o una razón documentada si queda manual.

## Estado

- `Observed vulnerable`: comportamiento inseguro confirmado en pruebas.
- `Needs test`: caso identificado, falta automatizar o ejecutar.
- `Needs fix`: caso con riesgo confirmado que requiere remediación.
- `Fixed pending regression`: fix aplicado, falta prueba final.
- `Passed`: control verificado.
- `Optional`: baja prioridad.

## Matriz Crítica Y Alta Prioridad

| ID | Prioridad | Riesgo | Endpoint / Área | Estrategia De Ataque | Resultado Seguro Esperado | Estado | Prueba Sugerida |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-AUTH-001 | Critical | Self-register admin | `POST /api/auth/register` | Enviar `role: "admin"`, iniciar sesión y llamar `GET /api/users`. | Registro público no existe, requiere admin, o fuerza rol no-admin. | Passed | `tests/ethical-hacking.test.js` |
| SEC-AUTH-002 | Critical | Acceso admin con token autoconcedido | Admin-only routes | Usar token obtenido por self-register admin contra `/api/users`, `/api/products`, `/api/categories`. | Token de usuario auto-registrado no debe tener rol admin. | Passed | `tests/ethical-hacking.test.js`, `tests/authorization.test.js` |
| SEC-AUTH-003 | High | Enumeración de rol | `GET /api/auth/check-role/:employeeId` | Probar `EMP-*` conocidos/desconocidos y comparar respuestas. | Endpoint protegido, eliminado o respuesta genérica sin revelar rol. | Passed | `auth.security.test.js`, `coverage-extras.test.js` |
| SEC-AUTH-004 | High | Enumeración de PIN/usuario | `POST /api/auth/verify-pin` | Comparar empleado inexistente vs PIN incorrecto vs PIN correcto. | Respuesta genérica para credenciales inválidas y rate limit. | Passed | `auth.security.test.js`, `coverage-extras.test.js` |
| SEC-AUTH-005 | High | Brute force de login | `POST /api/auth/login` | Repetir intentos fallidos para mismo `employeeId` e IP. | Rate limit o bloqueo temporal. | Needs test | `auth.security.test.js` |
| SEC-AUTH-006 | High | Brute force de PIN | `POST /api/auth/verify-pin` | Repetir PINs secuenciales para mismo empleado. | Rate limit o bloqueo temporal. | Needs test | `auth.security.test.js` |
| SEC-TOKEN-001 | High | Token válido de usuario desactivado | `authMiddleware` | Emitir token, desactivar usuario, reutilizar token. | `401` o `403`; usuario desactivado no accede. | Passed | `tests/unit/authMiddlewares.test.js`, `authorization.test.js` |
| SEC-TOKEN-002 | High | Token de usuario inexistente | `authMiddleware` | Firmar token válido con `userId` inexistente. | `401` o `403`; middleware verifica existencia. | Passed | `tests/unit/authMiddlewares.test.js` |
| SEC-TOKEN-003 | High | Refresh de usuario desactivado | `POST /api/auth/refresh` | Emitir refresh, desactivar usuario, refrescar. | Refresh rechazado. | Passed | `auth.test.js` |
| SEC-TOKEN-004 | High | Refresh sin revocación | `POST /api/auth/logout`, `POST /api/auth/refresh` | Hacer logout y reusar refresh token. | Refresh token revocado o token version invalidado. | Needs test | `authorization.security.test.js` |
| SEC-ERR-001 | High | Stack trace en preview | `POST /api/orders/preview` | Enviar `client: "not-a-mongo-id"`. | `422` o error genérico sin `stack`. | Passed | `errors.security.test.js`, `ethical-hacking.test.js` |
| SEC-ERR-002 | High | Detalles internos de Mongo | Duplicados únicos | Crear duplicados de usuario/categoría/producto/cliente. | Respuesta segura sin colección, índice ni stack. | Needs test | `errors.security.test.js` |
| SEC-NOSQL-001 | High | NoSQL injection en login | `POST /api/auth/login` | Enviar `employeeId: { "$ne": null }`. | `422`, tipo inválido. | Passed | `ethical-hacking.test.js` |
| SEC-NOSQL-002 | High | NoSQL injection en verify-pin | `POST /api/auth/verify-pin` | Enviar operadores Mongo en `employeeId` o `password`. | `422`, tipo inválido. | Passed | `ethical-hacking.test.js` |
| SEC-NOSQL-003 | High | Operadores Mongo en IDs | Body/params/query ObjectId | Enviar objetos en `client`, `productId`, `categoryId`. | `422`, tipo inválido antes de Mongoose. | Passed | `ethical-hacking.test.js`, `orders.test.js` |
| SEC-ORDER-001 | High | Manipulación de totales | `POST /api/orders` | Enviar `price`, `subtotal`, `discount`, `tax`, `totalPrice` falsos. | Backend ignora totales del cliente y recalcula. | Needs test | `orders.security.test.js` |
| SEC-ORDER-002 | High | Stock negativo por carrera | `POST /api/orders` | Crear órdenes simultáneas contra stock bajo. | Stock nunca queda negativo; una orden falla limpiamente. | Needs test | `orders.security.test.js` |
| SEC-ORDER-003 | High | Preview con cliente inválido | `POST /api/orders/preview` | Enviar `client` inválido o inexistente. | `422` para formato inválido, comportamiento definido para inexistente. | Passed | `orders.security.test.js`, `ethical-hacking.test.js` |
| SEC-CASH-001 | High | Token antiguo cierra caja | `/api/total-cash/*` | Usar token de usuario desactivado para abrir/cerrar caja. | Rechazo por usuario desactivado. | Needs test | `cash.security.test.js` |

## Matriz De Prioridad Media

| ID | Prioridad | Riesgo | Endpoint / Área | Estrategia De Ataque | Resultado Seguro Esperado | Estado | Prueba Sugerida |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-HARD-001 | Medium | Falta Helmet | `server.js` | Revisar headers de seguridad. | Headers básicos presentes cuando se instale Helmet. | Passed | `server.js`, `npm test` |
| SEC-HARD-002 | Medium | Payload JSON grande | `server.js` | Enviar body grande a endpoints JSON. | Límite explícito y respuesta controlada. | Passed | `server.js`, `npm test` |
| SEC-HARD-003 | Medium | CORS permisivo/mal configurado | `server.js` | Probar origins permitidos/no permitidos. | Solo origins configurados aceptados. | Needs test | `hardening.security.test.js` |
| SEC-HARD-004 | Medium | Logs con datos sensibles | Controladores y error handler | Forzar errores y revisar logs por PIN/password/token. | Logs sin secretos ni credenciales. | Needs test/manual review | Manual + `errors.security.test.js` |
| SEC-HARD-005 | Medium | Brute force auth | `POST /api/auth/login`, `POST /api/auth/verify-pin`, `POST /api/auth/refresh` | Repetir intentos por IP y empleado/refresh. | 429 tras superar el umbral suave configurado. | Passed | `tests/unit/rateLimit.test.js` |
| SEC-DEPS-001 | Medium | Dependencia vulnerable `qs` | Dependencies | Ejecutar `npm audit --omit=dev`. | Sin vulnerabilidades prod conocidas. | Passed | `npm audit --omit=dev` |
| SEC-CLIENT-001 | Medium | Enumeración de email | `GET /api/clients/check-email` | Probar emails y observar `taken`. | Aceptado si es requerimiento; si no, proteger o limitar. | Needs decision | `client.security.test.js` |
| SEC-SEARCH-001 | Medium | Regex costosa en clientes | `GET /api/clients/search` | Enviar búsqueda larga o patrones especiales. | Longitud limitada y regex escapada. | Needs test | `nosql.security.test.js` |
| SEC-CAT-001 | Medium | Bug en búsqueda categoría | `GET /api/categories/search` | Probar `q` y paginación. | Consulta segura y funcional, sin errores internos. | Needs test | `category.security.test.js` |

## Opcionales / Baja Prioridad

| ID | Prioridad | Riesgo | Endpoint / Área | Estrategia De Ataque | Resultado Seguro Esperado | Estado | Prueba Sugerida |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-LOW-001 | Low | Fuzzing amplio | Toda la API | Payloads aleatorios por endpoint. | Sin 500 inesperados ni leaks. | Optional | Fuzzer externo o Jest parametrizado |
| SEC-LOW-002 | Low | Timing auth | Login/PIN | Medir diferencias usuario inexistente vs password inválido. | Diferencias no útiles para enumeración. | Optional | Manual/performance test |
| SEC-LOW-003 | Low | Consistencia de mensajes | Toda la API | Revisar mensajes ES/EN y códigos. | Mensajes consistentes y no reveladores. | Optional | Manual review |
| SEC-LOW-004 | Low | DoS por arrays grandes | `/api/orders`, `/api/orders/preview` | Enviar miles de productos. | Límite de tamaño/cantidad. | Optional | `orders.security.test.js` |
| SEC-LOW-005 | Low | SAST | Código API | Ejecutar Semgrep/CodeQL si se adopta. | Sin findings críticos. | Optional | Tooling externo |
| SEC-LOW-006 | Low | Dependencias dev-only | Dev dependencies | Ejecutar audit completo. | Riesgos dev conocidos documentados. | Optional | `npm audit` |

## Estado Resumido

- Completado: hardening de auth, validaciones anti NoSQL, control de acceso, `helmet`, body limit, rate limiting y auditoria de produccion.
- Pendiente: revocacion real de refresh tokens, pruebas dedicadas de brute force, prueba de caja con token antiguo y casos manuales/decididos de la matriz.
- Fuera de produccion: `js-yaml` sigue apareciendo en tooling de test; queda documentado como pendiente de dev-only.

## Orden Recomendado De Ejecución

1. `SEC-AUTH-001`, `SEC-AUTH-002`.
2. `SEC-AUTH-003`, `SEC-AUTH-004`, `SEC-AUTH-005`, `SEC-AUTH-006`.
3. `SEC-ERR-001`, `SEC-ERR-002`.
4. `SEC-TOKEN-*`.
5. `SEC-NOSQL-*`.
6. `SEC-ORDER-*`, `SEC-CASH-001`.
7. Hardening y dependencias.
8. Opcionales de baja prioridad.

## Comandos

```bash
npm test
npm test -- tests/ethical-hacking.test.js
npm audit --omit=dev
```

Ejecutar siempre desde `cafecito-api/`.
