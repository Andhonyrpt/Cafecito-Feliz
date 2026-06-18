# Evidencia de Pruebas de Rendimiento

## Alcance

Este reporte resume las corridas locales ejecutadas contra `cafecito-api` usando `QA_BACKEND_PERFORMANCE_RUNNER.mjs`.

## Ambiente

- Base URL: `http://localhost:3001`
- API levantada localmente en el entorno del repo
- Runner: Node.js script propio del repositorio

## Resultados

| Escenario | Estado | p95 | max | error rate | Resultado |
| --- | --- | --- | --- | --- | --- |
| Smoke público | Completado | 8.76ms | 154.63ms | 0% | Pass |
| Nominal público | Completado | 29.95ms | 129.29ms | 0% | Pass |
| Auth | Completado | 86.55ms | 86.55ms | 0% | Pass |
| Flow smoke POS | Completado | 52.65ms | 52.65ms | 0% | Pass |
| Stress local | Completado | 114.79ms | 322.37ms | 0% | Pass informativo |
| Soak local | Completado | 22.08ms | 94.65ms | 0% | Pass |

## Hallazgos

- El SLA local de `1s` se cumple con margen amplio en todos los escenarios ejecutados.
- El escenario de stress mostró degradación esperada, pero no alcanzó el umbral crítico.
- El flujo POS completo se validó de extremo a extremo.
- El runner inicial mezcló auth con tráfico público y disparó rate limits; se separaron escenarios para obtener métricas útiles.
- No existe una URL pública conocida de QA/Staging en el repo ni fue proporcionada por el usuario.

## Riesgos

- La comparación contra QA/Staging sigue pendiente por falta de `PERF_BASE_URL` pública.
- El rate limit de auth puede distorsionar escenarios mixtos si se vuelve a mezclar tráfico sin segmentación.

## Recomendaciones

- Mantener el runner actual como baseline local de regresión.
- Ejecutar QA/Staging tan pronto exista una URL pública publicada.
- Conservar escenarios separados: público, auth y flujo POS.
- Repetir `stress` y `soak` después de cambios en auth, catálogo u órdenes.
