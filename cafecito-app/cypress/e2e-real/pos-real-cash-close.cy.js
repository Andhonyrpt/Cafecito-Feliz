describe('POS real cash close flow', () => {
  const sellerEmployeeId = 'EMP-9001';
  const pin = '12345';

  beforeEach(() => {
    cy.exec('npm --prefix ../cafecito-api run seed:e2e', { timeout: 120000 });
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();
  });

  it('opens and closes a real seller cash session with discrepancy', () => {
    cy.visit('/');

    cy.contains('Apertura de turno').should('be.visible');
    cy.wait(100);
    cy.get('[data-testid="cash-session-employee-id"]').type(sellerEmployeeId);
    cy.get('[data-testid="cash-session-pin"]').type(pin);
    cy.get('[data-testid="cash-session-initial-cash"]').type('100');
    cy.get('[data-testid="cash-session-open-submit"]').click();

    cy.contains('E2E Cafes', { timeout: 15000 }).should('be.visible');

    cy.get('.logout-button').click();
    cy.contains('Cierre de turno y caja', { timeout: 15000 }).should('be.visible');
    cy.contains('$100.00').should('be.visible');

    cy.get('[data-testid="cash-session-pin"]').type(pin);
    cy.contains('NO COINCIDE').click();
    cy.get('#session-discrepancy-reason').type('E2E cierre con discrepancia controlada');
    cy.get('[data-testid="cash-session-close-submit"]').click();

    cy.contains('Apertura de turno', { timeout: 15000 }).should('be.visible');
  });
});
