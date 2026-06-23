# Known Issues

Ultima revision: 2026-06-22.

Lista de bugs, inconsistencias y deuda confirmada o altamente probable. No incluye features deseadas sin evidencia.

## Criticos

| Issue | Tipo | Evidencia | Riesgo | Siguiente accion |
| --- | --- | --- | --- | --- |
| Totales duplicados frontend/backend | Alineacion | `OrderContext` calcula y backend recalcula | Monto visible distinto al cobrado | Definir backend como total final |

## Altos

| Issue | Tipo | Evidencia | Riesgo | Siguiente accion |
| --- | --- | --- | --- | --- |
| Caja duplicada local/backend | Alineacion | `openedAt` e `initialCash` en localStorage y `CashSession` en DB | Cierre con datos stale | Hidratar desde backend |
| Posibles multiples sesiones de caja abiertas | Bug | No se evidencio bloqueo | Arqueos inconsistentes | Agregar regla y test si aplica |
| Logout no revoca refresh token | Seguridad | `logout` responde exito sin invalidacion persistente | Sesion reutilizable | Definir token store o `tokenVersion` |
| `AGENTS.testing.md` frontend requiere mantenimiento | Documentacion | Debe mantenerse alineado al POS y al smoke Cypress actual | Falsa expectativa E2E | Actualizar junto con nuevos E2E |
| Documentacion QA/performance historica pendiente de consolidacion | Documentacion | `docs/qa/QA_BACKEND_*` convive con `docs/QA_STRATEGY.md` | Fuentes paralelas | Consolidar resumen canonico y archivar evidencia si aplica |

## Medios

| Issue | Tipo | Evidencia | Riesgo | Siguiente accion |
| --- | --- | --- | --- | --- |
| Cache de productos puede quedar stale | Bug potencial | `sessionStorage` 5 minutos | Stock/categoria viejos | Invalidar en cambios administrativos o reducir scope |
| `setLogoutCallback` no aparece registrado | Bug potencial | `http.js` lo soporta, no se evidencio uso | Refresh fallido no fuerza logout UI | Registrar callback o remover |
| Paths de servicios inconsistentes | Refactor | Mezcla `/path` y `path` | Errores sutiles de URL | Normalizar estilo |
| Frontend usa `alert()` | Deuda UX | Componentes de flujo POS | Mala experiencia/error handling | Estados de error y mensajes inline |
| E2E real no cubre stock insuficiente | Deuda QA | Existen flujos reales de venta POS + barista y cierre de caja | Cobertura incompleta | Agregar escenario backend-real de stock insuficiente |
| Frontend con cobertura minima | Deuda QA | Hay tests para App, ClientSelector y OrderContext | Regresiones UI/context | Agregar tests de SessionContext, HTTP/token refresh y checkout |

## Bajos

| Issue | Tipo | Evidencia | Siguiente accion |
| --- | --- | --- | --- |
| `orderSevice.js` mal escrito | Refactor | Nombre de archivo actual | Renombrar y actualizar imports |
| Logs debug en caja | Deuda tecnica | Salida de tests muestra logs | Remover o proteger por entorno |
| Keys `storageService` sin separador | Refactor | `cafecitoorder`, `cafecitoactive_client` | Revisar si se cambia formato |
