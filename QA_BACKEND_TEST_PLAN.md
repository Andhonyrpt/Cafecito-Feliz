# Plan QA Backend

## Objetivo

Definir un plan robusto y trazable para pruebas unitarias e integración del backend `cafecito-api`, cubriendo riesgos funcionales, seguridad, reglas de negocio, errores y regresión.

## Estado Actual

- Framework actual: Jest + Supertest + `mongodb-memory-server`.
- Configuración: `cafecito-api/jest.config.js`.
- Comandos disponibles: `npm test`, `npm run test:watch`, `npm run test:coverage`.
- Suite actual: pruebas de integración por módulo y un archivo de cobertura adicional.
- Umbral actual de coverage: 80% para statements, lines y functions.
- Branch coverage actual queda por debajo del 80%, por lo que no debe usarse aún como quality gate obligatorio.

## Deficiencias Detectadas

- La mayoría de pruebas son integración end-to-end por endpoint; casi no hay unitarias puras de controladores, middlewares, validadores y utilidades.
- Existen pruebas que comparten estado dentro del archivo mediante `beforeAll`, lo que dificulta aislar fallos y reordenar casos.
- Hay setup repetido para usuarios, tokens, categorías, productos y clientes; falta una capa de factories/helpers.
- La cobertura subió con pruebas amplias de ramas, pero algunos tests verifican comportamientos actuales de error que deberían convertirse en bugs o decisiones explícitas de producto.
- Falta matriz formal de regresión por endpoint con prioridad, tipo de prueba, datos y resultado esperado.
- Falta separación clara entre smoke, integración crítica, unitarias rápidas y pruebas de regresión completa.
- No hay pruebas negativas exhaustivas de autorización para todos los endpoints protegidos.
- No hay pruebas específicas de seguridad para JWT inválido, token expirado, payload manipulado o roles insuficientes en cada recurso.
- No hay pruebas directas de middlewares globales (`errorHandler`, `globalerrorHandler`) salvo cobertura indirecta.
- No hay pruebas de concurrencia o integridad transaccional para stock y creación de órdenes.
- No hay pruebas documentadas para performance básica, paginación masiva o límites de datos.

## Estrategia de Pruebas

### Nivel 1: Unitarias

Objetivo: probar lógica aislada sin levantar Express ni Mongo real.

Alcance recomendado:

- `utils/orderHelper.js`: cálculos de subtotal, descuento, IVA y total.
- `middlewares/validators.js`: validadores por campo con payloads válidos e inválidos.
- `middlewares/authMiddleware.js`: token ausente, inválido, válido, malformed Bearer.
- `middlewares/isAdminMiddleware.js`: admin permitido, rol no admin rechazado, `req.user` ausente.
- Controladores con modelos mockeados para ramas de error difíciles de disparar por integración.

Convención sugerida:

- Ubicación: `tests/unit/**/*.test.js`.
- Usar mocks de Mongoose y helpers `mockReqResNext()`.
- No depender de `mongodb-memory-server`.

### Nivel 2: Integración API

Objetivo: validar endpoints reales con Express, middlewares, validaciones, modelos y Mongo en memoria.

Alcance recomendado:

- Todos los endpoints bajo `/api`.
- Rutas base `/` y `/health`.
- Validaciones `422`.
- Autorización `401`/`403`.
- Not found `404`.
- Flujos de negocio multi-entidad: orden, stock, cliente, caja.

Convención sugerida:

- Ubicación: `tests/integration/**/*.test.js` o mantener `tests/*.test.js` y migrar gradualmente.
- Usar factories para datos.
- Cada test debe crear sus propios prerequisitos o declararlos en `beforeEach` local.

### Nivel 3: Regresión Crítica

Objetivo: proteger flujos principales de negocio.

Estado: flujo POS completo implementado en `tests/regression/pos-flow.test.js`.

Suite mínima:

- Login vendedor/admin.
- Apertura de caja vendedor.
- Listado de categorías/productos.
- Creación de cliente.
- Preview de orden.
- Creación de orden y descuento de stock.
- Cierre de caja.
- Cambio de estado de orden.

Convención sugerida:

- Ubicación: `tests/regression/pos-flow.test.js`.
- Ejecutar siempre antes de merge/release.

## Matriz de Pruebas

| ID | Módulo | Escenario | Tipo | Prioridad | Estado |
| --- | --- | --- | --- | --- | --- |
| AUTH-001 | Auth | Registro válido | Integración | Alta | Cubierto |
| AUTH-002 | Auth | Registro duplicado | Integración | Media | Cubierto |
| AUTH-003 | Auth | Login válido | Integración | Alta | Cubierto |
| AUTH-004 | Auth | Login usuario inexistente | Integración | Alta | Parcial |
| AUTH-005 | Auth | Login password inválido | Integración | Alta | Cubierto |
| AUTH-006 | Auth | Refresh token válido | Integración | Alta | Cubierto |
| AUTH-007 | Auth | Refresh token ausente/inválido/expirado | Integración | Alta | Parcial |
| AUTH-008 | Auth | Verify PIN válido, inválido, usuario inactivo | Integración | Alta | Cubierto |
| AUTH-009 | Auth | JWT manipulado/expirado en endpoint protegido | Integración | Alta | Cubierto |
| USER-001 | Users | Perfil autenticado | Integración | Alta | Cubierto |
| USER-002 | Users | Perfil sin token | Integración | Alta | Cubierto |
| USER-003 | Users | Listado admin con filtros/paginación | Integración | Media | Cubierto |
| USER-004 | Users | Listado con rol no admin | Integración | Alta | Cubierto |
| USER-005 | Users | Crear usuario admin | Integración | Alta | Cubierto |
| USER-006 | Users | Crear usuario duplicado | Integración | Media | Cubierto |
| USER-007 | Users | Update parcial y payload vacío | Integración | Media | Cubierto |
| USER-008 | Users | Toggle status usuario inexistente | Integración | Media | Cubierto |
| CAT-001 | Categories | Crear categoría admin | Integración | Alta | Cubierto |
| CAT-002 | Categories | Crear sin nombre | Integración | Alta | Cubierto |
| CAT-003 | Categories | Listado simple y paginado | Integración | Media | Cubierto |
| CAT-004 | Categories | Obtener por ID | Integración | Alta | Cubierto |
| CAT-005 | Categories | Update válido, vacío e inexistente | Integración | Media | Parcial |
| CAT-006 | Categories | Delete válido e inexistente | Integración | Media | Cubierto |
| CAT-007 | Categories | Search con `q`, parentCategory, sort, order, page, limit | Integración | Media | Pendiente |
| PROD-001 | Products | Crear producto admin | Integración | Alta | Cubierto |
| PROD-002 | Products | Crear sin categoría requerida | Integración | Alta | Cubierto |
| PROD-003 | Products | Crear precio/stock inválido | Integración | Alta | Parcial |
| PROD-004 | Products | Listado simple, paginado y por categoría | Integración | Alta | Cubierto |
| PROD-005 | Products | Obtener por ID válido/inexistente | Integración | Alta | Cubierto |
| PROD-006 | Products | Update parcial, vacío e inexistente | Integración | Alta | Parcial |
| PROD-007 | Products | Delete válido/inexistente | Integración | Media | Cubierto |
| CLIENT-001 | Clients | Crear cliente válido | Integración | Alta | Cubierto |
| CLIENT-002 | Clients | Crear email inválido/duplicado | Integración | Alta | Cubierto |
| CLIENT-003 | Clients | Check email tomado/no tomado | Integración | Media | Cubierto |
| CLIENT-004 | Clients | Search con y sin término | Integración | Media | Cubierto |
| CLIENT-005 | Clients | Update válido, vacío, inexistente | Integración | Media | Cubierto |
| ORDER-001 | Orders | Preview válido | Integración | Alta | Cubierto |
| ORDER-002 | Orders | Preview producto inexistente | Integración | Alta | Cubierto |
| ORDER-003 | Orders | Preview con cliente y descuento | Integración | Alta | Pendiente |
| ORDER-004 | Orders | Crear orden válida | Integración | Alta | Cubierto |
| ORDER-005 | Orders | Crear orden sin productos | Integración | Alta | Cubierto |
| ORDER-006 | Orders | Crear orden con stock insuficiente | Integración | Alta | Cubierto |
| ORDER-007 | Orders | Rollback de stock si falla creación | Integración/Unit | Alta | Pendiente |
| ORDER-008 | Orders | Listar pendientes | Integración | Media | Cubierto |
| ORDER-009 | Orders | Obtener por ID y por cliente | Integración | Media | Parcial |
| ORDER-010 | Orders | Actualizar status y bloquear terminales | Integración | Alta | Cubierto |
| CASH-001 | Cash | Abrir caja vendedor | Integración | Alta | Cubierto |
| CASH-002 | Cash | Abrir caja admin | Integración | Media | Cubierto |
| CASH-003 | Cash | Abrir caja sin/invalid initialCash | Integración | Alta | Cubierto |
| CASH-004 | Cash | Obtener total por turno | Integración | Alta | Cubierto |
| CASH-005 | Cash | Obtener total sin openedAt | Integración | Media | Cubierto |
| CASH-006 | Cash | Cerrar caja vendedor con sesión abierta | Integración | Alta | Cubierto |
| CASH-007 | Cash | Cerrar caja vendedor sin sesión abierta | Integración | Alta | Cubierto |
| CASH-008 | Cash | Cerrar con descuadre y motivo | Integración | Alta | Cubierto |
| MW-001 | Middlewares | Auth token válido/inválido/ausente | Unit/Integración | Alta | Cubierto |
| MW-002 | Middlewares | IsAdmin admin/no admin/sin user | Unit | Alta | Cubierto |
| MW-003 | Middlewares | Error handler 4xx/5xx/log write failure | Unit | Media | Pendiente |
| VAL-001 | Validators | Validadores de auth/users/products/orders/cash | Unit | Media | Pendiente |

## Plan de Implementación

### Fase 1: Ordenar infraestructura de tests

- Crear `tests/helpers/factories.js` para usuarios, categorías, productos, clientes y órdenes.
- Crear `tests/helpers/auth.js` para registrar/login y generar tokens de admin/vendedor.
- Crear `tests/helpers/http.js` para helpers de Supertest comunes.
- Revisar si `afterEach` debe limpiar colecciones por archivo o si cada suite maneja aislamiento local.

Entregable: helpers reutilizables y tests actuales migrados parcialmente.

### Fase 2: Unitarias críticas

- Agregar unitarias de `orderHelper`.
- Agregar unitarias de `authMiddleware` e `isAdminMiddleware`.
- Agregar unitarias de validadores más propensos a regresión: MongoId, PIN, email, cantidad, precio, caja, estado de orden.

Entregable: suite rápida de unitarias sin Mongo.

### Fase 3: Integración por dominio

- Reorganizar pruebas por dominio y completar matriz pendiente.
- Agregar casos negativos de autorización por endpoint protegido.
- Agregar pruebas de duplicados y errores de Mongoose esperados.
- Completar flujos de cash con descuadre y cierre sin sesión.

Entregable: matriz de endpoints completa con estado `Cubierto` o `No aplica`.

### Fase 4: Flujos transversales

- Crear flujo POS completo: login, caja, catálogo, cliente, preview, orden, stock, cierre.
- Crear flujo admin: login admin, CRUD usuarios, CRUD categorías, CRUD productos.
- Crear pruebas de integridad: stock no negativo, cliente incrementa `totalPurchaseCount`, orden guarda totales del backend.

Entregable: pruebas de regresión crítica.

### Fase 5: Quality gates

- Mantener umbral mínimo actual: statements 80, lines 80, functions 80.
- Subir branch coverage progresivamente: 65 completado -> 70 -> 75 -> 80.
- Agregar script CI para `npm test` y `npm run test:coverage` cuando exista pipeline.

Entregable: quality gate estable y medible.

## Matriz de Ejecución

| Tipo | Comando | Cuándo ejecutarlo | Criterio de pase |
| --- | --- | --- | --- |
| Smoke API | `npm test -- tests/auth.test.js tests/products.test.js tests/orders.test.js` | Cambios pequeños de API | 100% tests passing |
| Unitarias | `npm test -- tests/unit` | Cambios en helpers, validators, middlewares | 100% tests passing |
| Integración módulo | `npm test -- tests/<modulo>.test.js` | Cambio focalizado por dominio | 100% tests passing |
| Regresión completa | `npm test` | Antes de merge | 100% tests passing |
| Cobertura | `npm run test:coverage` | Antes de release o cambios grandes | Statements/lines/functions >= 80%, branches >= 65% |
| Watch local | `npm run test:watch` | Desarrollo local | Primera corrida verde y sin fallos nuevos |

## Criterios de Aceptación QA

- Ningún endpoint protegido queda sin al menos una prueba de autorización negativa.
- Cada endpoint CRUD tiene pruebas de happy path, validación, no encontrado y permisos.
- Cada regla de negocio crítica tiene prueba directa: stock, descuentos, caja, status de orden, roles.
- Los tests no dependen de orden global entre archivos.
- Los datos de prueba se crean por helper/factory y evitan IDs hardcodeados reutilizados.
- La cobertura mínima configurada pasa localmente y en CI.
- Los casos que revelen bugs reales se registran como defecto o se corrigen; no se dejan como comportamiento deseado sin justificación.

## Seguimiento de Progreso

Actualizar esta tabla al implementar nuevas pruebas.

| Área | Cobertura funcional | Unitarias | Integración | Pendiente principal |
| --- | --- | --- | --- | --- |
| Auth | Alta | Media | Alta | Refresh inválido/expirado |
| Users | Media | Baja | Media | Validaciones completas y errores controlados para duplicados |
| Categories | Media | Baja | Media | Search avanzado |
| Products | Media | Baja | Media | Validaciones completas y errores controlados para duplicados |
| Clients | Alta | Baja | Alta | Contratos de respuesta y errores controlados para duplicados |
| Orders | Media | Baja | Media | Rollback, descuentos, errores profundos |
| Cash | Alta | Baja | Alta | Reducir ruido de logs y cubrir cálculos con ventas reales |
| Middlewares | Alta | Alta | Alta | Error handlers directos |
| Validators | Media | Media | Media | Completar validadores restantes por campo |

## Riesgos QA Actuales

- La suite puede pasar aunque existan ramas críticas sin cubrir, especialmente en errores y rollback.
- Branch coverage no está en 80%, por lo que decisiones condicionales aún tienen huecos.
- Algunas pruebas de integración actuales son largas y mezclan varios asserts; cuando fallen, el diagnóstico puede ser lento.
- La salida de test tiene ruido de `dotenv`, logs de caja y warnings Mongoose, lo que puede ocultar errores reales.
- La falta de factories aumenta probabilidad de datos duplicados o dependencias implícitas entre tests.
