# Guía de Testing - Cafecito API

Esta API usa Jest, Supertest y MongoMemoryServer. No usar Vitest en este paquete.

## Comandos

Ejecutar siempre desde `cafecito-api/`:

```bash
npm test
npm test -- tests/auth.test.js
npm run test:watch
npm run test:coverage
```

## Configuración real

- Runner: Jest con `node --experimental-vm-modules`.
- Config: `jest.config.js`.
- Setup: `tests/setup/setup.js`.
- Base de datos: `mongodb-memory-server`.
- Entorno: `NODE_ENV=test` vía `cross-env`.
- Imports del backend: ESM con extensión `.js`.

## Patrones de pruebas

- Tests de integración API usan Supertest contra `app` exportada por `server.js`.
- Tests unitarios viven bajo `tests/unit/`.
- Helpers reutilizables viven bajo `tests/helpers/`.
- No usar una base Mongo real para la suite automatizada.
- No depender de orden entre archivos.

## Helpers existentes

Revisar antes de crear nuevos helpers:

- `tests/helpers/factories.js`
- `tests/helpers/auth.js`
- `tests/helpers/http.js`
- `tests/helpers/express.js`

## Checklist por endpoint

- Happy path.
- Validación `422`.
- No autenticado `401` cuando aplique.
- Sin permisos `403` cuando aplique.
- No encontrado `404` cuando aplique.
- Duplicados o errores de dominio.
- Errores inesperados delegados a `next(error)`.
- Regresión de seguridad si toca auth, roles, tokens, caja, órdenes, clientes o stock.

## Reglas

- No importar desde `vitest`.
- No usar globals o mocks de Vitest como `vi`.
- No crear tests que documenten bugs como comportamiento deseado sin registrarlo en `docs/KNOWN_ISSUES.md` o en el spec.
- Si un test genera cambios en `logs/error.log`, limpiar el artefacto antes de cerrar la tarea.
- Si cambia un contrato API, actualizar docs y tests relacionados.
