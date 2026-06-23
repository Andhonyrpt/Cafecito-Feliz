# Backlog Estructurado

Ultima revision: 2026-06-22.

Este backlog sale de la auditoria documental, el codigo actual y las pruebas ejecutadas. No incluye funcionalidades inventadas.

## Epicas

| ID | Epica | Prioridad | Tipo |
| --- | --- | --- | --- |
| E1 | Normalizacion documental | Alto | Documentacion |
| E2 | Alineacion frontend/backend POS | Critico | Alineacion frontend/backend |
| E3 | Integridad de ordenes e inventario | Critico | Bug / Deuda tecnica |
| E4 | Caja confiable | Alto | Alineacion frontend/backend |
| E5 | Seguridad de sesion y tokens | Alto | Deuda tecnica |
| E6 | QA frontend y decision E2E | Medio | Deuda tecnica |
| E7 | Mantenibilidad frontend | Medio | Refactor |
| E8 | Contratos API consistentes | Medio | Refactor |

## Features y Tareas Priorizadas

### Critico

| Item | Clasificacion | Evidencia |
| --- | --- | --- |
| Definir backend como fuente de verdad de totales | Alineacion frontend/backend | `OrderContext` calcula totales y backend recalcula en preview/create |

### Alto

| Item | Clasificacion | Evidencia |
| --- | --- | --- |
| Consolidar o archivar `docs/SPECIFICATIONS.md` | Documentacion | `docs/PRODUCT_SPEC.md` es la fuente principal, pero `docs/SPECIFICATIONS.md` sigue existiendo como derivado historico |
| Consolidar resumen canonico de `docs/qa/` | Documentacion | Los `QA_BACKEND_*` ya estan en `docs/qa/`; falta decidir cuanto queda como canon vs evidencia historica |
| Mantener `cafecito-app/AGENTS.testing.md` alineado al POS | Documentacion | Cypress ya tiene smoke POS; la guia debe seguir el flujo real |
| Hidratar caja activa desde backend | Alineacion frontend/backend | Implementado en `SessionContext`; mantener regresion y uso consistente |
| Prevenir multiples cajas abiertas por usuario si aplica | Bug | No se evidencio bloqueo | 
| Decidir e implementar revocacion de refresh token | Seguridad | Logout responde exito, pero no invalida refresh token persistente |
| Validar PIN en cierre de caja server-side o documentar decision | Seguridad | Frontend valida PIN antes de close; backend debe ser fuente si es regla critica |

### Medio

| Item | Clasificacion | Evidencia |
| --- | --- | --- |
| Revalidar spec real de stock insuficiente tras reiniciar API local | Deuda tecnica | El spec `pos-real-stock-insufficient.cy.js` ya existe, pero la API viva usada por Cypress seguia sin el ajuste nuevo de conexion Mongo |
| Crear tests frontend de servicios HTTP/token refresh | Deuda tecnica | Flujo de refresh aun sin cobertura dedicada |
| Normalizar paths de servicios frontend | Refactor | Hay rutas con y sin slash inicial |
| Reemplazar `alert()` por estados UI | Refactor | UX/error handling inconsistente |
| Revisar cache de productos ante cambios externos | Bug potencial | Cache dura 5 minutos y se limpia solo en algunos flujos |
| Uniformar contratos de respuesta API | Refactor | Endpoints devuelven documentos directos o wrappers distintos |

### Bajo

| Item | Clasificacion | Evidencia |
| --- | --- | --- |
| Renombrar `orderSevice.js` a `orderService.js` | Refactor | Typo mantenido por imports actuales |
| Limpiar logs debug en caja | Deuda tecnica | Tests muestran logs de `openCashSession` |
| Revisar prefijo de `storageService` | Refactor | Keys como `cafecitoorder` no tienen separador |

## Historias Iniciales

### US-001 - Documentacion vigente

Como desarrollador nuevo quiero una spec consolidada para continuar el desarrollo sin depender de documentos contradictorios.

Aceptacion:
- Existe spec vigente.
- Existe indice maestro y gobernanza documental.
- Docs obsoletas estan marcadas, actualizadas o archivadas.
- README apunta a docs finales.

Prioridad: Alto. Estado actual: Parcial; `docs/INDEX.md` y `docs/GOVERNANCE.md` ya existen.

### US-002 - Total final desde backend

Como vendedor quiero que el total final venga del backend para evitar cobrar un monto distinto al registrado.

Aceptacion:
- Checkout ejecuta `previewOrder()` antes de confirmar.
- Modal muestra total backend como total final.
- Totales locales se alinean o se etiquetan como estimados.

Prioridad: Critico. Estado actual: Parcial.

### US-003 - Ordenes por cliente

Como vendedor o admin quiero consultar ordenes de un cliente para revisar historial y compras acumuladas.

Aceptacion:
- `GET /api/orders/client/:clientId` responde sin error.
- Frontend usa `/orders/client/:clientId`.
- Hay test de regresion.

Prioridad: Alto. Estado actual: Corregido en API y servicio frontend; mantener test de regresion.

### US-004 - Caja confiable

Como vendedor quiero que mi caja activa venga de una fuente confiable para evitar cierres incorrectos o duplicados.

Aceptacion:
- Backend puede indicar caja abierta.
- No hay doble apertura si la regla lo prohibe.
- Frontend no depende solo de localStorage.

Prioridad: Alto. Estado actual: Parcial; `SessionContext` ya hidrata sesion activa desde backend.

### US-005 - Ordenes consistentes

Como negocio quiero que orden, stock y cliente se actualicen de forma consistente para evitar ventas imposibles o datos corruptos.

Aceptacion:
- Ordenes concurrentes no dejan stock negativo.
- Fallos no dejan actualizaciones parciales.
- `orderNumber` no se duplica.

Prioridad: Critico. Estado actual: Parcial; creacion de orden ya usa transaccion y `orderNumber` atomico.

### US-006 - Logout seguro

Como empleado quiero que cerrar sesion invalide mi sesion real para que nadie reutilice mi refresh token.

Aceptacion:
- Decision sobre revocacion documentada.
- Si aplica, refresh post-logout falla.
- Tests de seguridad pasan.

Prioridad: Alto. Estado actual: Parcial.
