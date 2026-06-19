# Plan Formal de Pruebas de Rendimiento y Estrés

## 1. Propósito

Definir una estrategia formal para validar rendimiento, capacidad y comportamiento bajo carga de `cafecito-api` en distintos ambientes, con foco en tiempo de respuesta, estabilidad y punto de saturación.

## 2. Objetivo de Calidad

- Validar la carga soportada por ambiente.
- Verificar que los endpoints críticos respondan en menos de `1s` en condiciones nominales y pico esperado.
- Identificar el punto de degradación bajo estrés controlado.
- Detectar regresiones de rendimiento entre ambientes.

## 3. Criterio Base de Aceptación

- Ningún endpoint debe superar `1000ms` en condiciones nominales o de carga esperada.
- La tasa de error debe mantenerse por debajo de `1%` durante pruebas nominales y de pico.
- No deben aparecer caídas del proceso, timeouts sostenidos ni respuestas `5xx` recurrentes.
- La degradación por encima de `1000ms` solo es aceptable en pruebas de estrés diseñadas para encontrar el límite del sistema.

## 4. Alcance

### 4.1 Endpoints incluidos

- `GET /health`
- `GET /`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/products`
- `GET /api/categories`
- `GET /api/clients/search`
- `GET /api/orders`
- `POST /api/orders/preview`
- `POST /api/orders`
- `POST /api/total-cash/open`
- `POST /api/total-cash/close`

### 4.2 Flujos funcionales cubiertos

- Lectura de catálogo.
- Autenticación y renovación de sesión.
- Flujo POS de previsualización y creación de orden.
- Apertura y cierre de caja.
- Búsqueda de clientes.

## 5. Ambientes y Expectativas

| Ambiente | Objetivo | Tipo de prueba permitido | Umbral operativo |
| --- | --- | --- | --- |
| Local | Validar scripts y smoke | Smoke | Sin caída, respuesta funcional |
| QA | Validar carga nominal | Smoke, carga, pico | `p95 < 1000ms` |
| Staging | Validar comportamiento cercano a preprod | Carga, pico, stress controlado | `p95 < 1000ms`, error `< 1%` |
| Preproducción | Validar capacidad final antes de release | Carga, pico, soak acotado | `p95 < 1000ms` |
| Producción | Solo validación mínima autorizada | Smoke muy acotado | Sin impacto operativo |

### Dependencia para QA/Staging

- Las fases QA, staging y preproducción requieren una `PERF_BASE_URL` publicada y accesible.
- Sin esa URL no se ejecutan pruebas reales de ambiente; solo quedan válidas las corridas locales.
- Si el ambiente existe pero no tiene credenciales/datos semilla, la fase queda bloqueada hasta completar esos insumos.

## 6. Herramienta Recomendada

- `k6` como herramienta principal de ejecución y medición.
- Reporte en `JSON` para trazabilidad y salida legible para revisión.
- Integración opcional con CI para ejecución en QA y preproducción.

## 7. Datos de Prueba

- Usuario administrador y usuario vendedor válidos.
- Categorías, productos y clientes semilla.
- Tokens válidos y renovables.
- Órdenes con payloads únicos por ejecución.
- Limpieza de datos al final de cada corrida en ambientes no persistentes.

## 8. Modelo de Carga

Distribución recomendada para carga nominal:

- 35% `GET /api/products`
- 15% `GET /api/categories`
- 10% `POST /api/auth/login`
- 10% `POST /api/orders/preview`
- 10% `POST /api/orders`
- 5% `GET /api/orders`
- 5% `POST /api/auth/refresh`
- 5% `POST /api/total-cash/open`
- 5% `POST /api/total-cash/close`

## 9. Tipos de Prueba

### 9.1 Smoke

- Objetivo: validar disponibilidad básica.
- Carga: 1 usuario virtual.
- Duración: 1 a 3 minutos.
- Endpoints: `GET /health`, `GET /`, `GET /api/products`.

### 9.2 Carga nominal

- Objetivo: validar operación normal.
- Carga: tráfico representativo del uso esperado.
- Duración: 15 a 20 minutos.
- Criterio: `p95 < 1000ms` y error `< 1%`.

### 9.3 Pico controlado

- Objetivo: validar el comportamiento en el máximo esperado por ambiente.
- Carga: incremento gradual hasta el pico objetivo.
- Duración: 10 minutos en el nivel máximo.
- Criterio: mantener latencia dentro de `1s` en el pico esperado.

### 9.4 Stress

- Objetivo: encontrar el punto de quiebre.
- Carga: subir por encima del pico esperado hasta degradación clara.
- Criterio: registrar en qué nivel se rompe el umbral de `1s`.

### 9.5 Soak

- Objetivo: detectar degradación progresiva, fugas o saturación de recursos.
- Carga: media sostenida.
- Duración: 2 a 4 horas.

### 9.6 Burst

- Objetivo: validar respuesta ante picos súbitos.
- Carga: ráfagas cortas y repetidas.
- Duración: ciclos de varios minutos.

## 10. Matriz de Escenarios

| ID | Escenario | Endpoint(s) | Tipo | Prioridad | Resultado esperado |
| --- | --- | --- | --- | --- | --- |
| PERF-001 | Disponibilidad básica | `/health`, `/` | Smoke | Alta | Respuesta exitosa y estable |
| PERF-002 | Catálogo público | `/api/products`, `/api/categories` | Carga | Alta | `p95 < 1000ms` |
| PERF-003 | Login concurrente | `/api/auth/login` | Carga/Pico | Alta | Autenticación estable sin errores masivos |
| PERF-004 | Refresh de token | `/api/auth/refresh` | Carga | Media | Renovación consistente y rápida |
| PERF-005 | POS preview | `/api/orders/preview` | Carga | Alta | Cálculo de totales bajo `1s` |
| PERF-006 | Creación de orden | `/api/orders` | Carga/Pico | Alta | Orden creada sin degradación funcional |
| PERF-007 | Búsqueda de clientes | `/api/clients/search` | Carga | Media | Respuesta estable y rápida |
| PERF-008 | Caja apertura/cierre | `/api/total-cash/open`, `/api/total-cash/close` | Pico | Alta | Flujo sin timeouts ni 5xx |
| PERF-009 | Lectura de órdenes | `/api/orders` | Carga | Media | Listado estable bajo concurrencia |

## 11. Métricas a Capturar

- `p50`, `p90`, `p95`, `p99`.
- Tiempo máximo de respuesta.
- Throughput por segundo.
- Tasa de error total y por código HTTP.
- Respuestas `401`, `403`, `429` y `5xx`.
- CPU, memoria, conexiones MongoDB y latencia de base de datos.

## 12. Criterios de Entrada

- Ambiente desplegado y estable.
- Datos semilla cargados.
- Variables de entorno correctas.
- Monitoreo habilitado en app y base de datos.
- Ventana de ejecución autorizada.

## 13. Criterios de Salida

- Se ejecutaron todos los escenarios planificados.
- Se documentaron métricas y hallazgos.
- Se identificó carga máxima estable por ambiente.
- Se registraron desviaciones de `1s` con contexto de causa probable.

## 14. Riesgos y Observaciones

- `POST /api/orders` y `POST /api/orders/preview` pueden competir por stock y escritura.
- `login` y `refresh` pueden incrementar carga de autenticación si se diseña mal la mezcla.
- Listados con filtros o paginación pueden esconder consultas lentas en MongoDB.
- Los picos no deben ejecutarse en producción sin autorización explícita.

## 15. Entregables

- Script automatizado de carga.
- Reporte por ambiente.
- Resumen de capacidad soportada.
- Lista de endpoints que exceden el umbral de `1s`.
- Recomendaciones de tuning si aparecen cuellos de botella.

## 16. Secuencia de Ejecución

1. Smoke.
2. Carga nominal.
3. Pico controlado.
4. Stress.
5. Soak.
6. Burst.

## 17. Resultados Locales

| Escenario | Estado | p95 | max | error rate | Nota |
| --- | --- | --- | --- | --- | --- |
| Smoke público | Completado | 8.76ms | 154.63ms | 0% | Línea base local inicial. |
| Nominal público | Completado | 29.95ms | 129.29ms | 0% | Dentro del SLA de 1s. |
| Auth | Completado | 86.55ms | 86.55ms | 0% | Login y refresh sin error. |
| Flow smoke POS | Completado | 52.65ms | 52.65ms | 0% | Abre caja, preview, crea orden y cierra caja. |
| Stress local | Completado | 114.79ms | 322.37ms | 0% | Degradación controlada sin fallos. |
| Soak local | Completado | 22.08ms | 94.65ms | 0% | Sin fatiga observable en la ventana corrida. |
| QA/Staging | Bloqueado | - | - | - | Falta `PERF_BASE_URL` pública. |

## 18. Resumen Ejecutivo

- La API cumple el objetivo de `1s` en todos los escenarios locales corridos.
- El comportamiento más costoso fue `stress`, pero siguió muy por debajo del umbral y sin errores.
- El flujo POS crítico completo pasó: abrir caja, previsualizar, crear orden y cerrar caja.
- El único bloqueo real para continuar fuera de local es la falta de una URL pública de QA/Staging.
