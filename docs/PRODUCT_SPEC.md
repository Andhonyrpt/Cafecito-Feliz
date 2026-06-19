# Product Spec

Ultima revision: 2026-06-18.

Este spec describe el estado actual confirmado del sistema y los gaps para continuar el desarrollo. No asume que el producto esta terminado.

## Descripcion General

Cafecito Feliz es un POS para cafeteria con backend Express/MongoDB y frontend React. El sistema cubre autenticacion de empleados, apertura/cierre de caja, catalogo, carrito, clientes, checkout, ordenes pendientes y flujo basico de barista.

## Objetivo del Producto

Permitir operar ventas de cafeteria desde caja, registrando pedidos, controlando stock, asociando clientes, calculando totales y gestionando apertura/cierre de turno.

## Alcance Actual

| Area | Estado |
| --- | --- |
| Backend API | Muy avanzado, con tests y seguridad basica |
| Frontend POS | Funcional en ruta unica `/` |
| Caja | Implementada, pero con estado duplicado local/backend |
| Catalogo | Implementado |
| Clientes | Implementado |
| Ordenes | Implementado, con deuda de integridad |
| Barista | Implementado basico con polling |
| Admin UI | No confirmado como pantalla actual |
| E2E | Cypress inicializado, pero sin alcance/pruebas POS formalizadas |

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
- Gaps: cache de productos puede quedar stale; busqueda de categorias tiene bugs probables.

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
- Estado actual: implementado con bugs/deuda.
- Componentes: `PendingOrders`, `OrderPanel`.
- Endpoints: `/orders`, `/orders/:orderId`, `/orders/client/:clientId`, `/orders/:orderId/status`.
- Modelos: `Order`, `Product`, `Client`.
- Reglas: solo vendedor previsualiza/crea; nuevas ordenes quedan `pendiente`; `completado` es terminal.
- Gaps: `GET /orders/client/:clientId` falla por populate; `orderNumber` por conteo es race-prone; no hay transacciones.

### Caja

- Proposito: apertura/cierre de turno y arqueo.
- Estado actual: implementado parcialmente.
- Componentes: `CashSession`, `SessionContext`, `Header`.
- Endpoints: `/total-cash/open`, `/total-cash/close`, `/total-cash/orders`.
- Modelo: `CashSession`.
- Reglas: ventas en efectivo desde `openedAt`; admin no crea sesion real.
- Gaps: estado duplicado local/backend; posible multiple sesion abierta; validar PIN server-side si aplica.

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
| Tests API | Jest, Supertest, MongoMemoryServer |
| Tests frontend | CRA/Jest, solo `src/App.test.js` |

## Persistencia Local vs Remota

| Dato | Fuente actual |
| --- | --- |
| Usuarios | MongoDB |
| Categorias/productos | MongoDB |
| Clientes | MongoDB |
| Ordenes | MongoDB |
| Caja | MongoDB + `localStorage` (`openedAt`, `initialCash`) |
| Tokens | `localStorage` |
| Carrito | `localStorage` via `storageService` |
| Cliente activo | `localStorage` via `storageService` |
| Cache productos | `sessionStorage` |

## Reglas Funcionales Confirmadas

- Registro publico crea rol `vendedor`.
- Usuarios inactivos no pueden login/refresh/acceder.
- Rutas admin requieren `authMiddleware` + `isAdmin`.
- Backend calcula precios, descuentos, IVA/tax y total.
- Descuento por cliente depende de `totalPurchaseCount`.
- Stock se descuenta al crear orden.
- Orden nueva inicia `pendiente`.
- Orden `completado` no debe reabrirse.
- Caja suma ventas en efectivo desde apertura.
- Tarjeta es simulada, no integrada a terminal real.

## Inconsistencias Principales

- Totales duplicados frontend/backend.
- Caja duplicada local/backend.
- Stock cacheado en frontend frente a stock real backend.
- Logout no revoca refresh token.
- Cypress inicializado con archivos generados, pero sin scripts y pruebas POS formalizadas.
- Guias testing obsoletas.

## Recomendacion de Cierre de Gaps

1. Establecer backend como fuente de verdad para totales, stock, caja y ordenes.
2. Corregir bugs de ordenes por cliente y servicios frontend relacionados.
3. Normalizar caja para hidratar sesion desde backend.
4. Reforzar integridad de ordenes con contador atomico y transacciones o estrategia equivalente.
5. Decidir politica de refresh tokens y logout.
6. Crear cobertura frontend para contexts y checkout.
7. Limpiar documentacion obsoleta.
