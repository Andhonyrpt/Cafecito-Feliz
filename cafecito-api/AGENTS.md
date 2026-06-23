# Guía de Agentes - Cafecito API

Este documento contiene las reglas de arquitectura y patrones establecidos en `cafecito-api` para asegurar consistencia en futuros desarrollos.

## Comandos

Ejecutar siempre desde `cafecito-api/`; este repo no es un workspace npm.
- `npm install`
- `npm run dev`
- `npm start`
- `npm test`
- `npm test -- tests/auth.test.js`
- `npm run test:watch`
- `npm run test:coverage`
- `npm run seed`
- `npm run seed:e2e`
- `npm run seed:production` usa `SEED_ENV_FILE=.env.production`, `NODE_ENV=production` y `SEED_CONFIRM_PRODUCTION=true` desde el script.
- `npm run seed:e2e` prepara datos locales reservados para Cypress real (`EMP-9001`, `EMP-9002`, `E2E Cafes`, `E2E Americano`, `e2e.cliente@e2e.local`) y limpia solo órdenes/sesiones asociadas a esos datos.

## Estructura de Directorios (`src/`)

```
src/
├── config/       # Configuración de base de datos (database.js)
├── controllers/  # Lógica de negocio de la aplicación
├── middlewares/  # Autenticación, validaciones, manejo de errores
├── models/       # Esquemas de Mongoose
├── routes/       # Definición de endpoints
└── utils/        # Funciones utilitarias (ej. orderHelper.js)
```

## Mapa de Rutas API

### Autenticación (`/api/auth`)
- `POST /register` (Validaciones)
- `POST /login` (Validaciones)
- `POST /refresh`
- `POST /logout`
- `POST /verify-pin` (Validaciones)
- `GET  /check-role/:employeeId`

### Sesiones de Caja (`/api/total-cash`)
- `GET  /orders` (Requiere: Auth, Validaciones)
- `GET  /admin/sessions` (Requiere: Auth, Admin, Validaciones)
- `POST /open` (Requiere: Auth, Validaciones)
- `POST /close` (Requiere: Auth, Validaciones)

### Categorías (`/api/categories`)
- `GET  /search`
- `GET  /`
- `GET  /:categoryId` (Validaciones)
- `POST /` (Requiere: Auth, Admin, Validaciones)
- `PUT  /:categoryId` (Requiere: Auth, Admin, Validaciones)
- `DELETE /:categoryId` (Requiere: Auth, Admin, Validaciones)

### Clientes (`/api/clients`)
- `GET  /check-email` (Validaciones)
- `GET  /` (Requiere: Auth, Admin, Validaciones)
- `POST /` (Requiere: Auth, Validaciones)
- `PUT  /:clientId` (Requiere: Auth, Validaciones)
- `GET  /search` (Requiere: Auth)

### Órdenes (`/api/orders`)
- `GET  /` (Requiere: Auth)
- `GET  /my-shift` (Requiere: Auth)
- `GET  /admin/sales-summary` (Requiere: Auth, Admin, Validaciones)
- `GET  /admin/list` (Requiere: Auth, Admin, Validaciones)
- `GET  /:orderId` (Requiere: Auth, Validaciones)
- `GET  /client/:clientId` (Requiere: Auth, Validaciones)
- `POST /` (Requiere: Auth, Validaciones)
- `POST /preview` (Requiere: Auth, Validaciones)
- `PATCH /:orderId/status` (Requiere: Auth, Validaciones)

### Productos (`/api/products`)
- `GET  /` (Validaciones)
- `GET  /:id` (Validaciones)
- `GET  /category/:idCategory` (Validaciones)
- `POST /` (Requiere: Auth, Admin, Validaciones)
- `PUT  /:id` (Requiere: Auth, Admin, Validaciones)
- `DELETE /:productId` (Requiere: Auth, Admin, Validaciones)

### Usuarios (`/api/users`) y Status
- `GET  /users/profile` (Requiere: Auth)
- `GET  /users` (Requiere: Auth, Admin, Validaciones)
- `GET  /users/:userId` (Requiere: Auth, Admin, Validaciones)
- `POST /users` (Requiere: Auth, Admin, Validaciones)
- `PUT  /users/:userId` (Requiere: Auth, Admin, Validaciones)
- `PATCH /toggle-status/:userId` (Requiere: Auth, Admin, Validaciones)

## Modelos Mongoose

1. **CashSession**
   - `user`: ObjectId (Ref: User)
   - `openedAt`: Date
   - `closedAt`: Date
   - `status`: String ('open', 'closed')
   - `initialCash`: Number
   - `totalSales`: Number
   - `expectedCash`: Number
   - `isCashCorrect`: Boolean
   - `discrepancyReason`: String

2. **Category**
   - `name`: String (Unique)
   - `imageUrl`: String
   - `parentCategory`: ObjectId (Ref: Category)

3. **Client**
   - `displayName`: String
   - `email`: String (Unique)
   - `totalPurchaseCount`: Number
   - `purchaseHistory`: Array de ObjectId (Ref: Order)

4. **Order**
   - `user`: ObjectId (Ref: User)
   - `client`: ObjectId (Ref: Client)
   - `products`: Array de subdocumentos (`productId`, `quantity`, `price`, `notes`)
   - `subtotal`: Number
   - `discount`: Number
   - `tax`: Number
   - `totalPrice`: Number
   - `paymentMethod`: String ('efectivo', 'tarjeta')
   - `orderType`: String ('local', 'llevar')
   - `status`: String ('pendiente', 'completado')
   - `orderNumber`: Number (Unique)

5. **Counter**
   - `name`: String (Unique)
   - `seq`: Number
   - Uso actual: secuencia atomica de `orderNumber`.

6. **Product**
   - `name`: String (Unique)
   - `price`: Number
   - `stock`: Number
   - `imageUrl`: String
   - `parentCategory`: ObjectId (Ref: Category)

7. **User**
   - `displayName`: String
   - `employeeId`: String (Unique)
   - `hashPassword`: String
   - `role`: String ('admin', 'vendedor', 'barista')
   - `avatar`: String
   - `isActive`: Boolean

*Nota: Todos los modelos tienen la opción `{ timestamps: true }`.*

## Validadores Disponibles (`src/middlewares/validators.js`)

Se debe utilizar `express-validator` reusando los siguientes métodos:
- `employeeIdValidation`
- `employeeIdParamValidation`
- `passwordValidation`
- `fullPasswordValidation`
- `passwordLoginValidation`
- `pinValidation`
- `displayNameValidation`
- `userDisplayNameValidation`
- `paginationValidation`
- `urlValidation`
- `bodyMongoIdValidation`
- `mongoIdValidation`
- `queryMongoIdValidation`
- `booleanValidation`
- `roleValidation`
- `employeeRoleValidation`
- `optionalPinValidation`
- `sortFieldValidation`
- `orderValidation`
- `queryRoleValidation`
- `queryIsActiveValidation`
- `emailValidation`
- `queryEmailValidation`
- `quantityValidation`
- `priceValidation`
- `priceOptionalValidation`
- `orderStatusValidation`
- `productNameValidation`
- `stockValidation`
- `imageUrlValidation`
- `generalNameValidation`
- `cashInitialValidation`
- `cashOpenedAtValidation`
- `cashCloseValidation`
- `cashSessionsAdminQueryValidation`

## Testing

- Jest usa `node --experimental-vm-modules` y `NODE_ENV=test` desde los scripts de `package.json`.
- `tests/setup/setup.js` crea `MongoMemoryReplSet` y conecta Mongoose; no levantar ni depender de MongoDB real para `npm test`.
- `jest.config.js` busca `tests/**/*.test.js`, limpia/restaura mocks y exige cobertura global: statements/lines/functions 80%, branches 65%.
- Los tests de integración importan `app` desde `server.js`; `server.js` solo hace `listen` cuando `NODE_ENV !== "test"`.
- Si una prueba genera `logs/error.log`, limpiar ese artefacto antes de cerrar la tarea.

## Integridad de Ordenes

- `createOrder()` usa una transaccion MongoDB para descontar stock, crear la orden y actualizar el cliente como una sola unidad.
- `orderNumber` se obtiene desde el modelo `Counter` con `findOneAndUpdate(..., $inc)` dentro de la misma transaccion.
- La base MongoDB local/desplegada debe soportar transacciones; usar replica set cuando se ejecute fuera de tests.

## Seguridad y Middlewares

- `authRoutes.js` aplica rate limits locales a login, refresh, verify-pin y check-role desde `src/middlewares/rateLimit.js`.
- `server.js` aplica `helmet()`, `express.json({ limit: '100kb' })` y CORS con `process.env.CORS_ORIGIN?.split(',')`.
- Las variables requeridas están en `.env.example`: `PORT`, `NODE_ENV`, `MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `CORS_ORIGIN`.

## Patrones de Código

### 1. Patrón Controlador (`try/catch/next`)
Todo controlador debe usar `try/catch` y derivar errores al middleware global utilizando `next(error)`.
**No** se deben enviar respuestas manuales en caso de excepciones.

```javascript
async function getCategories(req, res, next) {
    try {
        // ... Lógica de negocio ...
        res.status(200).json({ categories });
    } catch (error) {
        next(error); // Delegar al manejador de errores global
    }
}
```

### 2. Patrón de Rutas (`authMiddleware` + `validate`)
Las validaciones son arreglos que finalizan invocando el middleware genérico `validate`. El orden estándar es: 
1. `authMiddleware`
2. Control de roles (ej. `isAdmin`)
3. `[ Array de Validaciones ]`
4. `validate`
5. `controller`

```javascript
router.post('/categories', authMiddleware, isAdmin, [
    generalNameValidation('name', true, 100),
    urlValidation('imageUrl'),
    bodyMongoIdValidation('parentCategory', 'Parent category ID', true)
], validate, createCategory);
```

## Restricciones Arquitectónicas (Qué NO hacer)

1. **Importaciones**: El proyecto utiliza ES Modules (`"type": "module"` en `package.json`). **NO USAR `require()`**, utiliza siempre `import / export`.
2. **Capa de Servicios**: La lógica de negocio recae directamente en los controladores. La carpeta `services/` de backend está vacía y **NO DEBE** usarse para crear archivos de servicio.
3. **Manejo de Excepciones**: No usar `res.status(500).json({ error: '...' })` en bloques catch. Siempre utilizar `next(error)` que será gestionado por `errorHandler.js`.
4. **Validaciones Sueltas**: No construir validaciones complejas con sentencias `if (!req.body.name)` en los controladores. Usa siempre `express-validator` en las rutas mediante `validators.js`.
5. **Esquemas Mongoose**: Nunca omitir la bandera `{ timestamps: true }` al crear nuevos schemas.
6. **Extensión de Archivos**: Al realizar imports de archivos locales siempre se debe incluir la extensión `.js` (ej: `import User from "../models/user.js";`).
