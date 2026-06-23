# API Security Test Plan

## Objetivo

Evaluar riesgos de seguridad en `cafecito-api`, priorizar los hallazgos críticos y definir una estrategia clara para atacarlos de forma controlada, reproducirlos con pruebas automatizadas y remediarlos sin romper el flujo POS existente.

## Estado Actual

### Completado

- Registro publico forzado a `vendedor`.
- `check-role` y `verify-pin` protegidos con token.
- `previewOrder` sin `stack` y con `client` validado.
- `authMiddleware` verifica existencia y estado activo del usuario.
- `login` y `refresh` rechazan usuarios inactivos.
- Validaciones endurecidas contra NoSQL injection.
- Rate limiting suave en auth.
- `helmet()` y body limit de `100kb` aplicados.
- Suite de seguridad y regresion ejecutada.
- `npm audit --omit=dev` limpio para produccion.

### Pendiente

- Revocacion real de refresh tokens al logout.
- Uniformar mensajes de duplicados unicos si se quiere hacerlo.
- Pruebas dedicadas de brute force para login y PIN.
- Prueba de token antiguo para caja.
- Casos pendientes de la matriz que siguen siendo decision o prueba dedicada.
- Revisión de tooling dev-only, incluido `js-yaml`.

## Alcance

- API Express/Mongoose ubicada en `cafecito-api/`.
- Rutas de autenticación, usuarios, productos, categorías, clientes, órdenes y caja.
- Middleware de autenticación/autorización, validadores, manejo global de errores y modelos Mongoose.
- Pruebas locales con Jest, Supertest y MongoMemoryReplSet.
- Revisión de dependencias de producción con `npm audit --omit=dev`.

## Fuera De Alcance

- Pentest contra infraestructura real, dominios, red, TLS, nube o servidores desplegados.
- Pruebas del frontend salvo que sean necesarias para entender consumo de API.
- Cambios en `cafecito-api/AGENTS.md` o `cafecito-app/AGENTS.md`.

## Estrategia De Ataque

1. Reconocimiento
- Enumerar rutas desde `src/routes/*.js`.
- Clasificar endpoints como públicos, autenticados o admin-only.
- Identificar inputs que llegan a MongoDB: `params`, `query` y `body`.
- Identificar datos sensibles: roles, PIN/password, tokens, caja, órdenes, clientes y stock.

2. Explotación Controlada
- Atacar primero autenticación y registro.
- Probar escalamiento de privilegios con payloads mínimos.
- Probar bypass de autorización usando tokens sin rol admin, tokens expirados y tokens de usuarios inexistentes/desactivados.
- Probar validaciones con ObjectIds inválidos, tipos incorrectos y operadores Mongo.
- Probar lógica de negocio: totales, descuentos, stock, estado de órdenes y cierre de caja.

3. Evidencia
- Cada hallazgo debe tener endpoint, payload, respuesta observada, impacto, test automatizado y fix esperado.
- Las pruebas deben vivir en Jest/Supertest y correr con `npm test` desde `cafecito-api/`.

4. Remediación
- Primero corregir vulnerabilidades que permiten admin o acceso no autorizado.
- Después corregir leaks de datos y errores inseguros.
- Luego hardening: rate limit, Helmet, límites de body y auditoría de dependencias.

5. Regresión
- Ejecutar `npm test`.
- Ejecutar pruebas enfocadas de seguridad.
- Ejecutar `npm audit --omit=dev`.
- Verificar que las pruebas no dejen cambios persistentes en logs.

## Hardening Aplicado

- `helmet()` esta activo en `server.js`.
- `express.json()` usa un limite explicito de `100kb`.
- `helmet` esta instalado en `cafecito-api`.
- `npm audit --omit=dev` ya no reporta issues de produccion.
- Si una carga util legitima del POS requiere mas, documentar el caso y subir el limite de forma controlada.

## Riesgos Críticos A Evaluar

### 1. Escalamiento De Privilegios

Riesgo: un usuario no autenticado o no-admin obtiene permisos de admin.

Ataques:
- Enviar `role: "admin"` a `POST /api/auth/register`.
- Iniciar sesión con ese usuario.
- Acceder a rutas admin como `GET /api/users`, `POST /api/products`, `POST /api/categories`.
- Intentar modificar `role` o `isActive` de otros usuarios.

Remediación:
- Eliminar `role` del registro público o bloquear el registro público.
- Crear usuarios solo desde `POST /api/users` con `authMiddleware` e `isAdmin`.
- Si se conserva registro público, forzar rol seguro como `vendedor` desde el servidor.
- Agregar tests que aseguren que un usuario público nunca puede autoconcederse `admin`.

### 2. Bypass De Autorización

Riesgo: endpoints protegidos aceptan tokens inválidos, expirados, de rol incorrecto o de usuarios desactivados.

Ataques:
- Solicitudes sin `Authorization`.
- Bearer token malformado.
- JWT expirado.
- JWT con rol `vendedor` contra rutas admin.
- JWT firmado correctamente pero con `userId` inexistente.
- Token emitido antes de desactivar al usuario.

Remediación:
- En `authMiddleware`, verificar que el usuario exista y esté activo.
- En refresh, verificar que el usuario exista y esté activo.
- Mantener `algorithms: ['HS256']`.
- Invalidar o rechazar tokens cuando cambie el estado/rol del usuario.

### 3. Enumeración Y Brute Force De PIN/Credenciales

Riesgo: endpoints públicos permiten descubrir empleados, roles o validar PINs por diferencia de respuesta.

Ataques:
- Enumerar roles con `GET /api/auth/check-role/:employeeId`.
- Comparar `POST /api/auth/verify-pin` con empleado inexistente, empleado existente y PIN incorrecto.
- Repetir intentos contra login/PIN sin rate limit.

Remediación:
- Proteger o eliminar `check-role` si no es indispensable.
- Responder de forma genérica en login y PIN: `Invalid credentials`.
- Agregar rate limiting por IP y por `employeeId` en login, verify-pin y register.
- Considerar bloqueo temporal o backoff progresivo tras intentos fallidos.

### 4. Exposición De Información Sensible

Riesgo: errores devuelven stack traces, paths locales, detalles de MongoDB o datos internos.

Ataques:
- Enviar `client: "not-a-mongo-id"` a `POST /api/orders/preview`.
- Forzar `CastError`, `ValidationError` y duplicados únicos.
- Confirmar que `hashPassword`, tokens, PINs y stacks no aparezcan en respuestas.

Remediación:
- Usar `next(error)` y el `errorHandler` global.
- No responder `err.stack` ni paths locales.
- Manejar errores Mongoose conocidos con respuestas seguras.
- Validar todos los ObjectIds antes de llegar a Mongoose.

### 5. Inyección NoSQL Y Manipulación De Queries

Riesgo: operadores Mongo como `$ne`, `$gt`, `$regex` o `$where` llegan a consultas sensibles.

Ataques:
- Enviar objetos en campos string como `employeeId`, `password`, `email` o `search`.
- Enviar operadores Mongo en body/query.
- Probar búsquedas con regex costosas o strings largos.

Remediación:
- Validar tipos estrictos con `express-validator`.
- Rechazar objetos en campos que deben ser string o ObjectId.
- Sanitizar claves que empiecen con `$` o contengan `.`.
- Escapar regex dinámicas y limitar longitud de búsquedas.

### 6. Integridad De Órdenes, Stock Y Caja

Riesgo: el cliente manipula precios, descuentos, totales, stock, estado o cierres de caja.

Ataques:
- Enviar `price`, `subtotal`, `discount`, `tax` o `totalPrice` falsos en `/api/orders`.
- Enviar cantidades negativas, decimales, strings o demasiado grandes.
- Crear órdenes concurrentes contra stock bajo.
- Enviar `client` inválido en preview/create.
- Modificar estado de órdenes con rol no autorizado si aplica al negocio.

Remediación:
- Mantener cálculo financiero solo en backend.
- Validar `client` en `/api/orders/preview` igual que en `/api/orders`.
- Usar operaciones atómicas para stock; considerar transacciones para órdenes multiproducto.
- Agregar tests de stock límite y rollback.

### 7. Gestión De Tokens Y Sesión

Riesgo: refresh tokens reutilizables o tokens válidos después de logout/desactivación.

Ataques:
- Reusar refresh token después de logout.
- Usar refresh token de usuario desactivado.
- Cambiar rol del usuario y seguir usando token anterior.
- Probar refresh token inválido, expirado o de usuario inexistente.

Remediación:
- Persistir refresh tokens o usar `tokenVersion` para revocación.
- Verificar usuario activo en refresh.
- Invalidar tokens al desactivar usuario o cambiar rol.
- Implementar rotación real de refresh tokens si se requiere sesión robusta.

## Pruebas De Alta Prioridad

### `auth.security.test.js`

- Registro público no permite `role: "admin"`.
- Registro público fuerza rol seguro o devuelve `403/404` si se elimina.
- Login no diferencia usuario inexistente vs password incorrecto.
- Verify-pin no diferencia empleado inexistente vs PIN incorrecto.
- Check-role requiere auth o no existe.
- Login/PIN tiene rate limit cuando se implemente.

### `authorization.security.test.js`

- Cada ruta protegida devuelve `401` sin token.
- Cada ruta admin devuelve `403` con rol no-admin.
- Usuario desactivado no puede usar token anterior.
- Token con `userId` inexistente no pasa.
- Refresh de usuario desactivado falla.

### `errors.security.test.js`

- `CastError` no devuelve stack.
- Duplicados únicos no devuelven colección, índice ni stack.
- `/api/orders/preview` con `client` inválido devuelve `422`.
- Errores 500 solo devuelven mensaje genérico.

### `nosql.security.test.js`

- Login rechaza `employeeId` como objeto.
- Verify-pin rechaza operadores Mongo.
- Search rechaza objetos y limita longitud.
- IDs en body/query/params rechazan objetos y strings inválidos.

### `orders.security.test.js`

- Backend ignora precios y totales enviados por cliente.
- Cantidades inválidas se rechazan.
- Stock no queda negativo.
- Orden con producto inexistente no descuenta stock.
- `previewOrder` y `createOrder` calculan totales de forma consistente.

## Pruebas De Prioridad Media

- CORS: validar origen permitido y comportamiento cuando `CORS_ORIGIN` falta.
- Body size: payload grande contra endpoints JSON.
- Headers HTTP: verificar headers después de instalar Helmet.
- Logging: confirmar que no se loguean PINs, passwords o tokens.
- Dependencias: ejecutar `npm audit --omit=dev`.
- Duplicados únicos: responder errores de dominio seguros y no 500 genéricos si se desea mejorar UX.

## Opcionales / Baja Prioridad

- Fuzzing amplio con payloads aleatorios.
- Pruebas de timing entre usuario inexistente y contraseña inválida.
- Revisión de consistencia de mensajes español/inglés.
- Pruebas de DoS con arrays enormes de productos.
- Revisión de dependencias dev-only.
- SAST con Semgrep, CodeQL u otra herramienta.
- Revisión operacional: TLS, reverse proxy, backups, retención de logs y monitoreo.

## Plan De Remediación

### Fase 1: Bloquear Críticos

- Bloquear self-register admin.
- Proteger o eliminar `check-role`.
- Endurecer `verify-pin` con respuestas genéricas.
- Quitar stack traces de `previewOrder`.
- Validar `client` en `/api/orders/preview`.

### Fase 2: Autorización Robusta

- Verificar usuario activo en `authMiddleware`.
- Verificar usuario activo en refresh.
- Agregar tests de usuario desactivado y usuario inexistente.
- Revisar matriz completa de permisos.

### Fase 3: Validación Y Anti-NoSQL Injection

- Validar tipos estrictos en auth y búsquedas.
- Sanitizar claves Mongo peligrosas.
- Limitar longitud de búsquedas y tamaño de arrays.
- Manejar errores Mongoose con respuestas seguras.

### Fase 4: Hardening

- Instalar/configurar Helmet.
- Instalar/configurar rate limiting para auth.
- Establecer límite explícito para `express.json({ limit: '...' })`.
- Resolver `npm audit --omit=dev`.
- Quitar logs de debug con datos de usuario/body en controladores sensibles.

### Fase 5: Automatización

- Mantener pruebas de seguridad en Jest/Supertest.
- Añadir script opcional `npm run test:security` si se quiere separar la suite.
- Documentar comandos de seguridad cuando el flujo esté estable.
- Ejecutar `npm test` antes de cerrar cada remediación.

## Comandos De Verificación

```bash
npm test
npm test -- tests/ethical-hacking.test.js
npm audit --omit=dev
```

Ejecutar estos comandos desde `cafecito-api/`.
