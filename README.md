# Cafecito Feliz

## Estado de pruebas

La suite actual de API usa Jest, Supertest y `mongodb-memory-server` con replica set en memoria para cubrir transacciones MongoDB.

La creación de órdenes usa transacciones; el MongoDB local o desplegado debe soportarlas, por ejemplo ejecutándose como replica set. La conexión del API ahora agrega `retryWrites=false` cuando falta en la URI para evitar fallos en despliegues locales que no soportan retryable writes.

Última verificación ejecutada:

```bash
cd cafecito-api
npm run test:coverage
```

Resultado observado: 17 suites y 158 tests pasando; cobertura global sobre umbrales de Jest, con branch coverage global en 66.39%.

Frontend verificado con `npm test -- --watchAll=false`: 5 suites y 9 tests pasando.

Cypress está configurado en `cafecito-app/` con specs mockeados para smoke POS, cliente, cierre de caja y barista en `cypress/e2e/`.

E2E real local verificado con `npm run seed:e2e` en `cafecito-api/`, API en `http://localhost:3001`, frontend en `http://localhost:3000`, y `npm run cypress:run:real` en `cafecito-app/`: 2 specs y 2 tests pasando contra backend/Mongo local.

Existe además un spec real nuevo para stock insuficiente en `cypress/e2e-real/pos-real-stock-insufficient.cy.js`; su revalidación requiere reiniciar la API local si estaba corriendo antes del ajuste de conexión Mongo.
