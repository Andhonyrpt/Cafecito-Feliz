# Bugfix Flow

Extiende el SSDLC vigente para correcciones de bugs confirmados o altamente reproducibles.

## Secuencia

1. Orchestrator confirma que el bug existe en backlog o `docs/KNOWN_ISSUES.md`.
2. Spec Writer crea spec de bugfix con reproducción, impacto y CAs.
3. Anti-Hallucination Reviewer valida evidencia del bug.
4. Backend Builder o Frontend Builder corrige solo el alcance del bug.
5. QA Test Designer define regresión.
6. Security Reviewer participa si el bug afecta auth, datos, caja, ordenes o permisos.
7. Code Reviewer valida que no haya cambios colaterales.
8. Docs Keeper actualiza known issues/backlog/spec.
9. Orchestrator decide integración.

## Reglas

- No convertir bugfix en refactor amplio.
- No corregir bugs vecinos sin backlog/spec propio.
- Agregar test de regresión cuando sea viable.
- Si se detecta causa raíz arquitectónica, escalar como pendiente separado.
