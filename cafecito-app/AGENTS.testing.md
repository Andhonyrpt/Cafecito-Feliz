# Guía de Testing - Cafecito App

Este frontend es un POS de cafetería, no un e-commerce multipágina. No documentar flujos de registro, envío, checkout por pasos, dashboard ni success pages salvo que esas pantallas existan en el código.

## Estado actual

- Tests unitarios/componentes: Create React App/Jest.
- Comando no interactivo: `npm test -- --watchAll=false` desde `cafecito-app/`.
- Test actual confirmado: `src/App.test.js`.
- Cypress está instalado y fue inicializado con `npx cypress open`, por lo que pueden existir `cypress.config.js` y carpeta `cypress/`.
- Cypress ya tiene scripts y un smoke POS mockeado en `cypress/e2e/pos-smoke.cy.js`; todavía falta ampliar cobertura a backend real, cierre de caja, barista y cliente.

## Alcance correcto del POS

Los tests deben centrarse en los flujos reales:

- Apertura de caja desde el modal de sesión.
- Login de empleado por `employeeId` y PIN/password.
- Carga de categorías y productos en `Home`.
- Agregado de productos al pedido POS.
- Selección o creación de cliente.
- Preview de orden antes de cobro.
- Confirmación de pago efectivo o tarjeta simulada.
- Limpieza del pedido en curso, cliente activo y caché de productos tras venta.
- Vista de barista con órdenes pendientes y cambio a `completado`.

## Fuera de alcance actual

- Rutas `/login`, `/register`, `/checkout/shipping`, `/checkout/payment`, `/checkout/confirm` y `/order-success`, salvo que se implementen explícitamente.
- Flujo de envío o datos de dirección.
- Stripe, terminal bancaria real o pago online.
- Dashboard administrativo multipágina, salvo cambio explícito de producto.

## Reglas para nuevos tests

- Usar servicios/mocks alineados con `src/services/http.js`.
- El flujo real trabaja con órdenes mediante `/orders/preview` y `/orders`.
- Si se agregan E2E Cypress contra backend real, documentar datos semilla requeridos y limpieza.
- Preferir selectores estables solo para elementos que existen en el POS real.
