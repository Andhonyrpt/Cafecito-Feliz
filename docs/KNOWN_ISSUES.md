# Known Issues

Ultima revision: 2026-06-18.

Lista de bugs, inconsistencias y deuda confirmada o altamente probable. No incluye features deseadas sin evidencia.

## Criticos

| Issue | Tipo | Evidencia | Riesgo | Siguiente accion |
| --- | --- | --- | --- | --- |
| `orderNumber` usa `Order.countDocuments() + 1` | Bug concurrencia | Exploracion de backend | Numeros duplicados bajo concurrencia | Reemplazar por contador atomico |
| Creacion de orden no es transaccional | Deuda tecnica | Stock, orden y cliente se actualizan en pasos | Stock/cliente parcialmente actualizado ante fallo | Evaluar transacciones Mongo o compensacion robusta |
| Totales duplicados frontend/backend | Alineacion | `OrderContext` calcula y backend recalcula | Monto visible distinto al cobrado | Definir backend como total final |

## Altos

| Issue | Tipo | Evidencia | Riesgo | Siguiente accion |
| --- | --- | --- | --- | --- |
| `GET /api/orders/client/:clientId` falla por populate | Bug | Error real `StrictPopulateError` en logs de test | Historial por cliente roto | Corregir populate y agregar test |
| Servicio frontend de ordenes por cliente usa ruta ambigua | Bug | `orderSevice.js` usa patrones `orders/:id` | Llama endpoint incorrecto | Usar `/orders/client/:clientId` |
| Caja duplicada local/backend | Alineacion | `openedAt` e `initialCash` en localStorage y `CashSession` en DB | Cierre con datos stale | Hidratar desde backend |
| Posibles multiples sesiones de caja abiertas | Bug | No se evidencio bloqueo | Arqueos inconsistentes | Agregar regla y test si aplica |
| Logout no revoca refresh token | Seguridad | `logout` responde exito sin invalidacion persistente | Sesion reutilizable | Definir token store o `tokenVersion` |
| `AGENTS.testing.md` backend incorrecto | Documentacion | Habla de Vitest | Tests incompatibles | Archivar/reescribir |
| `AGENTS.testing.md` frontend desactualizado | Documentacion | Cypress fue inicializado, pero la guia describe flujos/selectores no confirmados | Falsa expectativa E2E | Archivar/reescribir |

## Medios

| Issue | Tipo | Evidencia | Riesgo | Siguiente accion |
| --- | --- | --- | --- | --- |
| Cache de productos puede quedar stale | Bug potencial | `sessionStorage` 5 minutos | Stock/categoria viejos | Invalidar en cambios administrativos o reducir scope |
| `setLogoutCallback` no aparece registrado | Bug potencial | `http.js` lo soporta, no se evidencio uso | Refresh fallido no fuerza logout UI | Registrar callback o remover |
| Paths de servicios inconsistentes | Refactor | Mezcla `/path` y `path` | Errores sutiles de URL | Normalizar estilo |
| Frontend usa `alert()` | Deuda UX | Componentes de flujo POS | Mala experiencia/error handling | Estados de error y mensajes inline |
| Cypress inicializado sin alcance E2E formal | Deuda QA | Existen archivos generados por `npx cypress open`, pero falta script y casos POS utiles | Confusion | Definir alcance, agregar script y pruebas o remover si no se usara |
| Frontend con cobertura minima | Deuda QA | Solo `src/App.test.js` | Regresiones UI/context | Agregar tests criticos |

## Bajos

| Issue | Tipo | Evidencia | Siguiente accion |
| --- | --- | --- | --- |
| `orderSevice.js` mal escrito | Refactor | Nombre de archivo actual | Renombrar y actualizar imports |
| Logs debug en caja | Deuda tecnica | Salida de tests muestra logs | Remover o proteger por entorno |
| Keys `storageService` sin separador | Refactor | `cafecitoorder`, `cafecitoactive_client` | Revisar si se cambia formato |
