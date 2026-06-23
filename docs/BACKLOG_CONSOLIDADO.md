# BACKLOG CONSOLIDADO - Cafecito-Feliz

Este documento sirve como fuente de verdad sobre el estado actual de la integración Frontend-Backend y el backlog de trabajo técnico.

## 1. Matriz de Integración FE-BE

La mayoría de los módulos siguen una relación 1:1 entre servicios frontend y rutas backend.

| Módulo | Servicio FE (`cafecito-app`) | Ruta BE (`cafecito-api`) | Estado Integración |
| :--- | :--- | :--- | :--- |
| Autenticación | `auth.js` | `authRoutes.js` | Completa |
| Órdenes | `orderSevice.js` | `orderRoutes.js` | Completa |
| Productos | `productService.js` | `productRoutes.js` | Completa |
| Clientes | `clientService.js` | `clientRoutes.js` | Completa |
| Categorías | `categoryService.js` | `categoryRoutes.js` | Completa |
| Caja/Sesión | `cashSessionService.js` | `cashRoutes.js` | Completa |
| Usuarios | `userService.js` | `userRoutes.js` | Completa |
| Admin | `adminService.js` | Varias (roles) | Completa |

## 2. Inventario de Uso de Almacenamiento

### LocalStorage
Se utiliza para persistencia de estado crítico.
*   `authToken`, `refreshToken`: Manejados principalmente en `auth.js` y `http.js`.
*   `openedAt`, `initialCash`: Manejados en `SessionContext.jsx` (acceso directo, inconsistente con `storageService`).
*   `userData`: Acceso en `auth.js`.
*   `order`, `active_client`: Manejados a través de `storageService.js` (correcto).

### SessionStorage
Se utiliza para caché de catálogos.
*   `products_page_*`: `productService.js`.
*   `categories_cache`: `categoryService.js`.

## 3. Estado de Funcionalidades
*   **Integradas (FE+BE):** Flujo de autenticación (JWT/Refresh), POS (Creación de órdenes, catálogo de productos, gestión de clientes).
*   **Solo Frontend:** UI de POS, gestión de caché en `sessionStorage`, `SessionContext` para lógica de fallback.
*   **Solo Backend:** Lógica de validación, persistencia en MongoDB, transacciones de órdenes, gestión de roles.

## 4. Hallazgos Críticos y Deuda Técnica
1.  **Inconsistencia de Almacenamiento:** `SessionContext` accede directamente a `localStorage` en lugar de utilizar `storageService.js` como lo hace `OrderContext`.
2.  **Typo en Servicio:** `cafecito-app/src/services/orderSevice.js` está mal escrito.
3.  **Falta de Documentación API:** No existe documentación Swagger/OpenAPI para los endpoints de `cafecito-api`.
4.  **Caché Estática:** El uso de `sessionStorage` para productos requiere limpieza manual (`clearProductsCache()`) y puede causar inconsistencias si el backend se actualiza pero el cliente no refresca.

## 5. Backlog Priorizado

### P0 (Crítico/Bloqueante)
- [x] Renombrar `orderSevice.js` -> `orderService.js` y actualizar todas las importaciones.
- [x] Migrar `SessionContext` a `storageService` (Incluye migración transparente de claves antiguas para evitar cierre de sesión).

### P1 (Alta Prioridad)
- [x] Implementar OpenAPI/Swagger en `cafecito-api` (Endpoints: `/auth`, `/orders`, `/products`, `/clients`, `/categories`, `/cash`, `/users`).
- [x] Auditar y estandarizar la limpieza de `sessionStorage` al hacer logout o al cerrar sesión de caja. (Implementada función `clearSessionCache` en `storageService` y aplicada en `SessionContext`).

### P2 (Mejoras)
- [x] Centralizar toda la lógica de `localStorage`/`sessionStorage` dentro de `storageService.js` (incluyendo la revisión de prefijos).
- [x] Migrar las pruebas unitarias que usan `localStorage.clear()` a mocks más robustos para evitar efectos secundarios entre pruebas. (Sesión completada para `SessionContext.test.jsx`).
