# Especificaciones del Proyecto

Este documento describe el comportamiento observado en el código actual de Cafecito Feliz. No describe comportamiento ideal ni cambios propuestos.

## Alcance

- Sistema POS para cafetería con apertura/cierre de caja, catálogo, clientes, carrito, checkout y comandas.
- Arquitectura de dos paquetes independientes: API Express/MongoDB y frontend React.
- No hay workspace raíz; cada paquete tiene su propio `package.json` y `package-lock.json`.

## Backend

### Stack

- Express 5 con módulos ES (`type: module`).
- Mongoose para modelos MongoDB.
- JWT para autenticación.
- `express-validator` para validaciones de rutas.
- Jest, Supertest y `mongodb-memory-server` para pruebas.

### Entrada y montaje

- `cafecito-api/server.js` crea y exporta `app`.
- `dbConnection()` no conecta a Mongo real cuando `NODE_ENV === 'test'`.
- La API monta rutas en `/api`.
- Endpoints base: `GET /` y `GET /health`.
- El servidor solo ejecuta `listen()` cuando `NODE_ENV !== 'test'`.

### Variables de entorno

- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `MONGODB_DB`
- `CORS_ORIGIN`
- El código también depende de `JWT_SECRET` y `REFRESH_TOKEN_SECRET` para firmar tokens.

### Modelos

`User`:

- `displayName`, `employeeId`, `hashPassword`, `role`, `avatar`, `isActive`.
- Roles permitidos: `admin`, `vendedor`, `barista`.

`Category`:

- `name`, `imageUrl`, `parentCategory`.

`Product`:

- `name`, `price`, `stock`, `imageUrl`, `parentCategory`.
- `parentCategory` es requerido.

`Client`:

- `displayName`, `email`, `totalPurchaseCount`, `purchaseHistory`.

`Order`:

- `user`, `client`, `products`, `subtotal`, `discount`, `tax`, `totalPrice`, `paymentMethod`, `orderType`, `status`, `orderNumber`.
- `paymentMethod`: `efectivo` o `tarjeta`.
- `orderType`: `local` o `llevar`.
- `status`: `pendiente` o `completado`.

`CashSession`:

- `user`, `openedAt`, `closedAt`, `status`, `initialCash`, `totalSales`, `expectedCash`, `isCashCorrect`, `discrepancyReason`.
- `status`: `open` o `closed`.

Todos los modelos usan `timestamps: true`.

### Autenticación

Rutas bajo `/api/auth`:

- `POST /register`: registra usuario con `displayName`, `employeeId`, `password` y `avatar` opcional validado como URL.
- `POST /login`: devuelve `token`, `refreshToken` y datos básicos de `user`.
- `POST /refresh`: recibe `refreshToken` y devuelve nuevo `token` junto con el mismo `refreshToken`.
- `POST /logout`: responde éxito sin invalidación persistente de token.
- `POST /verify-pin`: valida `employeeId` y `password`, responde `success: true` si el PIN coincide.
- `GET /check-role/:employeeId`: responde rol del empleado o `unknown`.

### Usuarios

Rutas montadas en `/api`:

- `GET /users/profile`: requiere autenticación y responde `{ message, user }`.
- `GET /users`: requiere admin, soporta paginación y filtros `role` e `isActive`.
- `GET /users/:userId`: requiere admin.
- `POST /users`: requiere admin.
- `PUT /users/:userId`: requiere admin.
- `PATCH /toggle-status/:userId`: requiere admin.

### Categorías

- `GET /categories/search`: búsqueda pública.
- `GET /categories`: lista categorías; sin paginación responde `{ categories }`.
- `GET /categories/:categoryId`: ruta pública validada por MongoId; popula `parentCategory`.
- `POST /categories`: requiere admin.
- `PUT /categories/:categoryId`: requiere admin.
- `DELETE /categories/:categoryId`: requiere admin y responde `204` si elimina.

### Productos

- `GET /products`: lista productos; puede recibir `page`, `limit` y `category`.
- `GET /products/:id`: obtiene producto por ID.
- `GET /products/category/:idCategory`: lista productos por categoría.
- `POST /products`: requiere admin y `parentCategory`.
- `PUT /products/:id`: requiere admin y permite actualización parcial.
- `DELETE /products/:productId`: requiere admin y responde `204` si elimina.

### Clientes

- `GET /clients/check-email`: responde `{ taken: boolean }`.
- `GET /clients`: requiere admin.
- `POST /clients`: requiere autenticación.
- `PUT /clients/:clientId`: requiere autenticación.
- `GET /clients/search`: requiere autenticación y query `search`; responde `{ clients }`.

### Órdenes

- `GET /orders`: requiere autenticación y devuelve órdenes pendientes en `{ orders }`.
- `GET /orders/:orderId`: requiere autenticación.
- `GET /orders/client/:clientId`: requiere autenticación.
- `POST /orders`: requiere autenticación y crea orden pendiente, descuenta stock y actualiza historial del cliente cuando aplica.
- `POST /orders/preview`: requiere autenticación y calcula `subtotal`, `discount`, `tax`, `total`, `currency` y `taxRate` sin crear orden.
- `PATCH /orders/:orderId/status`: requiere autenticación y permite actualizar a `pendiente` o `completado`.

### Caja

- `GET /total-cash/orders`: requiere autenticación y query `openedAt`; suma ventas en efectivo desde la apertura.
- `POST /total-cash/open`: requiere autenticación e `initialCash`; para admin responde acceso autorizado sin crear caja.
- `POST /total-cash/close`: requiere autenticación, `pin` e `isCashCorrect`; cierra la sesión abierta del usuario.

## Frontend

### Stack

- Create React App con React 19.
- `react-router-dom` 7.
- Axios compartido en `src/services/http.js`.
- Context API para estado global de pedido y sesión.

### Entrada y composición

`src/index.js` renderiza `App`. `App` monta:

- `OrderProvider`
- `SessionProvider`
- `BrowserRouter`
- `Layout`
- `Routes` con una sola ruta: `/` -> `Home`

### Estado local persistido

`localStorage`:

- `authToken`
- `refreshToken`
- `openedAt`
- `initialCash`
- `order`
- `active_client`

`sessionStorage`:

- Cache de productos con prefijo `products_page_`.

### Flujo de sesión

- `SessionContext` verifica token al iniciar.
- Si hay token, carga perfil con `/users/profile`.
- Si no hay token o falla el perfil, abre el modal de sesión.
- Apertura: llama `login()` y luego `createCashSession()` con `initialCash` y timestamp.
- Cierre: valida PIN con `verifyEmployeePin()` y llama `closeCashSession()`.

### Flujo POS

- `Home` carga categorías desde `/categories` y productos desde `/products` filtrando por categoría.
- `OrderContext` conserva carrito y cliente activo.
- `OrderPanel` normaliza productos como `{ productId, quantity, notes }`.
- Antes de cobrar llama `previewOrder()`.
- Al confirmar, vuelve a normalizar productos, obtiene perfil de usuario y llama `createOrder()`.
- Después de una venta limpia caché de productos, cliente activo y carrito.

### Pagos

- Efectivo: el modal exige monto recibido mayor o igual al total y calcula cambio.
- Tarjeta: el modal simula un flujo `idle -> procesando -> aprobado` con `setTimeout`; no hay integración real con terminal bancaria.

## Pruebas

API:

- Comando: `cd cafecito-api && npm test`.
- Configuración: `jest.config.js`, `testEnvironment: node`, `setupFilesAfterEnv: tests/setup/setup.js`.
- Base de datos: `mongodb-memory-server`.
- Estado actual observado: 7 suites, 40 tests.

Frontend:

- Comando recomendado no interactivo: `cd cafecito-app && npm test -- --watchAll=false`.
- Existe `src/App.test.js` de CRA; no hay suite E2E configurada.
- Cypress está instalado como dependencia de desarrollo, pero no hay `cypress.config.*`, scripts ni carpeta `cypress/`.
