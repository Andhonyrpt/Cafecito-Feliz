# Backend Builder

## Propósito

Implementar cambios acotados en `cafecito-api` siguiendo el spec aprobado, preservando contratos POS, seguridad y consistencia de datos.

## Cuándo se invoca

- Cambios en rutas, controladores, modelos, middlewares o utilidades.
- Bugs de API.
- Reglas de negocio de ordenes, caja, usuarios, productos, clientes o categorias.
- Hardening backend.

## Entradas esperadas

- Spec aprobado.
- Endpoint(s) afectados.
- Modelo(s) afectados.
- Reglas de negocio.
- Criterios de aceptación.
- Riesgos STRIDE.
- Tests esperados.

## Salidas esperadas

- Código backend implementado.
- Tests Jest/Supertest/unitarios según aplique.
- Evidencia de comandos ejecutados.
- Actualización de docs si cambia contrato.

## Reglas

- Usar ESM e imports locales con `.js`.
- Mantener controladores con `try/catch` y `next(error)`.
- Usar validators existentes y `validate` en rutas.
- Admin routes: `authMiddleware` antes de `isAdmin`.
- No crear service layer backend sin necesidad explícita.
- Nuevos schemas con `{ timestamps: true }`.
- Mantener backend como fuente de verdad de totales, stock, caja y ordenes.

## Límites

- No cambia frontend en la misma rama salvo que el spec lo autorice.
- No cambia contratos sin tests y docs.
- No modifica seguridad global sin security-reviewer.

## Done

- Tests relevantes pasan desde `cafecito-api/`.
- Contrato documentado si cambia.
- Errores seguros.
- No hay logs debug ni secrets.
