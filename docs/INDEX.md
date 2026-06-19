# Índice Maestro del Proyecto

Este índice es la puerta de entrada documental para Cafecito Feliz. El producto es un POS de cafetería, no un e-commerce multipágina.

## Fuentes principales

| Área | Archivo | Uso | Cuándo actualizar |
| --- | --- | --- | --- |
| Producto | `docs/PRODUCT_SPEC.md` | Estado funcional y técnico del POS | Cambios de alcance, módulos o reglas |
| Especificación técnica | `docs/SPECIFICATIONS.md` | Referencia técnica derivada del código | Consolidar hacia docs canónicos cuando cambie |
| Backlog | `docs/BACKLOG.md` | Fuente de pendientes priorizados | Todo nuevo gap accionable |
| Mejoras históricas | `docs/POSSIBLE_IMPROVEMENTS.md` | Ideas y deuda detectada antes de consolidar backlog | Al revisar o migrar mejoras al backlog |
| Issues | `docs/KNOWN_ISSUES.md` | Bugs/deuda confirmada | Bug nuevo, fix o cambio de severidad |
| QA | `docs/QA_STRATEGY.md` | Estrategia de pruebas | Cambios en test suites, comandos o cobertura |
| Seguridad | `docs/SECURITY_STATUS.md` | Controles y pendientes de seguridad | Cambios en auth, roles, tokens, validaciones |
| Auditoría documental | `docs/DOCUMENTATION_AUDIT.md` | Estado de documentos existentes | Nueva limpieza o archivo documental |
| SSDLC | `docs/skills/SSDLC_SystemPrompt.md` | Protocolo operativo obligatorio | Cambios al proceso de trabajo |
| Subagentes | `.agents/orchestrator.md` y `.agents/roles/` | Roles IA y responsabilidades | Cambios en modelo multiagente |

## Artefactos por carpeta

| Carpeta | Propósito | Dueño operativo |
| --- | --- | --- |
| `.agents/` | Sistema de subagentes, workflows, templates y checklists | Orchestrator |
| `docs/specs/` | Specs por unidad de trabajo | Spec Writer + Docs Keeper |
| `docs/test-plans/` | Planes de prueba | QA Test Designer |
| `docs/qa/` | Planes, bitácoras y evidencia QA backend histórica | QA Test Designer |
| `docs/adrs/` | Decisiones arquitectónicas | Architecture Reviewer |
| `docs/contracts/` | Contratos API/eventos/datos | Backend/Frontend Builder |
| `docs/runbooks/` | Procedimientos operativos | Release/Observability |
| `docs/threat-models/` | Modelos STRIDE y seguridad | Security Reviewer |
| `docs/archive/` | Documentos históricos/deprecados | Docs Keeper |
| `docs/skills/` | Skills y guías de apoyo | Docs Keeper |

## Estado actual de E2E

- Cypress está configurado en `cafecito-app`.
- Smoke POS: `cafecito-app/cypress/e2e/pos-smoke.cy.js`.
- Plan: `docs/test-plans/e2e-pos.md`.
- El smoke usa API mockeada; no reemplaza pruebas contra backend real.

## Reglas rápidas

- Código real y configuración ejecutable tienen prioridad sobre documentación antigua.
- No usar documentación archived/deprecated como fuente de verdad.
- Todo pendiente accionable debe entrar a `docs/BACKLOG.md`.
- Todo cambio de arquitectura requiere ADR.
- Todo cambio de contrato debe actualizar `docs/contracts/` cuando exista contrato formal.
- Todo uso de IA debe validar contra archivos reales del repo.
