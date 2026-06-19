# Security Status

Ultima revision: 2026-06-18.

Este documento resume el estado de seguridad observado. La fuente detallada sigue siendo `cafecito-api/SECURITY_TEST_PLAN.md`, `SECURITY_TEST_MATRIX.md` y `SECURITY_PROGRESS.md`.

## Controles Implementados

| Area | Estado |
| --- | --- |
| Registro publico | Fuerza rol `vendedor`; no permite self-register admin |
| Login | Rechaza usuarios inactivos |
| Refresh | Rechaza usuarios inactivos |
| Auth middleware | Valida token, usuario existente y usuario activo |
| Admin routes | Usan `authMiddleware` antes de `isAdmin` |
| Verify PIN | Requiere autenticacion y rate limit |
| Check role | Validado y rate-limited; revisar si debe seguir publico |
| NoSQL injection | Validadores sensibles endurecidos |
| Error leakage | `previewOrder` ya no debe exponer stack en respuesta |
| Helmet | Activo en `server.js` |
| Body limit | `express.json({ limit: '100kb' })` activo |
| Auth rate limit | Aplicado de forma suave a auth |
| Prod audit | Documentado como limpio para `npm audit --omit=dev` en docs de seguridad |

## Pendientes de Seguridad

| Pendiente | Prioridad | Motivo |
| --- | --- | --- |
| Revocacion real de refresh tokens al logout | Alto | Logout no invalida refresh persistente |
| Pruebas dedicadas de brute force login/PIN | Alto | Matriz las mantiene pendientes o parcialmente cubiertas |
| Token antiguo en caja | Alto | Confirmar rechazo tras desactivar usuario/cambiar estado |
| Duplicados unicos con respuesta uniforme | Medio | Actualmente se documenta comportamiento del error handler |
| CORS tests | Medio | Config existe, falta prueba dedicada |
| Logs sin secretos | Medio | Requiere revision manual/test dedicada |
| Regex/search hardening | Medio | Clientes/categorias search requieren pruebas especificas |

## Riesgos Funcionales con Impacto de Seguridad

- Caja depende parcialmente de estado local del frontend.
- Si el PIN de cierre es regla critica, debe validarse tambien dentro del endpoint de cierre, no solo antes desde frontend.
- Refresh tokens reutilizables reducen valor de logout.
- Errores de duplicados pueden filtrar detalles internos si no se normalizan.

## Recomendaciones

1. Decidir politica de sesion: stateless simple o revocacion real.
2. Si se requiere revocacion, implementar store de refresh tokens o `tokenVersion` en `User`.
3. Agregar tests para brute force y token antiguo en caja.
4. Normalizar errores de Mongo conocidos: `E11000`, `CastError`, `ValidationError`.
5. Revisar logs para asegurar que no se escriben PIN/password/tokens.
6. Mantener `npm audit --omit=dev` como check de produccion.
