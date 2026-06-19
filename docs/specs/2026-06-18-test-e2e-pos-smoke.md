# Spec: E2E POS Smoke con Cypress

## Metadata
- **ID del pendiente:** QA-E2E-POS-001
- **Tipo:** docs | test
- **Complejidad:** M
- **Fecha:** 2026-06-18
- **Estado:** DONE

## Historia
Como equipo de desarrollo quiero una prueba E2E smoke del POS para validar apertura de caja, agregado de producto, preview y creación de orden sin depender de rutas o conceptos que no existen.

## Contexto
El proyecto tenía Cypress inicializado, pero no existían specs E2E útiles del POS. El sistema es un POS de cafetería; no debe probar flujos de e-commerce, envío, dashboard ni rutas no implementadas.

## Alcance
- Incluido en esta unidad de trabajo:
  - Scripts Cypress en `cafecito-app/package.json`.
  - Configuración base de Cypress.
  - Prueba smoke `cypress/e2e/pos-smoke.cy.js`.
  - Plan de pruebas E2E POS en `docs/test-plans/e2e-pos.md`.
  - Selectores `data-testid` mínimos para estabilidad de prueba.
- Fuera de alcance:
  - Suite E2E completa contra backend real.
  - Seed real de MongoDB.
  - Pruebas de barista, cierre de caja y cliente en esta iteración.
  - Integración de terminal bancaria real.
- Pendientes relacionados que no deben mezclarse en esta rama:
  - E2E con backend real.
  - E2E de cierre de caja.
  - E2E de barista completando órdenes.

## Criterios de Aceptación
- [x] CA-1: Existe al menos un spec Cypress de POS real.
- [x] CA-2: El spec no usa rutas de e-commerce ni recursos inexistentes.
- [x] CA-3: El flujo valida apertura de caja, producto, preview y creación de orden.
- [x] CA-4: Existen scripts `cypress:open`, `cypress:run` y `e2e`.
- [x] CA-5: Existe plan E2E documentado.

## Consideraciones de Seguridad
- Amenazas STRIDE identificadas: Spoofing de sesión en pruebas si se usan tokens reales; Tampering si mocks no reflejan contratos.
- Controles de mitigación: prueba smoke usa datos mockeados y token falso; no usa credenciales reales.
- Inputs que requieren validación: employeeId, PIN, monto inicial, monto recibido.
- Secrets involucrados: ninguno.
- Superficie de ataque afectada: ninguna en runtime productivo; solo testabilidad frontend.

## Dependencias
- Internas: `SessionContext`, `OrderContext`, `CashSession`, `ProductCard`, `ModifiersModal`, `OrderPanel`, `CheckoutConfirmationModal`.
- Externas: Cypress ya instalado en `cafecito-app`.

## Decisiones de Diseño
La primera prueba usa intercepts de API para ser estable y no depender de MongoDB ni de levantar `cafecito-api`. Las pruebas contra backend real quedan como siguiente capa.

## Riesgos y Deuda Técnica
- Los mocks deben mantenerse alineados con contratos reales.
- Faltan E2E de cierre de caja, barista y cliente.
- Faltan scripts para levantar frontend/API coordinados en CI.

## Pendientes Abiertos y Gaps Detectados
- Funcionalidades faltantes: E2E de cierre de caja, barista, cliente y errores.
- Comportamientos inconsistentes detectados: ninguno nuevo en esta iteración.
- Gaps entre frontend y backend: smoke con mocks no valida persistencia real.
- Persistencia pendiente de migrar: no aplica a esta unidad.
- Decisiones aplazadas: estrategia de E2E contra backend real y seed de datos.
- Trabajo fuera de alcance en esta iteración: CI E2E completo.
- Riesgos que requieren seguimiento: divergencia entre mocks y API real.
- Items que deben convertirse en backlog: QA-E2E-POS-002 backend real, QA-E2E-POS-003 cierre caja, QA-E2E-POS-004 barista.

## Resultados
- Fecha de cierre: 2026-06-18
- CAs cumplidos: CA-1, CA-2, CA-3, CA-4, CA-5
- CAs no cumplidos: ninguno
- Deuda técnica generada: mocks deben mantenerse alineados con API real
- Lecciones aprendidas: Cypress necesita selectores estables centrados en POS, no en flujos genéricos
- Pendientes abiertos confirmados: E2E de cierre de caja, barista y backend real
- Gaps no resueltos: validación con Mongo real
- Trabajo fuera de alcance confirmado: CI E2E completo
- Backlog derivado creado: sí
- Referencias a historias/tareas creadas: QA-E2E-POS-002, QA-E2E-POS-003, QA-E2E-POS-004

## Matriz de cierre

| Item detectado | Estado | Acción |
|---|---|---|
| Smoke POS mockeado | Implementado | Cerrar |
| E2E contra backend real | Fuera de alcance | Crear backlog |
| Cierre de caja E2E | Parcial | Crear backlog |
| Barista E2E | Parcial | Crear backlog |
| Flujos e-commerce | Obsoleto | No aplicar |
