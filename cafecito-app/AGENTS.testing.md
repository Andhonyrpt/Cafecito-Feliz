# Guía de Testing - Cafecito App

Este frontend es un POS de cafetería, no un e-commerce multipágina. No documentar flujos de registro, envío, checkout por pasos, dashboard ni success pages salvo que esas pantallas existan en el código.

## Estado actual

- Tests unitarios/componentes: Create React App/Jest.
- Comando no interactivo: `npm test -- --watchAll=false` desde `cafecito-app/`.
- Tests actuales confirmados: `src/App.test.js`, `src/components/molecules/ClientSelector/ClientSelector.test.jsx` y `src/context/OrderContext.test.jsx`.
- Cypress está configurado con `cypress.config.js`, `baseUrl: http://localhost:3000` y scripts `cypress:open`, `cypress:run`, `cypress:run:real`, `e2e`.
- Cypress tiene specs mockeados en `cypress/e2e/` para smoke POS, creación/selección de cliente, cierre de caja y flujo barista.
- Cypress backend-real vive en `cypress/e2e-real/` y requiere antes `npm run seed:e2e` en `cafecito-api/`, API viva en `http://localhost:3001` y frontend vivo en `http://localhost:3000`.

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
- Los E2E Cypress contra backend real usan datos reservados `E2E` y no deben depender de datos operativos no controlados.
- Preferir selectores estables solo para elementos que existen en el POS real.
