describe('POS real backend flow', () => {
  const sellerEmployeeId = 'EMP-9001';
  const baristaEmployeeId = 'EMP-9002';
  const pin = '12345';
  const categoryName = 'E2E Cafes';
  const productName = 'E2E Americano';
  const clientName = 'E2E Cliente';

  beforeEach(() => {
    cy.exec('npm --prefix ../cafecito-api run seed:e2e', { timeout: 120000 });
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();
  });

  it('creates a real POS order and lets the barista complete it', () => {
    cy.visit('/');

    cy.contains('Apertura de turno').should('be.visible');
    cy.wait(100);
    cy.get('[data-testid="cash-session-employee-id"]').type(sellerEmployeeId);
    cy.get('[data-testid="cash-session-pin"]').type(pin);
    cy.get('[data-testid="cash-session-initial-cash"]').type('100');
    cy.get('[data-testid="cash-session-open-submit"]').click();

    cy.contains(categoryName, { timeout: 15000 }).click();
    cy.contains(productName, { timeout: 15000 }).should('be.visible');

    cy.get(`[aria-label="Agregar ${productName} al pedido"]`).click();
    cy.contains(`Personalizar ${productName}`).should('be.visible');
    cy.get('[data-testid="modifier-confirm-add"]').click();

    cy.get('[aria-label="Buscar cliente por nombre o email"]').type('E2E');
    cy.contains(clientName, { timeout: 10000 }).click();
    cy.contains(clientName).should('be.visible');

    cy.get('[data-testid="order-checkout-button"]').click();
    cy.contains('Confirmación de Cobro', { timeout: 10000 }).should('be.visible');
    cy.contains('Total a Cobrar:').should('be.visible');
    cy.get('[data-testid="cash-received-input"]').type('50');
    cy.get('[data-testid="confirm-sale-button"]').click();

    cy.contains('Venta realizada', { timeout: 15000 }).should('be.visible');
    cy.contains('Nueva venta').click();

    cy.clearLocalStorage();
    cy.visit('/');

    cy.contains('Apertura de turno').should('be.visible');
    cy.wait(100);
    cy.get('[data-testid="cash-session-employee-id"]').type(baristaEmployeeId);
    cy.get('[data-testid="cash-session-pin"]').type(pin);
    cy.get('[data-testid="cash-session-open-submit"]').click();

    cy.contains('Mis órdenes asignadas', { timeout: 15000 }).should('be.visible');
    cy.contains(productName, { timeout: 15000 }).should('be.visible');
    cy.contains(clientName).should('be.visible');
    cy.contains('Marcar completada').click();

    cy.contains('No tienes órdenes pendientes por preparar.', { timeout: 15000 }).should('be.visible');
  });
});
