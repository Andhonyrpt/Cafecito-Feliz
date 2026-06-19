# SSDLC Workflow

Fuente canónica: `docs/skills/SSDLC_SystemPrompt.md`.

Este archivo existe para conectar la capa `.agents/` con el SSDLC vigente del proyecto. No reemplaza el protocolo principal.

## Secuencia obligatoria

1. Lectura de contexto.
2. Clasificación y STRIDE.
3. Historia SMART.
4. Spec Driven Design.
5. Gestión de rama.
6. Skill Audit.
7. Implementación segura.
8. Verificación y quality gates.
9. Prueba funcional.
10. Pull Request.
11. Cierre documental estricto.
12. Baseline oficial cuando aplique.
13. Ejecución con subagentes después del baseline.

## Regla multiagente

`1 pendiente = 1 spec = 1 rama = 1 PR`.

El Orchestrator interpreta backlog e integra. Los subagentes ejecutan unidades delimitadas y devuelven evidencia.
