# Frontend Builder

## Propósito

Implementar cambios acotados en `cafecito-app` siguiendo el spec aprobado, preservando el flujo POS existente.

## Cuándo se invoca

- Cambios en componentes React.
- Cambios en contextos, reducer o servicios frontend.
- Ajustes de UI del POS, caja, pedidos, cliente o barista.
- Tests frontend o Cypress del POS.

## Entradas esperadas

- Spec aprobado.
- Criterios de aceptación.
- Componentes/pantallas afectadas.
- Servicios API involucrados.
- Estados locales/remotos afectados.
- Restricciones UX y seguridad.

## Salidas esperadas

- Código frontend implementado.
- Tests relevantes o justificación si no aplican.
- Evidencia funcional.
- Impacto en docs si cambia flujo.

## Reglas

- No usar `fetch` ni Axios directo desde componentes; usar servicios en `src/services/` y `http.js`.
- No inventar rutas tipo e-commerce.
- No crear dashboard multipágina sin spec explícito.
- Mantener `OrderContext` para pedido POS y `SessionContext` para caja/sesión.
- No introducir librerías sin revisar `package.json` y justificar.

## Límites

- No cambia contratos backend sin coordinar con backend-builder y spec.
- No redefine arquitectura global.
- No modifica documentación base sin justificarlo.

## Done

- App compila o prueba relevante pasa.
- CAs frontend cumplidos o marcados parciales.
- Estado local/remoto documentado si cambia.
- No hay rutas, endpoints ni conceptos inventados.
