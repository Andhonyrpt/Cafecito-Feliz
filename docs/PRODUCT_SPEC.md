# Product Spec

Ultima revision: 2026-06-22 (actualizada tras refactor de ordenes, sesion activa y tests).

Este spec describe el estado actual confirmado del sistema y los gaps para continuar el desarrollo. No asume que el producto esta terminado.

## Descripcion General

Cafecito Feliz es un POS para cafeteria con backend Express/MongoDB y frontend React. No es un e-commerce multipagina. El sistema cubre autenticacion de empleados, apertura/cierre de caja, catalogo, pedido POS, clientes, checkout de caja, ordenes pendientes y flujo basico de barista.

## Objetivo del Producto

Permitir operar ventas de cafeteria desde caja, registrando pedidos, controlando stock, asociando clientes, calculando totales y gestionando apertura/cierre de turno.

## Alcance Actual

| Area | Estado |
| --- | --- |
| Backend API | Muy avanzado, con tests y seguridad basica; transacciones MongoDB, contador atomico |
| Frontend POS | Funcional en ruta unica `/` |
| Caja | Implementada con hidratacion backend (`GET /api/total-cash/active`); fallback localStorage |
| Catalogo | Implementado |
| Clientes | Implementado |
| Ordenes | Implementado con transacciones, contador atomico, asignacion barista por carga; tests de regresion |
| Barista | Implementado basico con polling; sesion operativa separada |
| Admin UI | No confirmado como pantalla actual |
| E2E | Cypress mockeado para POS/cliente/caja/barista; Cypress real local para caja/venta POS + barista |

## Alcance Objetivo

- Backend como fuente de verdad para totales, stock, caja, ordenes y autenticacion.
- Frontend alineado a contratos API claros.
- Documentacion vigente separada de guias antiguas.
- QA backend estable y frontend con cobertura minima de flujos criticos.
- Decision explicita sobre Cypress, tarjeta real y revocacion de tokens.

## Modulos

### Autenticacion

- Proposito: identificar empleados y emitir tokens.
- Estado actual: implementado.
- Componentes: `CashSession`, `SessionContext`, `Header`.
- Endpoints: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/check-role/:employeeId`, `/auth/verify-pin`.
- Modelo: `User`.
- Reglas: registro publico fuerza `vendedor`; login/refresh rechazan usuarios inactivos; `verify-pin` requiere auth.
- Gaps: logout no revoca refresh tokens; politica de sesion debe decidirse.

### Usuarios

- Proposito: gestionar empleados.
- Estado actual: API implementada; UI admin no confirmada.
- Endpoints: `/users/profile`, `/users`, `/users/:userId`, `/toggle-status/:userId`.
- Modelo: `User`.
- Reglas: rutas administrativas requieren admin.
- Gaps: definir si habra pantalla admin o API-only.

### Catalogo

- Proposito: consultar y administrar categorias/productos.
- Estado actual: implementado.
- Componentes: `Home`, `ProductList`, `ProductCard`, menu de categorias.
- Endpoints: `/categories`, `/categories/search`, `/products`, `/products/category/:categoryId`.
- Modelos: `Category`, `Product`.
- Reglas: productos tienen precio, stock y categoria; escrituras requieren admin.
- Gaps: cache de productos puede quedar stale.

### Clientes

- Proposito: buscar, crear y asociar clientes a ordenes.
- Estado actual: implementado.
- Componentes: `ClientSelector`, `CreateClientModal`.
- Endpoints: `/clients`, `/clients/search`, `/clients/check-email`.
- Modelo: `Client`.
- Reglas: email unico; historial y contador de compras se actualizan al crear orden.
- Gaps: revisar validador de update parcial.

### Carrito y Checkout

- Proposito: construir pedido y confirmar pago.
- Estado actual: implementado.
- Componentes: `OrderContext`, `OrderPanel`, `ModifiersModal`, `CheckoutConfirmationModal`.
- Endpoints: `/orders/preview`, `/orders`.
- Modelo: `Order`.
- Reglas: frontend arma items; backend calcula totales finales; efectivo valida monto recibido; tarjeta es simulada.
- Gaps: totales locales pueden divergir del preview backend.

### Ordenes

- Proposito: crear, listar y completar pedidos.
- Estado actual: implementado con transacciones MongoDB y contador atomico; tests de regresion cubren atomicidad y descuento stock.
- Componentes: `PendingOrders`, `OrderPanel`, `OrderContext`, `orderService` (misspelled as `orderSevice.js`).
- Endpoints: `/orders`, `/orders/:orderId`, `/orders/client/:clientId`, `/orders/:orderId/status`, `/orders/preview`, `/orders/my-shift`, `/orders/admin/list`, `/orders/admin/sales-summary`.
- Modelos: `Order`, `Product`, `Client`, `Counter`, `BaristaSession`.
- Reglas: solo vendedor previsualiza/crea; nuevas ordenes quedan `pendiente`; `completado` es terminal; crear orden descuenta stock, crea orden y actualiza cliente dentro de una transaccion MongoDB; `orderNumber` sale de un contador atomico (`Counter` con `findOneAndUpdate $inc`); asignacion automatica de barista por carga de trabajo; validacion stock con `findOneAndUpdate {stock: {$gte: qty}}`; error 400/404 si stock insuficiente o producto no existe.
- Gaps: alineacion frontend/backend totales (frontend calcula estimado, backend es fuente final); cache productos stale tras orden; probar escenarios backend-real adicionales como stock insuficiente.

### Caja

- Proposito: apertura/cierre de turno y arqueo.
- Estado actual: implementado con endpoint de sesion activa.
- Componentes: `CashSession`, `SessionContext`, `Header`.
- Endpoints: `/total-cash/open`, `/total-cash/close`, `/total-cash/orders`, `/total-cash/active`, `/total-cash/admin/sessions`.
- Modelo: `CashSession`, `BaristaSession`.
- Reglas: ventas en efectivo desde `openedAt`; admin no crea sesion operativa; baristas tienen sesion operativa separada; `SessionContext` hidrata sesion activa desde backend (`GET /api/total-cash/active`) con fallback a localStorage.
- Gaps: posible multiple sesion abierta; validar PIN server-side si aplica; admin no debe crear sesion real.

### Barista

- Proposito: ver y completar ordenes pendientes.
- Estado actual: implementado basico.
- Componentes: `PendingOrders`.
- Endpoints: `GET /orders`, `PATCH /orders/:orderId/status`.
- Modelo: `Order`.
- Reglas: lista pendientes y marca `completado`.
- Gaps: permisos por rol y polling deben revisarse.

## Arquitectura Tecnica Actual

| Capa | Tecnologia/Patron |
| --- | --- |
| Frontend | CRA, React 19, React Router DOM 7, Axios |
| Backend | Express 5, ESM, Mongoose, JWT |
| Base de datos | MongoDB |
| Estado global frontend | `SessionContext`, `OrderContext`, `orderReducer` |
| Persistencia local | `localStorage` y `sessionStorage` |
| Tests API | Jest, Supertest, MongoMemoryReplSet |
| Tests frontend | CRA/Jest (`App.test`, `ClientSelector.test`, `OrderContext.test`), Cypress mockeado POS y Cypress real local |

## Persistencia Local vs Remota

| Dato | Fuente actual |
| --- | --- |
| Usuarios | MongoDB |
| Categorias/productos | MongoDB |
| Clientes | MongoDB |
| Ordenes | MongoDB |
| Caja | MongoDB (fuente); `localStorage` (`openedAt`, `initialCash`) como fallback/hidratacion inicial |
| Tokens | `localStorage` |
| Carrito | `localStorage` via `storageService` |
| Cliente activo | `localStorage` via `storageService` |
| Cache productos | `sessionStorage` (5 min, keys `products_page_*`) |

## Reglas Funcionales Confirmadas

- Registro publico crea rol `vendedor`.
- Usuarios inactivos no pueden login/refresh/acceder.
- Rutas admin requieren `authMiddleware` + `isAdmin`.
- Backend calcula precios, descuentos, IVA/tax y total.
- Descuento por cliente depende de `totalPurchaseCount` (1-4: 5%, 5-9: 10%, 10+: 15%).
- Stock se descuenta al crear orden dentro de una transaccion junto con orden y cliente.
- `orderNumber` se asigna con contador atomico `Counter` (`findOneAndUpdate $inc`).
- Orden nueva inicia `pendiente`.
- Orden `completado` no debe reabrirse.
- Caja suma ventas en efectivo desde apertura.
- Tarjeta es simulada, no integrada a terminal real.
- `SessionContext` hidrata sesion de caja activa desde `GET /api/total-cash/active` (con fallback a localStorage).
- Baristas tienen sesion operativa separada (`BaristaSession`); apertura de caja por barista asigna ordenes pendientes no asignadas.
- No existen flujos de envio, dashboard multipagina ni checkout por pasos tipo tienda online en el alcance actual; el flujo real trabaja con pedidos POS y ordenes.

## Inconsistencias Principales

- Totales duplicados frontend/backend (frontend estima, backend es fuente final).
- Caja: hidratacion desde backend implementada (`SessionContext` usa `GET /api/total-cash/active`), pero localStorage sigue como fallback; posible multiples sesiones abiertas.
- Stock cacheado en frontend (`sessionStorage` 5 min) frente a stock real backend.
- Logout no revoca refresh token.
- Cypress configurado con specs mockeados para smoke POS, cliente, cierre de caja y barista; existen specs reales locales para cierre de caja y venta POS + barista.
- Quedan gaps de testing unitario en contexts, HTTP/token refresh y checkout preview-create.

## Recomendacion de Cierre de Gaps

1. Establecer backend como fuente de verdad para totales (checkout usa preview backend), stock, ordenes.
2. Caja: hidratacion desde backend implementada; pendiente validar regla de multiples sesiones abiertas y PIN server-side.
3. Decidir politica de refresh tokens y logout (revocacion).
4. Crear cobertura frontend para contexts (SessionContext, OrderContext), HTTP/token refresh y checkout preview-create.
5. Invalidar cache productos (`clearProductsCache`) tras cambios administrativos o crear orden.
6. Limpiar documentacion obsoleta (`docs/SPECIFICATIONS.md`, consolidar `docs/qa/*`).
