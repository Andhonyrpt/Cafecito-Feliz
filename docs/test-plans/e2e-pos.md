# Plan de Pruebas E2E POS

## Objetivo

Validar flujos críticos del POS Cafecito Feliz desde UI, sin introducir rutas o conceptos ajenos al producto.

## Estado actual

- Cypress inicializado.
- Scripts agregados en `cafecito-app/package.json`:
  - `npm run cypress:open`
  - `npm run cypress:run`
  - `npm run cypress:run:real`
  - `npm run e2e`
- Specs mockeados actuales en `cypress/e2e/`: `pos-smoke.cy.js`, `pos-client-flow.cy.js`, `pos-cash-close.cy.js`, `pos-barista-flow.cy.js`.
- Specs backend-real actuales en `cypress/e2e-real/`: `pos-real-flow.cy.js`, `pos-real-cash-close.cy.js`, `pos-real-stock-insufficient.cy.js`.

## Alcance correcto

- Apertura de caja.
- Carga de catálogo.
- Agregar producto al pedido POS.
- Preview de orden.
- Confirmación de venta en efectivo.
- Cierre de caja, barista y cliente ya tienen cobertura Cypress mockeada.
- Suite E2E contra backend real con datos semilla reservados `E2E`.

## Fuera de alcance

- Registro público de usuario desde UI.
- Envío o dirección.
- Checkout multipaso de tienda online.
- Dashboard multipágina.
- Terminal bancaria real.

## Casos prioritarios

| ID | Caso | Tipo | Prioridad | Estado |
| --- | --- | --- | --- | --- |
| E2E-POS-001 | Apertura de caja + venta efectivo con mocks | Smoke | Crítico | Implementado |
| E2E-POS-002 | Venta POS + barista contra backend real | Integración E2E | Alto | Implementado |
| E2E-POS-007 | Cierre de caja contra backend real | Integración E2E | Alto | Implementado |
| E2E-POS-003 | Cierre de caja vendedor con mocks | E2E | Alto | Implementado |
| E2E-POS-004 | Barista completa orden pendiente con mocks | E2E | Alto | Implementado |
| E2E-POS-005 | Creación/selección de cliente en POS con mocks | E2E | Medio | Implementado |
| E2E-POS-006 | Stock insuficiente bloquea venta | E2E | Medio | Implementado; verificación runtime local pendiente tras reiniciar API |

## Datos mínimos para smoke mockeado

- Usuario vendedor: `EMP-001`.
- PIN: `12345`.
- Fondo inicial: `100`.
- Categoría: `Café`.
- Producto: `Americano`, precio `35`, stock `10`.
- Total preview: `40.60`.
- Monto recibido: `50`.

## Comandos

Desde `cafecito-app/`:

```bash
npm start
npm run cypress:open
npm run cypress:run
npm run e2e
npm run cypress:run:real
```

Para E2E real local:

1. Desde `cafecito-api/`: ejecutar `npm run seed:e2e`.
2. Levantar API desde `cafecito-api/`: `npm start` o `npm run dev`.
3. Levantar frontend desde `cafecito-app/`: `npm start`.
4. Ejecutar desde `cafecito-app/`: `npm run cypress:run:real`.
5. Si la API ya estaba corriendo antes del cambio de conexión Mongo, reiniciarla para que tome la URI con `retryWrites=false` cuando aplique.

Datos reservados del seed real:

- Vendedor: `EMP-9001` / PIN `12345`.
- Barista: `EMP-9002` / PIN `12345`.
- Categoría: `E2E Cafes`.
- Producto: `E2E Americano`, stock reseteado a `100`.
- Cliente: `e2e.cliente@e2e.local`.

## Última verificación

- `npm run cypress:run` desde `cafecito-app/`: 4 specs, 4 tests passing.
- `npm run cypress:run:real` desde `cafecito-app/`: 2 specs, 2 tests passing contra backend/Mongo local.
- `npx cypress run --spec "cypress/e2e-real/pos-real-stock-insufficient.cy.js" --env REAL_E2E=true`: spec agregado; la corrida contra el servidor vivo falló antes de la validación funcional porque la API activa seguía usando una conexión Mongo sin el ajuste nuevo.
- Los specs mockeados usan `cy.intercept`; el spec real no usa intercepts para API.

## Reglas

- No usar rutas no implementadas.
- No depender de datos reales en smoke mockeado.
- Toda prueba contra backend real debe usar datos reservados `E2E`; `npm run seed:e2e` limpia órdenes/sesiones asociadas antes de preparar datos.
- Preferir `data-testid` para elementos críticos del POS.
