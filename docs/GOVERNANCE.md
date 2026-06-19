# Gobernanza Documental y Multiagente

## Propósito

Definir cómo se crean, modifican, revisan y archivan los artefactos documentales y multiagente de Cafecito Feliz POS.

## Precedencia documental

1. Código real, tests y configuración ejecutable.
2. `docs/PRODUCT_SPEC.md`.
3. `docs/BACKLOG.md` y `docs/KNOWN_ISSUES.md`.
4. Specs en `docs/specs/`.
5. QA y seguridad: `docs/QA_STRATEGY.md`, `docs/SECURITY_STATUS.md`.
6. Subagentes y workflows: `.agents/`.
7. Skills genéricas en `docs/skills/`.
8. Archivo histórico en `docs/archive/`.

Si un documento contradice el código real, se corrige el documento o se registra el gap. No se implementa contra documentación obsoleta.

## Convenciones de creación

| Artefacto | Ubicación | Naming | Trigger |
| --- | --- | --- | --- |
| Spec | `docs/specs/` | `YYYY-MM-DD-tipo-nombre.md` | Nuevo pendiente ejecutable |
| Test plan | `docs/test-plans/` | `area-flujo.md` | Nuevo flujo de QA |
| ADR | `docs/adrs/` | `ADR-NNN-titulo.md` | Decisión arquitectónica |
| Contract | `docs/contracts/` | `modulo-contrato.md` | Cambio o formalización de API |
| Runbook | `docs/runbooks/` | `operacion.md` | Operación repetible |
| Threat model | `docs/threat-models/` | `modulo-stride.md` | Riesgo de seguridad relevante |
| Archivo | `docs/archive/` | conservar nombre + contexto | Documento obsoleto o histórico |

## Reglas de modificación

- Toda modificación debe indicar qué fuente de verdad cambia.
- Todo cambio de flujo funcional debe revisar `PRODUCT_SPEC`, `BACKLOG`, QA y specs relacionadas.
- Todo cambio de endpoint debe revisar contratos, tests y docs.
- Todo cambio de seguridad debe revisar `SECURITY_STATUS` y threat models si existen.
- Toda nueva deuda o gap debe registrarse en `BACKLOG` o `KNOWN_ISSUES`.

## Reglas de archivado

- No borrar documentación histórica de forma destructiva sin autorización.
- Mover a `docs/archive/` o marcar como deprecated antes de eliminar.
- Un documento archivado debe indicar motivo y reemplazo si existe.
- Un documento archivado no puede ser fuente de verdad.

## Reglas para specs

- Un spec representa una sola unidad de trabajo.
- Regla obligatoria: `1 pendiente = 1 spec = 1 rama = 1 PR`.
- Todo spec debe incluir alcance, CAs, STRIDE, riesgos, pendientes y matriz de cierre.
- Un spec no se cierra sin resultados y backlog derivado cuando corresponda.

## Reglas para subagentes

- El Orchestrator prioriza e integra.
- Los subagentes ejecutan unidades acotadas.
- Ningún subagente redefine alcance global.
- Ningún subagente trabaja fuera del backlog aprobado.
- El implementador no se autoaprueba.
- Hallazgos nuevos se escalan como propuesta.

## Reglas para IA y Vibe Coding

- No inventar archivos, rutas, endpoints, modelos, librerías ni contratos.
- No asumir comportamiento si no está en código real, spec vigente o test.
- No describir el producto como e-commerce; es un POS.
- Validar con `Glob`, `Grep`, lectura de archivos y comandos reales antes de afirmar.
- Separar borradores, experimentos y canon.
- No cerrar tareas sin evidencia verificable.
- Explicar brevemente tradeoffs cuando haya más de una solución viable.

## Quality gates documentales

- `docs/INDEX.md` referencia el artefacto nuevo si es canónico.
- `docs/BACKLOG.md` refleja pendientes accionables.
- `docs/KNOWN_ISSUES.md` refleja bugs/deuda confirmada.
- Specs cerrados tienen resultados y matriz de cierre.
- Documentos obsoletos están archivados o marcados.

## Mantenimiento continuo

- Revisar gobernanza al cambiar SSDLC o modelo multiagente.
- Revisar índice al crear una nueva carpeta documental.
- Revisar backlog al cerrar specs.
- Revisar QA al agregar/quitar suites de prueba.
