# Posibles Mejoras

Estas mejoras salen del análisis del código actual. No están implementadas en este documento.

## Alta prioridad

- Decidir contrato de respuesta único para recursos: algunos endpoints devuelven documento directo y otros `{ resource }` o `{ resources }`.
- Revisar y endurecer los tests que antes documentaban errores como comportamiento deseado, ahora que las inconsistencias principales ya fueron corregidas.

## Mejoras aplicadas

- Alineadas rutas de productos con sus validadores/controladores para `GET /products/:id`, `PUT /products/:id` y `GET /products/category/:idCategory`.
- Corregido `GET /categories/:categoryId` para poblar `parentCategory`.
- Alineados estados de órdenes con el modelo (`pendiente`, `completado`).
- Corregido `updateOrderStatus()` para actualizar por `orderId`.
- Actualizados tests de productos, categorías y órdenes para validar el comportamiento corregido.

## Backend

- Remover imports no usados en rutas y controladores para reducir ruido (`passwordValidation`, `priceValidation`, etc. donde no aplican).
- Cambiar usos de `{ new: true }` en Mongoose a `{ returnDocument: 'after' }` para eliminar warnings.
- Remover logs de depuración en `openCashSession()` o protegerlos por entorno.
- Usar `next(error)` en `previewOrder()` en vez de responder manualmente `500` con stack.
- Agregar manejo de errores de duplicados Mongo (`E11000`) para usuarios, productos, categorías y clientes.
- Agregar invalidación o almacenamiento de refresh tokens si se requiere logout real.
- Definir si los administradores deben abrir/cerrar caja o solo tener acceso administrativo, y documentarlo como regla de negocio.
- Normalizar idioma de nombres de campos y mensajes (`cashSales`, `totalPrice`, `openedAt`, mensajes en español/inglés).

## Frontend

- Corregir nombre `orderSevice.js` a `orderService.js` con actualización completa de imports.
- Revisar servicios con URLs sin slash inicial (`total-cash/open`, `clients/${clientId}`, `toggle-status/${userId}`) para mantener consistencia.
- Convertir el flujo de tarjeta simulado en una abstracción clara para futura terminal real.
- Revisar `CashSession.handleSubmit()`: llama `onSessionSubmit()` sin `await`, aunque el contexto retorna promesas.
- Remover logs de depuración visibles en consola de producción.
- Agregar estados de carga/error consistentes en modales y paneles en vez de `alert()`.
- Revisar caché de productos cuando cambian stock o categorías; hoy se limpia después de venta, pero no ante cambios administrativos.

## Pruebas

- Separar tests que documentan comportamiento actual defectuoso de tests de comportamiento esperado.
- Usar factories/helpers para crear usuarios, categorías, productos, clientes y tokens.
- Aislar datos por test con `beforeEach` o fixtures explícitos; actualmente algunos tests dependen del orden dentro del archivo.
- Agregar pruebas frontend para `OrderContext`, `SessionContext`, servicios HTTP y flujo de checkout.
- Si Cypress se mantiene, agregar configuración y scripts; si no, remover dependencia para evitar confusión.

## Mejoras recomendadas por cobertura

- Subir branch coverage del API: está por debajo del 80% aunque statements, lines y functions ya superan el umbral.
- Cubrir ramas de error en `orderController.js`, especialmente rollback de stock, orden no encontrada, producto no encontrado y preview con cliente/descuento.
- Cubrir ramas pendientes en `cashSessionController.js`: usuario inexistente, sesión no abierta, errores inesperados y cierre vendedor sin sesión activa.
- Cubrir `categoryController.searchCategories()` con filtros, sort, order y paginación; hoy la cobertura se concentra en el flujo sin paginar.
- Agregar pruebas específicas para `globalerrorHandler.js` y ramas de escritura fallida en `errorHandler.js` si se quiere medir middlewares con más precisión.
- Reducir ruido de consola durante cobertura (`dotenv`, logs de caja, warnings Mongoose) para que los reportes sean más legibles.

## Documentación

- Mantener `SPECIFICATIONS.md` actualizado junto con cambios de API/flujo POS.
- Documentar ejemplos de payload/respuesta por endpoint cuando se estabilicen los contratos.
- Agregar una guía de datos semilla para pruebas manuales: usuario admin, vendedor, categorías y productos iniciales.
