# Plan de Pruebas E2E POS

## Objetivo

Validar flujos críticos del POS Cafecito Feliz desde UI, sin introducir rutas o conceptos ajenos al producto.

## Estado actual

- Cypress inicializado.
- Scripts agregados en `cafecito-app/package.json`:
  - `npm run cypress:open`
  - `npm run cypress:run`
  - `npm run e2e`
- Primera prueba: `cypress/e2e/pos-smoke.cy.js`.

## Alcance correcto

- Apertura de caja.
- Carga de catálogo.
- Agregar producto al pedido POS.
- Preview de orden.
- Confirmación de venta en efectivo.
- Futuro: cierre de caja, barista y cliente.

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
| E2E-POS-002 | Apertura de caja + venta contra backend real | Integración E2E | Alto | Pendiente |
| E2E-POS-003 | Cierre de caja vendedor | E2E | Alto | Pendiente |
| E2E-POS-004 | Barista completa orden pendiente | E2E | Alto | Pendiente |
| E2E-POS-005 | Cliente seleccionado aplica descuento backend | E2E | Medio | Pendiente |
| E2E-POS-006 | Stock insuficiente bloquea venta | E2E | Medio | Pendiente |

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
```

## Reglas

- No usar rutas no implementadas.
- No depender de datos reales en smoke mockeado.
- Toda prueba contra backend real debe documentar seed y limpieza.
- Preferir `data-testid` para elementos críticos del POS.
