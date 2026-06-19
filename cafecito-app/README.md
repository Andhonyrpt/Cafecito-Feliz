# Cafecito App

Frontend React del punto de venta de Cafecito Feliz.

## Stack

- Create React App (`react-scripts`)
- React 19
- React Router DOM 7
- Axios mediante `src/services/http.js`
- `lucide-react` para iconos dinámicos

## Comandos

```bash
npm install
npm start
npm run build
npm test -- --watchAll=false
npm run cypress:open
npm run cypress:run
```

## Configuración

- `REACT_APP_API_URL`: base URL de la API usada por `src/services/http.js`.
- La sesión usa `localStorage` para `authToken`, `refreshToken`, `openedAt` e `initialCash`.
- El pedido POS en curso usa `localStorage` para `order` y `active_client`.
- El catálogo cachea productos por página/categoría en `sessionStorage` durante 5 minutos.

## Flujo principal

`src/components/App/App.jsx` monta `OrderProvider`, `SessionProvider`, `BrowserRouter`, `Layout` y la ruta `/` con `Home`.

`Home` carga categorías y productos desde la API. El usuario agrega productos al pedido, selecciona cliente opcional, define método de pago y tipo de orden desde `OrderPanel`.

El checkout primero llama `previewOrder()` para calcular totales en backend y después `createOrder()` al confirmar el pago.

## E2E

Cypress tiene un smoke POS mockeado en `cypress/e2e/pos-smoke.cy.js`. Valida apertura de caja, carga de catálogo, agregado de producto, preview y creación de orden desde UI con API mockeada. No reemplaza pruebas contra backend real.

## Servicios

Todas las llamadas HTTP deben pasar por módulos de `src/services/` y por la instancia compartida `http`. Esa instancia agrega el token Bearer y reintenta con `auth.refresh()` en errores `401`/`403` cuando aplica.

Nota: el archivo de servicio de órdenes se llama `orderSevice.js` en el código actual.
