# Cafecito Feliz

Punto de venta para Cafecito Feliz. El repositorio contiene dos paquetes Node separados: una API Express/MongoDB y una aplicación frontend Create React App para operación de caja/POS.

## Estructura

- `cafecito-api/`: API REST con Express 5, Mongoose, JWT, validaciones con `express-validator` y pruebas Jest/Supertest.
- `cafecito-app/`: frontend React para apertura/cierre de turno, catálogo, carrito, cliente activo y checkout.
- `SPECIFICATIONS.md`: especificación técnica y funcional derivada del código actual.
- `POSSIBLE_IMPROVEMENTS.md`: mejoras candidatas detectadas durante el análisis.

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

Resultado observado: 7 suites y 40 tests pasando.
