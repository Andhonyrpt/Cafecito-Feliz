# Auditoria de Documentacion

Ultima revision: 2026-06-18.

Este documento separa documentacion vigente, recuperable, obsoleta y redundante. La fuente de verdad prioritaria es el codigo real y la configuracion ejecutable.

## Inventario Revisado

| Documento | Estado | Recomendacion |
| --- | --- | --- |
| `README.md` | Util, con cifras de tests obsoletas | Actualizar |
| `cafecito-app/README.md` | Vigente y breve | Conservar |
| `SPECIFICATIONS.md` | Parcialmente vigente | Actualizar o reemplazar por `docs/PRODUCT_SPEC.md` |
| `POSSIBLE_IMPROVEMENTS.md` | Util como fuente de backlog | Consolidar en `docs/BACKLOG.md` |
| `AGENTS.md` | Guia operativa vigente | Conservar |
| `cafecito-api/AGENTS.md` | Guia backend util | Conservar |
| `cafecito-app/AGENTS.md` | Guia frontend util | Conservar |
| `cafecito-api/AGENTS.testing.md` | Incorrecto: habla de Vitest, pero el API usa Jest | Archivar o reescribir |
| `cafecito-app/AGENTS.testing.md` | Desactualizado: Cypress ya fue inicializado, pero la guia describe flujos/selectores no confirmados | Archivar o reescribir |
| `QA_BACKEND_TEST_PLAN.md` | Plan QA backend util | Conservar |
| `QA_BACKEND_PROGRESS.md` | Bitacora QA util | Conservar |
| `QA_BACKEND_PERFORMANCE_*` | Util, pero local-only | Consolidar resumen y dejar evidencia |
| `cafecito-api/SECURITY_*` | Vigente y valioso | Conservar |
| `docs/skills/*.md` | Material generico, no spec del producto | Archivar como referencia generica |

## Documentacion Vigente

- `cafecito-app/README.md`: comandos, stack y flujo principal del frontend.
- `QA_BACKEND_TEST_PLAN.md`: estrategia de pruebas backend.
- `QA_BACKEND_PROGRESS.md`: evidencia historica del avance de QA.
- `QA_BACKEND_PERFORMANCE_EVIDENCE.md`: resultados locales de performance.
- `cafecito-api/SECURITY_TEST_PLAN.md`, `SECURITY_TEST_MATRIX.md`, `SECURITY_PROGRESS.md`: estado y pendientes de seguridad.
- `AGENTS.md`: reglas operativas del repositorio.

## Documentacion Desactualizada Pero Recuperable

- `README.md`: conserva estructura y comandos, pero reporta `7 suites y 40 tests`; la verificacion real actual dio API `17 suites / 123 tests` y frontend `1 suite / 1 test`.
- `SPECIFICATIONS.md`: buena base, pero auth, seguridad y pruebas quedaron atrasadas frente al codigo actual.
- `POSSIBLE_IMPROVEMENTS.md`: contiene deuda valida, pero algunas entradas ya cambiaron por trabajo de QA/seguridad.

## Documentacion Obsoleta o Contradictoria

- `cafecito-api/AGENTS.testing.md`: contradice `package.json` y `jest.config.js`; no se debe usar para escribir tests actuales.
- `cafecito-app/AGENTS.testing.md`: describe una suite Cypress con flujos/selectores no confirmados. Cypress fue inicializado con `npx cypress open`, pero aun falta definir scripts, alcance y casos reales del POS.
- `SPECIFICATIONS.md`: cifras de tests obsoletas y varios puntos de auth/seguridad no reflejan remediaciones recientes.
- `docs/skills/SSDLC_SystemPrompt.md`: contiene instrucciones genericas como `git checkout develop && git pull`; no deben tratarse como reglas de este repo.

## Riesgos de Mantener Documentacion Incorrecta

- Crear tests nuevos con Vitest en un backend Jest.
- Asumir que Cypress ya tiene una suite E2E util y alineada al POS solo porque existen archivos generados.
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
- Futuros documentos sugeridos: `docs/API_MAP.md`, `docs/DATA_MODEL.md`, `docs/BUSINESS_RULES.md`, `docs/DECISIONS.md`.
