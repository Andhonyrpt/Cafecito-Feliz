# Feature Flow

Extiende el SSDLC vigente sin reemplazarlo. Usar para features del POS aprobadas en backlog.

## Secuencia

1. Orchestrator selecciona pendiente del backlog.
2. Spec Writer crea spec con historia SMART, STRIDE, alcance y CAs.
3. Anti-Hallucination Reviewer valida que no haya rutas, contratos o pantallas inventadas.
4. Architecture Reviewer se invoca si hay cambio estructural o ADR.
5. Frontend Builder y/o Backend Builder implementan una unidad acotada.
6. QA Test Designer define y/o valida pruebas.
7. Security Reviewer revisa si hay auth, datos sensibles, caja, ordenes o permisos.
8. Code Reviewer revisa diff y evidencia.
9. Docs Keeper actualiza documentación y backlog derivado.
10. Orchestrator consolida integración y prepara PR.

## Regla central

1 pendiente = 1 spec = 1 rama = 1 PR.

## Quality gates mínimos

- Spec aprobado.
- Tests relevantes ejecutados.
- Diff revisado.
- CAs verificados.
- Spec cerrado con resultados y pendientes.
