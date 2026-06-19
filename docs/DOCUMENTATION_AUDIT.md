# Auditoria de Documentacion

Ultima revision: 2026-06-18.

Este documento separa documentacion vigente, recuperable, obsoleta y redundante. La fuente de verdad prioritaria es el codigo real y la configuracion ejecutable.

## Inventario Revisado

| Documento | Estado | Recomendacion |
| --- | --- | --- |
| `README.md` | Util, con cifras de tests obsoletas | Actualizar |
| `cafecito-app/README.md` | Vigente y breve | Conservar |
| `docs/SPECIFICATIONS.md` | Parcialmente vigente como referencia derivada | Consolidar o reemplazar por `docs/PRODUCT_SPEC.md` |
| `docs/POSSIBLE_IMPROVEMENTS.md` | Util como fuente historica de backlog | Consolidar en `docs/BACKLOG.md` |
| `AGENTS.md` | Guia operativa vigente | Conservar |
| `cafecito-api/AGENTS.md` | Guia backend util | Conservar |
| `cafecito-app/AGENTS.md` | Guia frontend util | Conservar |
| `cafecito-api/AGENTS.testing.md` | Actualizado para Jest/Supertest/MongoMemoryServer | Conservar |
| `cafecito-app/AGENTS.testing.md` | Actualizado para POS y smoke Cypress inicial | Conservar |
| `docs/INDEX.md` | Indice maestro agregado | Conservar |
| `docs/GOVERNANCE.md` | Gobernanza documental y multiagente agregada | Conservar |
| `.agents/` | Capa multiagente operativa | Conservar alineada al SSDLC |
| `docs/qa/QA_BACKEND_TEST_PLAN.md` | Plan QA backend util | Conservar como detalle historico |
| `docs/qa/QA_BACKEND_PROGRESS.md` | Bitacora QA util | Conservar como detalle historico |
| `docs/qa/QA_BACKEND_PERFORMANCE_*` | Util, pero local-only | Conservar evidencia y resumir en `docs/QA_STRATEGY.md` |
| `cafecito-api/SECURITY_*` | Vigente y valioso | Conservar |
| `docs/skills/*.md` | Material generico, no spec del producto | Archivar como referencia generica |

## Documentacion Vigente

- `cafecito-app/README.md`: comandos, stack y flujo principal del frontend.
- `docs/qa/QA_BACKEND_TEST_PLAN.md`: estrategia detallada de pruebas backend.
- `docs/qa/QA_BACKEND_PROGRESS.md`: evidencia historica del avance de QA.
- `docs/qa/QA_BACKEND_PERFORMANCE_EVIDENCE.md`: resultados locales de performance.
- `cafecito-api/SECURITY_TEST_PLAN.md`, `SECURITY_TEST_MATRIX.md`, `SECURITY_PROGRESS.md`: estado y pendientes de seguridad.
- `AGENTS.md`: reglas operativas del repositorio.

## Documentacion Desactualizada Pero Recuperable

- `README.md`: actualizado con referencias a docs canonicos y estado de pruebas verificado.
- `docs/SPECIFICATIONS.md`: buena base derivada del codigo; debe quedar subordinado a `docs/PRODUCT_SPEC.md` y consolidarse para evitar doble fuente.
- `docs/POSSIBLE_IMPROVEMENTS.md`: contiene deuda valida, pero algunas entradas ya cambiaron por trabajo de QA/seguridad.

## Documentacion Obsoleta o Contradictoria

- `cafecito-api/AGENTS.testing.md`: actualizado para Jest; no usar versiones anteriores que mencionen Vitest.
- `cafecito-app/AGENTS.testing.md`: actualizado para POS. Cypress ya tiene scripts y smoke mockeado; falta ampliar cobertura a backend real, cierre de caja y barista.
- Cualquier documento que describa registro publico, envio, dashboard, checkout por pasos o e-commerce debe corregirse o archivarse si no corresponde al POS real.
- `docs/SPECIFICATIONS.md`: ya no debe crecer como fuente paralela; si contiene detalles utiles, moverlos a `docs/PRODUCT_SPEC.md`, `docs/contracts/` o `docs/runbooks/`.
- `docs/skills/SSDLC_SystemPrompt.md`: contiene instrucciones genericas como `git checkout develop && git pull`; no deben tratarse como reglas de este repo.

## Riesgos de Mantener Documentacion Incorrecta

- Reintroducir guias de Vitest en un backend Jest.
- Asumir que el smoke Cypress mockeado cubre persistencia real o todos los flujos críticos del POS.
- Implementar contra contratos viejos de auth o caja.
- Perder tiempo buscando pantallas o flujos no implementados.
- Ocultar bugs reales por confiar en specs antiguas.

## Estructura Documental Recomendada

- `README.md`: setup rapido, paquetes, comandos y links.
- `docs/PRODUCT_SPEC.md`: spec funcional y tecnica vigente.
- `docs/BACKLOG.md`: backlog priorizado.
- `docs/KNOWN_ISSUES.md`: bugs y deuda confirmada.
- `docs/QA_STRATEGY.md`: estrategia y estado de pruebas.
- `docs/SECURITY_STATUS.md`: seguridad aplicada y pendientes.
- `docs/INDEX.md`: entrada documental canonica.
- `docs/GOVERNANCE.md`: reglas de mantenimiento, archivado y precedencia.
- `docs/adrs/`: decisiones arquitectonicas.
- `docs/contracts/`: contratos API/datos.
- `docs/runbooks/`: procedimientos operativos.
- `docs/threat-models/`: modelos STRIDE.
- `docs/archive/`: documentos historicos o deprecados.
