# Cafecito Feliz

Punto de venta para Cafecito Feliz. El repositorio contiene dos paquetes Node separados: una API Express/MongoDB y una aplicación frontend Create React App para operación de caja/POS.

## Estructura

- `cafecito-api/`: API REST con Express 5, Mongoose, JWT, validaciones con `express-validator` y pruebas Jest/Supertest.
- `cafecito-app/`: frontend React para apertura/cierre de turno, catálogo, pedido POS, cliente activo y checkout de caja.
- `docs/INDEX.md`: índice maestro de documentación vigente.
- `docs/PRODUCT_SPEC.md`: especificación funcional y técnica vigente del POS.
- `docs/BACKLOG.md`: backlog priorizado y pendiente accionable.
- `docs/GOVERNANCE.md`: reglas de gobernanza documental y multiagente.
- `docs/SPECIFICATIONS.md`: especificación técnica derivada del código actual; usar `docs/PRODUCT_SPEC.md` como fuente principal.
- `docs/POSSIBLE_IMPROVEMENTS.md`: mejoras candidatas históricas detectadas durante análisis previos.

## Comandos

Ejecuta comandos dentro de cada paquete; no hay workspace raíz.

API:

```bash
cd cafecito-api
npm install
npm run dev
npm test
```

Frontend:

```bash
cd cafecito-app
npm install
npm start
npm run build
npm test -- --watchAll=false
npm run cypress:run
```

## Variables de entorno

La API documenta sus variables en `cafecito-api/.env.example`: `PORT`, `NODE_ENV`, `MONGODB_URI`, `MONGODB_DB` y `CORS_ORIGIN`.

El frontend usa `REACT_APP_API_URL` como base URL de la API.

## Estado de pruebas

La suite actual de API usa Jest, Supertest y `mongodb-memory-server`.

Última verificación ejecutada:

```bash
cd cafecito-api
npm test
```

Resultado observado: 17 suites y 123 tests pasando.

Frontend verificado con `npm test -- --watchAll=false`: 1 suite y 1 test pasando.

Cypress está configurado en `cafecito-app/` con smoke POS mockeado en `cypress/e2e/pos-smoke.cy.js`.
